import { useState, useEffect } from 'react';
import { AdminModal } from '../ui/admin-modal';
import type { TeacherDoc } from '../../../../database/types';

export interface TeacherFormData {
  fullName: string;
  position: string;
  email: string;
  phone: string;
  telegram: string;
  preferredContact: string;
  consultationInfo: string;
}

interface TeacherFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherFormData) => Promise<void> | void;
  editTeacher?: TeacherDoc | null;
}

function buildInitial(teacher?: TeacherDoc | null): TeacherFormData {
  return {
    fullName: teacher?.full_name ?? '',
    position: teacher?.position ?? '',
    email: teacher?.email ?? '',
    phone: teacher?.phone ?? '',
    telegram: teacher?.telegram ?? '',
    preferredContact: teacher?.preferred_contact ?? '',
    consultationInfo: teacher?.consultation_info ?? '',
  };
}

export function TeacherForm({ open, onClose, onSubmit, editTeacher }: TeacherFormProps) {
  const [form, setForm] = useState<TeacherFormData>(buildInitial(editTeacher));
  const isEdit = !!editTeacher;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(buildInitial(editTeacher));
  }, [open, editTeacher]);

  function update<K extends keyof TeacherFormData>(key: K, value: TeacherFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

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
      title={isEdit ? 'Редактировать преподавателя' : 'Новый преподаватель'}
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

        {/* Position */}
        <div>
          <label className={labelCls}>Должность</label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => update('position', e.target.value)}
            placeholder="Доцент кафедры …"
            className={inputCls}
          />
        </div>

        {/* Email + phone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="teacher@bsu.by"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Телефон</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+375 …"
              className={inputCls}
            />
          </div>
        </div>

        {/* Telegram + preferred contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Telegram</label>
            <input
              type="text"
              value={form.telegram}
              onChange={(e) => update('telegram', e.target.value)}
              placeholder="@username"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Предпочт. способ связи</label>
            <input
              type="text"
              value={form.preferredContact}
              onChange={(e) => update('preferredContact', e.target.value)}
              placeholder="email / telegram / …"
              className={inputCls}
            />
          </div>
        </div>

        {/* Consultation info */}
        <div>
          <label className={labelCls}>Консультации</label>
          <textarea
            value={form.consultationInfo}
            onChange={(e) => update('consultationInfo', e.target.value)}
            rows={2}
            placeholder="Вт 14:00–16:00, ауд. 305"
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </AdminModal>
  );
}
