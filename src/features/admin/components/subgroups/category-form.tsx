import { useState, useEffect } from 'react';
import { AdminModal } from '../ui/admin-modal';
import type { SubgroupCategoryDoc, SubgroupDoc } from '../../../../database/types';
import { slugify, uniqueCode } from './slugify';

export interface CategoryFormData {
  name: string;
  shortName: string;
  code: string;
  description: string;
  isRequired: boolean;
  visibleIfSubgroupIds: string[];
}

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void> | void;
  editCategory?: SubgroupCategoryDoc | null;
  /** Все категории — нужны для списка условий показа */
  categories: SubgroupCategoryDoc[];
  subgroups: SubgroupDoc[];
}

function buildInitial(category?: SubgroupCategoryDoc | null): CategoryFormData {
  return {
    name: category?.name ?? '',
    shortName: category?.short_name ?? '',
    code: category?.code ?? '',
    description: category?.description ?? '',
    isRequired: category?.is_required ?? true,
    visibleIfSubgroupIds: category?.visible_if_subgroup_ids ?? [],
  };
}

export function CategoryForm({
  open,
  onClose,
  onSubmit,
  editCategory,
  categories,
  subgroups,
}: CategoryFormProps) {
  const [form, setForm] = useState<CategoryFormData>(buildInitial(editCategory));
  const isEdit = !!editCategory;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(buildInitial(editCategory));
  }, [open, editCategory]);

  function update<K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    // Код генерируется из названия, пока староста не задал его вручную
    setForm((prev) => ({
      ...prev,
      name,
      code:
        isEdit || prev.code !== slugify(prev.name)
          ? prev.code
          : slugify(name),
    }));
  }

  function toggleCondition(subgroupId: string) {
    update(
      'visibleIfSubgroupIds',
      form.visibleIfSubgroupIds.includes(subgroupId)
        ? form.visibleIfSubgroupIds.filter((id) => id !== subgroupId)
        : [...form.visibleIfSubgroupIds, subgroupId],
    );
  }

  async function handleSubmit() {
    const takenCodes = categories
      .filter((c) => c.id !== editCategory?.id)
      .map((c) => c.code);

    await onSubmit({
      ...form,
      name: form.name.trim(),
      code: uniqueCode(slugify(form.code || form.name), takenCodes),
    });
    onClose();
  }

  const isValid = form.name.trim() !== '';

  // Условие можно строить только по подгруппам других категорий
  const otherCategories = categories.filter(
    (c) => c.id !== editCategory?.id && !c.is_archived,
  );

  const inputCls =
    'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Редактировать категорию' : 'Новая категория'}
      width="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Название *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Иностранный язык"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Короткое название</label>
            <input
              type="text"
              value={form.shortName}
              onChange={(e) => update('shortName', e.target.value)}
              placeholder="Яз."
              className={inputCls}
            />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Для бейджей в сетке расписания
            </p>
          </div>
          <div>
            <label className={labelCls}>Код</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              placeholder="lang"
              className={inputCls}
            />
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Используется в уведомлениях, менять не нужно
            </p>
          </div>
        </div>

        <div>
          <label className={labelCls}>Подсказка для студента</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Выберите язык, который вы изучаете"
            className={inputCls}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={form.isRequired}
            onChange={(e) => update('isRequired', e.target.checked)}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
          Обязательная — студента попросят выбрать подгруппу при входе
        </label>

        {otherCategories.length > 0 && (
          <div>
            <label className={labelCls}>Показывать, только если выбрано</label>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
              Ничего не отмечено — категорию видят все. Например, «Подгруппа по
              английскому» показывается только тем, кто выбрал английский язык.
            </p>
            <div className="space-y-2">
              {otherCategories.map((category) => {
                const options = subgroups.filter(
                  (s) => s.category_id === category.id && !s.is_archived,
                );
                if (options.length === 0) return null;

                return (
                  <div key={category.id}>
                    <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                      {category.name}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {options.map((subgroup) => (
                        <button
                          key={subgroup.id}
                          type="button"
                          onClick={() => toggleCondition(subgroup.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            form.visibleIfSubgroupIds.includes(subgroup.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {subgroup.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}
