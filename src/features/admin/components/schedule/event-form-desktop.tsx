import { useState, useEffect } from 'react';
import type {
  SubjectDoc,
  TeacherDoc,
  EventType,
} from '../../../../database/types';
import { AdminModal } from '../ui/admin-modal';
import { BELL_SCHEDULE } from '../../../../shared/constants/bell-schedule';
import { TeacherAutocomplete } from '../ui/teacher-autocomplete';
import { TargetPicker } from '../targeting/target-picker';

export interface EventFormData {
  title: string;
  description: string;
  eventType: EventType;
  date: string;
  pairNumber: number | null;
  eventTime: string;
  subjectId: string;
  teacherId: string;
  room: string;
  targetSubgroupIds: string[];
}

interface EventFormDesktopProps {
  open: boolean;
  onClose: () => void;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  onSubmit: (data: EventFormData) => void;
  initialDate?: string;
  initialPairNumber?: number | null;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'usr', label: 'УСР' },
  { value: 'control_work', label: 'Контрольная' },
  { value: 'credit', label: 'Зачёт' },
  { value: 'exam', label: 'Экзамен' },
  { value: 'consultation', label: 'Консультация' },
  { value: 'other', label: 'Другое' },
];

export function EventFormDesktop({
  open,
  onClose,
  subjects,
  teachers,
  onSubmit,
  initialDate = '',
  initialPairNumber = null,
}: EventFormDesktopProps) {
  const buildInitial = (): EventFormData => ({
    title: '',
    description: '',
    eventType: 'other',
    date: initialDate,
    pairNumber: initialPairNumber,
    eventTime: '',
    subjectId: '',
    teacherId: '',
    room: '',
    targetSubgroupIds: [],
  });

  const [form, setForm] = useState<EventFormData>(buildInitial);

  // Reset form state every time the modal opens
  useEffect(() => {
    if (open) setForm(buildInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function update<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    onSubmit(form);
    onClose();
  }

  const isValid = form.title.trim() !== '' && form.date !== '';

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Создать событие"
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
            Создать
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Название *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Напр.: Контрольная по БЖД"
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Event type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Тип события</label>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update('eventType', opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.eventType === opt.value
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date + pair */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Дата *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Пара (необязательно)</label>
            <select
              value={form.pairNumber ?? ''}
              onChange={(e) =>
                update('pairNumber', e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Не привязано к паре</option>
              {BELL_SCHEDULE.map((b) => (
                <option key={b.pairNumber} value={b.pairNumber}>
                  {b.pairNumber} пара ({b.startTime} – {b.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time (if no pair) */}
        {!form.pairNumber && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Время</label>
            <input
              type="time"
              value={form.eventTime}
              onChange={(e) => update('eventTime', e.target.value)}
              className="w-48 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Subject + Teacher */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Предмет</label>
            <select
              value={form.subjectId}
              onChange={(e) => update('subjectId', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Преподаватель</label>
            <TeacherAutocomplete
              teachers={teachers}
              value={form.teacherId}
              onChange={(id) => update('teacherId', id)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Room */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Аудитория</label>
          <input
            type="text"
            value={form.room}
            onChange={(e) => update('room', e.target.value)}
            placeholder="305"
            className="w-48 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Описание</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={2}
            placeholder="Доп. информация"
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Subgroups */}
        <TargetPicker
          value={form.targetSubgroupIds}
          onChange={(ids) => update('targetSubgroupIds', ids)}
        />
      </div>
    </AdminModal>
  );
}
