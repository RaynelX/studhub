import { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { AdminPageHeader } from '../../../features/admin/components/ui/admin-page-header';
import { AdminCard } from '../../../features/admin/components/ui/admin-card';
import { AdminConfirmDialog } from '../../../features/admin/components/ui/admin-confirm-dialog';
import { useAdminToast } from '../../../features/admin/components/ui/admin-toast';
import { CategoryForm } from '../../../features/admin/components/subgroups/category-form';
import type { CategoryFormData } from '../../../features/admin/components/subgroups/category-form';
import { SubgroupForm } from '../../../features/admin/components/subgroups/subgroup-form';
import type { SubgroupFormData } from '../../../features/admin/components/subgroups/subgroup-form';
import type { SubgroupCategoryDoc, SubgroupDoc } from '../../../database/types';
import { useDatabase } from '../../providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useAdminWrite } from '../../../features/admin/hooks/use-admin-write';
import { useSubgroups } from '../../../features/targeting/SubgroupsProvider';

export function AdminSubgroupsPage() {
  const db = useDatabase();
  const { index, categories, subgroups, loading } = useSubgroups();
  const { insert, update, remove, loading: writeLoading } = useAdminWrite();
  const { showToast } = useAdminToast();

  // Записи, которые могут ссылаться на подгруппы — для счётчика использования
  const { data: entries } = useRxCollection(db.schedule);
  const { data: overrides } = useRxCollection(db.overrides);
  const { data: events } = useRxCollection(db.events);
  const { data: deadlines } = useRxCollection(db.deadlines);
  const { data: homeworks } = useRxCollection(db.homeworks);
  const { data: students } = useRxCollection(db.students);

  const usageCount = useMemo(() => {
    const counts = new Map<string, number>();

    const bump = (ids: string[] | undefined) => {
      for (const id of ids ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    };

    for (const e of entries) if (!e.is_deleted) bump(e.target_subgroup_ids);
    for (const o of overrides) if (!o.is_deleted) bump(o.target_subgroup_ids);
    for (const e of events) if (!e.is_deleted) bump(e.target_subgroup_ids);
    for (const d of deadlines) if (!d.is_deleted) bump(d.target_subgroup_ids);
    for (const h of homeworks) if (!h.is_deleted) bump(h.target_subgroup_ids);
    for (const s of students) if (!s.is_deleted) bump(s.subgroup_ids);

    return counts;
  }, [entries, overrides, events, deadlines, homeworks, students]);

  // ── Modal state ───────────────────────────────────────────

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<SubgroupCategoryDoc | null>(null);

  const [subgroupFormOpen, setSubgroupFormOpen] = useState(false);
  const [editSubgroup, setEditSubgroup] = useState<SubgroupDoc | null>(null);
  const [subgroupCategory, setSubgroupCategory] = useState<SubgroupCategoryDoc | null>(null);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ── Categories ────────────────────────────────────────────

  async function handleCategorySubmit(data: CategoryFormData) {
    const payload = {
      name: data.name,
      code: data.code,
      short_name: data.shortName || null,
      description: data.description || null,
      is_required: data.isRequired,
      visible_if_subgroup_ids: data.visibleIfSubgroupIds,
    };

    try {
      if (editCategory) {
        await update('subgroup_categories', editCategory.id, payload);
        showToast('success', 'Категория обновлена');
      } else {
        await insert('subgroup_categories', {
          ...payload,
          sort_order: categories.length,
          is_archived: false,
          is_deleted: false,
        });
        showToast('success', 'Категория создана');
      }
    } catch {
      showToast('error', 'Не удалось сохранить категорию');
    }
  }

  async function moveCategory(category: SubgroupCategoryDoc, delta: -1 | 1) {
    const ordered = index.categories;
    const from = ordered.findIndex((c) => c.id === category.id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ordered.length) return;

    try {
      await update('subgroup_categories', ordered[from].id, { sort_order: to });
      await update('subgroup_categories', ordered[to].id, { sort_order: from });
    } catch {
      showToast('error', 'Не удалось изменить порядок');
    }
  }

  async function toggleCategoryArchive(category: SubgroupCategoryDoc) {
    try {
      await update('subgroup_categories', category.id, {
        is_archived: !category.is_archived,
      });
      showToast('success', category.is_archived ? 'Категория возвращена' : 'Категория в архиве');
    } catch {
      showToast('error', 'Не удалось изменить категорию');
    }
  }

  function requestDeleteCategory(category: SubgroupCategoryDoc) {
    const children = subgroups.filter((s) => s.category_id === category.id);
    const used = children.reduce((sum, s) => sum + (usageCount.get(s.id) ?? 0), 0);

    setConfirmState({
      title: 'Удалить категорию?',
      message:
        used > 0
          ? `«${category.name}» и ${children.length} подгрупп(ы) будут удалены. ` +
            `На них ссылаются ${used} записей — эти записи перестанут показываться кому-либо. ` +
            'Обычно лучше отправить категорию в архив.'
          : `«${category.name}» и ${children.length} подгрупп(ы) будут удалены.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          for (const child of children) {
            await remove('subgroups', child.id);
          }
          await remove('subgroup_categories', category.id);
          showToast('success', 'Категория удалена');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  // ── Subgroups ─────────────────────────────────────────────

  async function handleSubgroupSubmit(data: SubgroupFormData) {
    if (!subgroupCategory) return;

    const payload = {
      name: data.name,
      code: data.code,
      short_name: data.shortName || null,
      description: data.description || null,
    };

    try {
      if (editSubgroup) {
        await update('subgroups', editSubgroup.id, payload);
        showToast('success', 'Подгруппа обновлена');
      } else {
        await insert('subgroups', {
          ...payload,
          category_id: subgroupCategory.id,
          sort_order: subgroups.filter((s) => s.category_id === subgroupCategory.id).length,
          is_archived: false,
          is_deleted: false,
        });
        showToast('success', 'Подгруппа создана');
      }
    } catch {
      showToast('error', 'Не удалось сохранить подгруппу');
    }
  }

  async function toggleSubgroupArchive(subgroup: SubgroupDoc) {
    try {
      await update('subgroups', subgroup.id, { is_archived: !subgroup.is_archived });
      showToast('success', subgroup.is_archived ? 'Подгруппа возвращена' : 'Подгруппа в архиве');
    } catch {
      showToast('error', 'Не удалось изменить подгруппу');
    }
  }

  function requestDeleteSubgroup(subgroup: SubgroupDoc) {
    const used = usageCount.get(subgroup.id) ?? 0;

    setConfirmState({
      title: 'Удалить подгруппу?',
      message:
        used > 0
          ? `«${subgroup.name}» используется в ${used} записях. После удаления эти записи ` +
            'перестанут показываться кому-либо. Обычно лучше отправить подгруппу в архив.'
          : `«${subgroup.name}» будет удалена.`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await remove('subgroups', subgroup.id);
          showToast('success', 'Подгруппа удалена');
        } catch {
          showToast('error', 'Не удалось удалить');
        }
      },
    });
  }

  // ── Render ────────────────────────────────────────────────

  const conditionLabel = (category: SubgroupCategoryDoc): string =>
    category.visible_if_subgroup_ids
      .map((id) => index.subgroupById.get(id)?.name)
      .filter(Boolean)
      .join(', ');

  return (
    <>
      <AdminPageHeader
        title="Подгруппы"
        description="Как группа делится на подгруппы в этом семестре"
        actions={
          <button
            onClick={() => { setEditCategory(null); setCategoryFormOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить категорию
          </button>
        }
      />

      {loading ? (
        <AdminCard>
          <div className="py-12 text-center text-neutral-400 text-sm">Загрузка…</div>
        </AdminCard>
      ) : index.categories.length === 0 ? (
        <AdminCard>
          <div className="py-12 text-center text-neutral-400 dark:text-neutral-500 text-sm max-w-md mx-auto">
            Подгрупп пока нет. Категория — это способ деления группы: иностранный
            язык, ОИТ, элективный курс. Внутри категории заводятся подгруппы,
            из которых студент выбирает свою.
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {index.categories.map((category, idx) => {
            const doc = categories.find((c) => c.id === category.id);
            if (!doc) return null;

            const children = index.subgroupsByCategory.get(category.id) ?? [];
            const condition = conditionLabel(doc);

            return (
              <AdminCard key={category.id} noPadding className={doc.is_archived ? 'opacity-60' : ''}>
                {/* Category header */}
                <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {category.name}
                      </h2>
                      {doc.short_name && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                          {doc.short_name}
                        </span>
                      )}
                      {!doc.is_required && (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          необязательная
                        </span>
                      )}
                      {doc.is_archived && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">архив</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {condition
                        ? `Показывается тем, кто выбрал: ${condition}`
                        : 'Показывается всем'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton
                      title="Выше"
                      disabled={idx === 0}
                      onClick={() => moveCategory(doc, -1)}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      title="Ниже"
                      disabled={idx === index.categories.length - 1}
                      onClick={() => moveCategory(doc, 1)}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      title={doc.is_archived ? 'Вернуть из архива' : 'В архив'}
                      onClick={() => toggleCategoryArchive(doc)}
                    >
                      {doc.is_archived ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </IconButton>
                    <IconButton
                      title="Редактировать"
                      onClick={() => { setEditCategory(doc); setCategoryFormOpen(true); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </IconButton>
                    <IconButton title="Удалить" danger onClick={() => requestDeleteCategory(doc)}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>

                {/* Subgroups */}
                <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
                  {children.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-neutral-400 dark:text-neutral-500">
                      Подгрупп нет
                    </div>
                  ) : (
                    children.map((subgroup) => {
                      const subDoc = subgroups.find((s) => s.id === subgroup.id);
                      if (!subDoc) return null;
                      const used = usageCount.get(subgroup.id) ?? 0;

                      return (
                        <div
                          key={subgroup.id}
                          className={`flex items-center justify-between gap-3 px-5 py-2.5 ${
                            subDoc.is_archived ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-neutral-900 dark:text-neutral-100">
                              {subgroup.name}
                              {subDoc.short_name && (
                                <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
                                  {subDoc.short_name}
                                </span>
                              )}
                              {subDoc.is_archived && (
                                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                                  архив
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400 dark:text-neutral-500">
                              {subDoc.description && `${subDoc.description} · `}
                              {used > 0 ? `используется в ${used} записях` : 'не используется'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <IconButton
                              title={subDoc.is_archived ? 'Вернуть из архива' : 'В архив'}
                              onClick={() => toggleSubgroupArchive(subDoc)}
                            >
                              {subDoc.is_archived ? (
                                <ArchiveRestore className="w-4 h-4" />
                              ) : (
                                <Archive className="w-4 h-4" />
                              )}
                            </IconButton>
                            <IconButton
                              title="Редактировать"
                              onClick={() => {
                                setSubgroupCategory(doc);
                                setEditSubgroup(subDoc);
                                setSubgroupFormOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </IconButton>
                            <IconButton
                              title="Удалить"
                              danger
                              onClick={() => requestDeleteSubgroup(subDoc)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => {
                      setSubgroupCategory(doc);
                      setEditSubgroup(null);
                      setSubgroupFormOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить подгруппу
                  </button>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      <CategoryForm
        open={categoryFormOpen}
        onClose={() => { setCategoryFormOpen(false); setEditCategory(null); }}
        onSubmit={handleCategorySubmit}
        editCategory={editCategory}
        categories={categories}
        subgroups={subgroups}
      />

      <SubgroupForm
        open={subgroupFormOpen}
        onClose={() => { setSubgroupFormOpen(false); setEditSubgroup(null); }}
        onSubmit={handleSubgroupSubmit}
        editSubgroup={editSubgroup}
        categoryName={subgroupCategory?.name ?? ''}
        siblings={subgroups.filter((s) => s.category_id === subgroupCategory?.id)}
      />

      <AdminConfirmDialog
        open={confirmState !== null}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        variant="danger"
        confirmLabel="Удалить"
        loading={writeLoading}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? 'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-600 dark:hover:text-neutral-200'
      }`}
    >
      {children}
    </button>
  );
}
