import type {
  SubgroupIndex,
  SubgroupSelection,
  TargetCategory,
  TargetSubgroup,
  TargetedRecord,
} from './types';

// ============================================================
// Индекс
// ============================================================

const bySortOrder = <T extends { sort_order: number; name: string }>(a: T, b: T): number =>
  a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'ru');

export function buildSubgroupIndex(
  categories: TargetCategory[],
  subgroups: TargetSubgroup[],
): SubgroupIndex {
  const sortedCategories = [...categories].sort(bySortOrder);
  const categoryById = new Map(sortedCategories.map((c) => [c.id, c]));

  const subgroupById = new Map<string, TargetSubgroup>();
  const subgroupsByCategory = new Map<string, TargetSubgroup[]>();

  for (const subgroup of [...subgroups].sort(bySortOrder)) {
    subgroupById.set(subgroup.id, subgroup);
    const bucket = subgroupsByCategory.get(subgroup.category_id);
    if (bucket) {
      bucket.push(subgroup);
    } else {
      subgroupsByCategory.set(subgroup.category_id, [subgroup]);
    }
  }

  return {
    categories: sortedCategories,
    activeCategories: sortedCategories.filter((c) => !c.is_archived),
    categoryById,
    subgroupById,
    subgroupsByCategory,
  };
}

/** Пустой индекс — пока категории не приехали из синхронизации. */
export const EMPTY_SUBGROUP_INDEX: SubgroupIndex = buildSubgroupIndex([], []);

/** Подгруппы категории: только актуальные, плюс те, что уже выбраны/используются. */
export function subgroupsOf(
  index: SubgroupIndex,
  categoryId: string,
  includeArchived = false,
): TargetSubgroup[] {
  const all = index.subgroupsByCategory.get(categoryId) ?? [];
  return includeArchived ? all : all.filter((s) => !s.is_archived);
}

// ============================================================
// Сопоставление
// ============================================================

/**
 * Есть ли в наборе ссылка на подгруппу, которой больше нет в справочнике.
 * Такую запись не видит никто, поэтому она и не конфликтует ни с чем.
 *
 * Пока справочник не загружен, неизвестны вообще все id — в этом случае
 * не делаем выводов, иначе при старте приложения пропали бы все конфликты
 * и зачёркивания.
 */
function hasOrphanTargets(targetIds: string[], index: SubgroupIndex): boolean {
  if (index.subgroupById.size === 0) return false;
  return targetIds.some((id) => !index.subgroupById.has(id));
}

/**
 * Группирует набор целевых подгрупп по категориям.
 * Подгруппа, которой нет в индексе (её жёстко удалили), получает собственный
 * несуществующий ключ — такая запись не совпадёт ни с одним студентом.
 */
function groupByCategory(
  targetIds: string[],
  index: SubgroupIndex,
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const id of targetIds) {
    const subgroup = index.subgroupById.get(id);
    const key = subgroup ? subgroup.category_id : `__unknown:${id}`;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(id);
    } else {
      grouped.set(key, [id]);
    }
  }

  return grouped;
}

/**
 * Главное правило системы.
 *
 * Пустой набор — запись для всей группы. Иначе: по каждой категории, упомянутой
 * в наборе, выбор студента должен попадать в набор. Категории, не упомянутые
 * в наборе, ничего не ограничивают.
 *
 * Следствие: если студент ещё не выбрал подгруппу в упомянутой категории,
 * запись ему не показывается — вместо этого SettingsProvider просит выбрать.
 */
export function matchesStudent(
  targetIds: string[] | undefined,
  selection: SubgroupSelection,
  index: SubgroupIndex,
): boolean {
  if (!targetIds || targetIds.length === 0) return true;

  for (const [categoryId, ids] of groupByCategory(targetIds, index)) {
    const chosen = selection[categoryId];
    if (!chosen || !ids.includes(chosen)) return false;
  }

  return true;
}

/** Готовый предикат для фильтрации коллекций. */
export function createStudentPredicate(
  selection: SubgroupSelection,
  index: SubgroupIndex,
): (record: TargetedRecord) => boolean {
  return (record) => matchesStudent(record.target_subgroup_ids, selection, index);
}

