import { useState, useEffect } from 'react';
import type {
  SubjectDoc,
  TeacherDoc,
  OverrideType,
  EntryType,
  TargetLanguage,
  TargetEngSubgroup,
  TargetOitSubgroup,
} from '../../../../database/types';
import { AdminModal } from '../ui/admin-modal';
import { BELL_SCHEDULE } from '../../../../shared/constants/bell-schedule';
import { TeacherAutocomplete } from '../ui/teacher-autocomplete';

export interface OverrideFormData {
  date: string;
  pairNumber: number;
  overrideType: OverrideType;
  targetLanguage: TargetLanguage;
  targetEngSubgroup: TargetEngSubgroup;
  targetOitSubgroup: TargetOitSubgroup;
  subjectId: string;
  entryType: EntryType;
  teacherId: string;
  room: string;
  comment: string;
}

interface OverrideFormDesktopProps {
  open: boolean;
  onClose: () => void;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  onSubmit: (data: OverrideFormData) => void;
  /** Pre-fill from a cell click */
  initialDate?: string;
  initialPairNumber?: number;
}

const OVERRIDE_TYPE_OPTIONS: { value: OverrideType; label: string }[] = [
  { value: 'cancel', label: 'Отменить пару' },
  { value: 'replace', label: 'Замена' },
  { value: 'add', label: 'Доп. пара' },
];

export function OverrideFormDesktop({
  open,
  onClose,
  subjects,
  teachers,
  onSubmit,
  initialDate = '',
  initialPairNumber = 1,
}: OverrideFormDesktopProps) {
  const buildInitial = (): OverrideFormData => ({
    date: initialDate,
    pairNumber: initialPairNumber,
    overrideType: 'cancel',
    targetLanguage: 'all',
    targetEngSubgroup: 'all',
    targetOitSubgroup: 'all',
    subjectId: '',
    entryType: 'lecture',
    teacherId: '',
    room: '',
    comment: '',
  });

  const [form, setForm] = useState<OverrideFormData>(buildInitial);

  // Reset form state every time the modal opens
  useEffect(() => {
    if (open) setForm(buildInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const showDetails = form.overrideType !== 'cancel';

  function update<K extends keyof OverrideFormData>(key: K, value: OverrideFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    onSubmit(form);
    onClose();
  }

  const isValid =
    form.date !== '' &&
    form.pairNumber >= 1 &&
    (form.overrideType === 'cancel' || form.subjectId !== '');

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Добавить изменение"
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
        {/* Override type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Тип</label>
          <div className="flex gap-2">
            {OVERRIDE_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update('overrideType', opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  form.overrideType === opt.value
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
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Дата</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Пара</label>
            <select
              value={form.pairNumber}
              onChange={(e) => update('pairNumber', Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BELL_SCHEDULE.map((b) => (
                <option key={b.pairNumber} value={b.pairNumber}>
                  {b.pairNumber} пара ({b.startTime} – {b.endTime})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Details for replace/add */}
        {showDetails && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Предмет</label>
              <select
                value={form.subjectId}
                onChange={(e) => update('subjectId', e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Преподаватель</label>
                <TeacherAutocomplete
                  teachers={teachers}
                  value={form.teacherId}
                  onChange={(id) => update('teacherId', id)}
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Аудитория</label>
                <input
                  type="text"
                  value={form.room}
                  onChange={(e) => update('room', e.target.value)}
                  placeholder="305"
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Subgroups */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Язык</label>
            <select
              value={form.targetLanguage}
              onChange={(e) => update('targetLanguage', e.target.value as TargetLanguage)}
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все</option>
              <option value="a">A</option>
              <option value="b">B</option>
            </select>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Комментарий</label>
          <input
            type="text"
            value={form.comment}
            onChange={(e) => update('comment', e.target.value)}
            placeholder="Необязательно"
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </AdminModal>
  );
}
