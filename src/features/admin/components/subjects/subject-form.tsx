import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AdminModal } from '../ui/admin-modal';
import type { SubjectDoc, AdditionalLink } from '../../../../database/types';

export interface SubjectFormData {
  name: string;
  shortName: string;
  sdoUrl: string;
  additionalLinks: AdditionalLink[];
  notes: string;
}

interface SubjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SubjectFormData) => Promise<void> | void;
  /** When provided, form is in edit mode */
  editSubject?: SubjectDoc | null;
}

function buildInitial(subject?: SubjectDoc | null): SubjectFormData {
  return {
    name: subject?.name ?? '',
    shortName: subject?.short_name ?? '',
    sdoUrl: subject?.sdo_url ?? '',
    additionalLinks: subject?.additional_links?.length ? [...subject.additional_links] : [],
    notes: subject?.notes ?? '',
  };
}

export function SubjectForm({ open, onClose, onSubmit, editSubject }: SubjectFormProps) {
  const [form, setForm] = useState<SubjectFormData>(buildInitial(editSubject));

  const isEdit = !!editSubject;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(buildInitial(editSubject));
  }, [open, editSubject]);

  function update<K extends keyof SubjectFormData>(key: K, value: SubjectFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addLink() {
    update('additionalLinks', [...form.additionalLinks, { label: '', url: '' }]);
  }

  function updateLink(idx: number, field: keyof AdditionalLink, value: string) {
    const links = [...form.additionalLinks];
    links[idx] = { ...links[idx], [field]: value };
    update('additionalLinks', links);
  }

  function removeLink(idx: number) {
    update('additionalLinks', form.additionalLinks.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    // Filter out empty links
    const cleanedLinks = form.additionalLinks.filter((l) => l.label.trim() && l.url.trim());
    await onSubmit({ ...form, additionalLinks: cleanedLinks });
    onClose();
  }

  const isValid = form.name.trim() !== '';

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Редактировать предмет' : 'Новый предмет'}
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
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Название *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Напр.: Математический анализ"
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Short name */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Сокращение</label>
          <input
            type="text"
            value={form.shortName}
            onChange={(e) => update('shortName', e.target.value)}
            placeholder="Напр.: МатАн"
            className="w-48 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* SDO URL */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ссылка на СДО</label>
          <input
            type="url"
            value={form.sdoUrl}
            onChange={(e) => update('sdoUrl', e.target.value)}
            placeholder="https://sdo.example.com/course/..."
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Additional links */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Дополнительные ссылки</label>
          <div className="space-y-2">
            {form.additionalLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateLink(idx, 'label', e.target.value)}
                  placeholder="Название"
                  className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(idx, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeLink(idx)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addLink}
            className="mt-2 flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить ссылку
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Заметки</label>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={2}
            placeholder="Дополнительная информация"
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    </AdminModal>
  );
}