/**
 * Пересекаются ли две выборки — то есть существует ли студент, которому видны
 * обе записи. Нужно детектору конфликтов и зачёркиванию отменённых пар в сетке.
 */
export function targetsOverlap(
  a: string[] | undefined,
  b: string[] | undefined,
  index: SubgroupIndex,
): boolean {
  // Осиротевшую запись не видит никто — ни конфликтов, ни зачёркиваний.
  // Проверяется до сокращений «пусто = вся группа», иначе такая запись
  // пересекалась бы со всем подряд.
  if (a && a.length > 0 && hasOrphanTargets(a, index)) return false;
  if (b && b.length > 0 && hasOrphanTargets(b, index)) return false;

  if (!a || a.length === 0) return true;
  if (!b || b.length === 0) return true;

  const groupedA = groupByCategory(a, index);
  const groupedB = groupByCategory(b, index);

  for (const [categoryId, idsA] of groupedA) {
    const idsB = groupedB.get(categoryId);
    // Категория не ограничена со второй стороны — пересечению не мешает.
    if (!idsB) continue;
    if (!idsA.some((id) => idsB.includes(id))) return false;
  }

  return true;
}

/** Канонический ключ выборки — для сравнения и дедупликации наборов. */
export function targetSetKey(targetIds: string[] | undefined): string {
  return [...(targetIds ?? [])].sort().join('|');
}

/**
 * Различные выборки среди нескольких записей.
 *
 * Объединять их в один набор НЕЛЬЗЯ: внутри набора id разных категорий
 * соединяются по И. Например, из пар, адресованных [англ-А] и [ОИТ-Б],
 * плоское объединение [англ-А, ОИТ-Б] означало бы «тем, кто и в англ-А,
 * и в ОИТ-Б», то есть пересечение вместо объединения аудиторий.
 * Дизъюнкцию выражаем отдельной записью на каждый набор.
 *
 * Если хоть одна запись адресована всей группе, достаточно одного
 * пустого набора — он и так покрывает всех.
 */
export function distinctTargetSets(targets: (string[] | undefined)[]): string[][] {
  const seen = new Map<string, string[]>();

  for (const ids of targets) {
    if (!ids || ids.length === 0) return [[]];
    seen.set(targetSetKey(ids), ids);
  }

  return [...seen.values()];
}

// ============================================================
// Видимость категорий для студента
// ============================================================

function selectedIds(selection: SubgroupSelection): Set<string> {
  return new Set(Object.values(selection));
}

/**
 * Плоский список подгрупп студента (как он хранится в таблице students)
 * → выбор по категориям. Лишние подгруппы одной категории отбрасываются:
 * студент состоит ровно в одной подгруппе каждой категории.
 */
export function selectionFromIds(
  ids: string[] | undefined,
  index: SubgroupIndex,
): SubgroupSelection {
  const selection: SubgroupSelection = {};
  if (!ids) return selection;

  for (const id of ids) {
    const subgroup = index.subgroupById.get(id);
    if (subgroup && !selection[subgroup.category_id]) {
      selection[subgroup.category_id] = id;
    }
  }

  return selection;
}

export function idsFromSelection(selection: SubgroupSelection): string[] {
  return Object.values(selection);
}

/**
 * Категории, которые нужно показать студенту при текущем выборе.
 * Архивные не показываются; условные — только когда выполнено условие.
 */
export function visibleCategories(
  index: SubgroupIndex,
  selection: SubgroupSelection,
): TargetCategory[] {
  const chosen = selectedIds(selection);

  return index.activeCategories.filter(
    (category) =>
      category.visible_if_subgroup_ids.length === 0 ||
      category.visible_if_subgroup_ids.some((id) => chosen.has(id)),
  );
}

/**
 * Действителен ли выбор студента в категории: подгруппа существует,
 * принадлежит этой категории и не в архиве. Архивная подгруппа считается
 * устаревшей — её в этом семестре уже нет, значит нужно выбрать заново.
 */
