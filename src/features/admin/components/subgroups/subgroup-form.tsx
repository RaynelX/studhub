import { useState, useEffect } from 'react';
import { AdminModal } from '../ui/admin-modal';
import type { SubgroupDoc } from '../../../../database/types';
import { slugify, uniqueCode } from './slugify';

export interface SubgroupFormData {
  name: string;
  shortName: string;
  code: string;
  description: string;
}

interface SubgroupFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SubgroupFormData) => Promise<void> | void;
  editSubgroup?: SubgroupDoc | null;
  categoryName: string;
  /** Подгруппы той же категории — коды уникальны внутри категории */
  siblings: SubgroupDoc[];
}

function buildInitial(subgroup?: SubgroupDoc | null): SubgroupFormData {
  return {
    name: subgroup?.name ?? '',
    shortName: subgroup?.short_name ?? '',
    code: subgroup?.code ?? '',
    description: subgroup?.description ?? '',
  };
}

export function SubgroupForm({
  open,
  onClose,
  onSubmit,
  editSubgroup,
  categoryName,
  siblings,
}: SubgroupFormProps) {
  const [form, setForm] = useState<SubgroupFormData>(buildInitial(editSubgroup));
  const isEdit = !!editSubgroup;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(buildInitial(editSubgroup));
  }, [open, editSubgroup]);

  function update<K extends keyof SubgroupFormData>(key: K, value: SubgroupFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      code: isEdit || prev.code !== slugify(prev.name) ? prev.code : slugify(name),
    }));
  }

  async function handleSubmit() {
    const takenCodes = siblings
      .filter((s) => s.id !== editSubgroup?.id)
      .map((s) => s.code);

    await onSubmit({
      ...form,
      name: form.name.trim(),
      code: uniqueCode(slugify(form.code || form.name), takenCodes),
    });
    onClose();
  }

  const isValid = form.name.trim() !== '';

  const inputCls =
    'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Редактировать подгруппу' : `Новая подгруппа · ${categoryName}`}
      width="sm"
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
            placeholder="Английский"
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
              placeholder="EN"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Код</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              placeholder="en"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Подсказка</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Фамилия преподавателя"
            className={inputCls}
          />
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Показывается студенту под названием подгруппы при выборе
          </p>
        </div>
      </div>
    </AdminModal>
  );
}
