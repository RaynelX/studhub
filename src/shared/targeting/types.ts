/**
 * Гибкая система подгрупп.
 *
 * Группа делится на независимые «категории» (иностранный язык, ОИТ, элективный курс...).
 * Внутри категории — подгруппы. Студент состоит ровно в одной подгруппе каждой
 * видимой ему категории; запись расписания нацелена на произвольный набор подгрупп.
 *
 * Здесь описаны только структурные формы, нужные чистым функциям из match.ts —
 * документы RxDB (`SubgroupCategoryDoc`, `SubgroupDoc`) расширяют их в database/types.ts.
 */

export interface TargetCategory {
  id: string;
  name: string;
  /** Короткая подпись для бейджей: «Яз.», «ОИТ» */
  short_name?: string;
  /** Подсказка на экране настройки */
  description?: string;
  sort_order: number;
  /** Должен ли студент обязательно выбрать подгруппу этой категории */
  is_required: boolean;
  /** Архивная категория не предлагается студенту и не появляется в формах админки */
  is_archived: boolean;
  /**
   * Категория спрашивается, только если студент выбрал одну из этих подгрупп.
   * Пустой массив — спрашивать всегда.
   */
  visible_if_subgroup_ids: string[];
}

export interface TargetSubgroup {
  id: string;
  category_id: string;
  name: string;
  /** Короткая подпись для бейджей: «EN», «А» */
  short_name?: string;
  /** Подсказка для студента: фамилия преподавателя, аудитория и т.п. */
  description?: string;
  sort_order: number;
  is_archived: boolean;
}

/**
 * Любая запись, которую можно нацелить на подгруппы.
 * Пустой или отсутствующий массив — запись для всей группы.
 */
export interface TargetedRecord {
  target_subgroup_ids?: string[];
}

/** Выбор студента: id категории → id подгруппы */
export type SubgroupSelection = Record<string, string>;

/** Предикат «эта запись предназначена текущему студенту» */
export type StudentPredicate = (record: TargetedRecord) => boolean;

/** Разобранные и проиндексированные категории с подгруппами */
export interface SubgroupIndex {
  /** Все категории, отсортированные по sort_order (включая архивные) */
  categories: TargetCategory[];
  /** Неархивные категории, отсортированные по sort_order */
  activeCategories: TargetCategory[];
  categoryById: Map<string, TargetCategory>;
  subgroupById: Map<string, TargetSubgroup>;
  /** id категории → её подгруппы, отсортированные по sort_order (включая архивные) */
  subgroupsByCategory: Map<string, TargetSubgroup[]>;
}