export function hasValidSelection(
  index: SubgroupIndex,
  categoryId: string,
  selection: SubgroupSelection,
): boolean {
  const subgroup = index.subgroupById.get(selection[categoryId]);
  return Boolean(subgroup && subgroup.category_id === categoryId && !subgroup.is_archived);
}

/**
 * Видимые обязательные категории, в которых студент ещё не выбрал подгруппу.
 *
 * Категории без подгрупп пропускаются: выбирать там нечего, и требование
 * заблокировало бы вход в приложение до тех пор, пока староста их не заведёт.
 */
export function missingRequiredCategories(
  index: SubgroupIndex,
  selection: SubgroupSelection,
): TargetCategory[] {
  return visibleCategories(index, selection).filter(
    (category) =>
      category.is_required &&
      subgroupsOf(index, category.id).length > 0 &&
      !hasValidSelection(index, category.id, selection),
  );
}

/**
 * Приводит выбор студента в согласованное состояние: убирает ссылки на исчезнувшие
 * подгруппы и выборы в категориях, переставших быть видимыми. Повторяется до
 * стабилизации, потому что снятие одного выбора может скрыть зависимую категорию.
 */
export function pruneSelection(
  index: SubgroupIndex,
  selection: SubgroupSelection,
): SubgroupSelection {
  let current: SubgroupSelection = {};

  for (const [categoryId, subgroupId] of Object.entries(selection)) {
    const subgroup = index.subgroupById.get(subgroupId);
    if (subgroup && subgroup.category_id === categoryId) {
      current[categoryId] = subgroupId;
    }
  }

  // Фикс-пойнт: категорий единицы, так что цикла по их количеству заведомо хватает.
  for (let pass = 0; pass <= index.categories.length; pass++) {
    const visible = new Set(visibleCategories(index, current).map((c) => c.id));
    const next: SubgroupSelection = {};
    let changed = false;

    for (const [categoryId, subgroupId] of Object.entries(current)) {
      if (visible.has(categoryId)) {
        next[categoryId] = subgroupId;
      } else {
        changed = true;
      }
    }

    current = next;
    if (!changed) break;
  }

  return current;
}

// ============================================================
// Отображение
// ============================================================

function subgroupLabel(subgroup: TargetSubgroup): string {
  return subgroup.short_name || subgroup.name;
}

/**
 * Бейджи выборки: ["Яз-EN", "ОИТ-Б"]. Пустой массив — запись для всей группы.
 * Неизвестные подгруппы показываются как «?», чтобы староста заметил осиротевшую ссылку.
 */
export function formatTargetLabels(
  targetIds: string[] | undefined,
  index: SubgroupIndex,
): string[] {
  if (!targetIds || targetIds.length === 0) return [];

  const grouped = groupByCategory(targetIds, index);
  const labels: { order: number; text: string }[] = [];

  for (const [categoryId, ids] of grouped) {
    const category = index.categoryById.get(categoryId);
    const parts = ids.map((id) => {
      const subgroup = index.subgroupById.get(id);
      return subgroup ? subgroupLabel(subgroup) : '?';
    });

    const body = parts.join('/');
    const prefix = category?.short_name;

    labels.push({
      order: category?.sort_order ?? Number.MAX_SAFE_INTEGER,
      text: prefix ? `${prefix}-${body}` : body,
    });
  }

  return labels.sort((a, b) => a.order - b.order).map((l) => l.text);
}

/** Однострочное представление выборки: «Яз-EN / ОИТ-Б». */
export function formatTargetsCompact(
  targetIds: string[] | undefined,
  index: SubgroupIndex,
  separator = ' / ',
): string {
  return formatTargetLabels(targetIds, index).join(separator);
}

/** Полные названия выбранных подгрупп — для подробных экранов. */
export function formatTargetsFull(
  targetIds: string[] | undefined,
  index: SubgroupIndex,
  separator = ', ',
): string {
  if (!targetIds || targetIds.length === 0) return '';

  return targetIds
    .map((id) => index.subgroupById.get(id))
    .filter((s): s is TargetSubgroup => Boolean(s))
    .sort(bySortOrder)
    .map((s) => s.name)
    .join(separator);
}
