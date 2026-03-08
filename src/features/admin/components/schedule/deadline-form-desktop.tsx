import { useState, useEffect } from 'react';
import type {
  SubjectDoc,
  TargetLanguage,
  TargetEngSubgroup,
  TargetOitSubgroup,
} from '../../../../database/types';
import { AdminModal } from '../ui/admin-modal';

export interface DeadlineFormData {
  description: string;
  date: string;
  time: string;
  subjectId: string;
  targetLanguage: TargetLanguage;
  targetEngSubgroup: TargetEngSubgroup;
  targetOitSubgroup: TargetOitSubgroup;
}

interface DeadlineFormDesktopProps {
  open: boolean;
  onClose: () => void;
  subjects: SubjectDoc[];
  onSubmit: (data: DeadlineFormData) => void;
  initialDate?: string;
}

export function DeadlineFormDesktop({
  open,
  onClose,
  subjects,
  onSubmit,
  initialDate = '',
}: DeadlineFormDesktopProps) {
  const buildInitial = (): DeadlineFormData => ({
    description: '',
    date: initialDate,
    time: '',
    subjectId: '',
    targetLanguage: 'all',
    targetEngSubgroup: 'all',
    targetOitSubgroup: 'all',
  });

  const [form, setForm] = useState<DeadlineFormData>(buildInitial);

  useEffect(() => {
    if (open) setForm(buildInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update<K extends keyof DeadlineFormData>(key: K, value: DeadlineFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    onSubmit(form);
    onClose();
  }

  const isValid = form.date !== '';

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Создать дедлайн"
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
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Создать
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Дата *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Время</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => update('time', e.target.value)}
              className="w-48 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Предмет</label>
          <select
            value={form.subjectId}
            onChange={(e) => update('subjectId', e.target.value)}
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">—</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            placeholder="Что нужно сделать"
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>

        {/* Subgroups */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Язык</label>
            <select
              value={form.targetLanguage}
              onChange={(e) => update('targetLanguage', e.target.value as TargetLanguage)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Все</option>
              <option value="en">EN</option>
              <option value="de">DE</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">EN подгруппа</label>
            <select
              value={form.targetEngSubgroup}
              onChange={(e) => update('targetEngSubgroup', e.target.value as TargetEngSubgroup)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Все</option>
              <option value="a">A</option>
              <option value="b">B</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">ОИТ подгр.</label>
            <select
              value={form.targetOitSubgroup}
              onChange={(e) => update('targetOitSubgroup', e.target.value as TargetOitSubgroup)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Все</option>
              <option value="a">A</option>
              <option value="b">B</option>
            </select>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
