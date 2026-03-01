import { useState, useEffect } from 'react';
import { AdminModal } from '../ui/admin-modal';
import type { StudentDoc } from '../../../../database/types';

export interface StudentFormData {
  fullName: string;
  language: 'en' | 'de' | 'fr' | 'es';
  engSubgroup: 'a' | 'b' | '';
  oitSubgroup: 'a' | 'b';
}

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<void> | void;
  editStudent?: StudentDoc | null;
}

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'Английский' },
  { value: 'de', label: 'Немецкий' },
  { value: 'fr', label: 'Французский' },
  { value: 'es', label: 'Испанский' },
] as const;

function buildInitial(student?: StudentDoc | null): StudentFormData {
  return {
    fullName: student?.full_name ?? '',
    language: student?.language ?? 'en',
    engSubgroup: student?.eng_subgroup ?? '',
    oitSubgroup: student?.oit_subgroup ?? 'a',
  };
}

export function StudentForm({ open, onClose, onSubmit, editStudent }: StudentFormProps) {
  const [form, setForm] = useState<StudentFormData>(buildInitial(editStudent));
  const isEdit = !!editStudent;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(buildInitial(editStudent));
  }, [open, editStudent]);

  function update<K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Show EN subgroup only when language is English
  const showEngSubgroup = form.language === 'en';

  async function handleSubmit() {
    await onSubmit(form);
    onClose();
  }

  const isValid = form.fullName.trim() !== '';

  const inputCls =
    'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Редактировать студента' : 'Новый студент'}
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
            {isEdit ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Full name */}
        <div>
          <label className={labelCls}>ФИО *</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            placeholder="Иванов Иван Иванович"
            className={inputCls}
          />
        </div>

        {/* Language */}
        <div>
          <label className={labelCls}>Иностранный язык</label>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  update('language', opt.value);
                  if (opt.value !== 'en') update('engSubgroup', '');
                }}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.language === opt.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-300'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* EN subgroup (only if language = en) */}
        {showEngSubgroup && (
          <div>
            <label className={labelCls}>EN подгруппа</label>
            <div className="flex gap-2">
              {(['a', 'b'] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => update('engSubgroup', val)}
                  className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
                    form.engSubgroup === val
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-300'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {val.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OIT subgroup */}
        <div>
          <label className={labelCls}>ОИТ подгруппа</label>
          <div className="flex gap-2">
            {(['a', 'b'] as const).map((val) => (
              <button
                key={val}
                onClick={() => update('oitSubgroup', val)}
                className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.oitSubgroup === val
                    ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-300'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {val.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
