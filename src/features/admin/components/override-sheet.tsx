import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useOverrideForm } from '../hooks/use-override-form';
import type { SubjectDoc, TeacherDoc, EntryType } from '../../../database/types';
import type { SourceTargets } from '../../schedule/utils/schedule-builder';
import { toISODate } from '../../schedule/utils/week-utils';

// ============================================================
// Types
// ============================================================

interface OverrideSheetProps {
  open: boolean;
  onClose: () => void;
  mode: 'replace' | 'add';
  date: Date;
  pairNumber: number;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  sourceTargets?: SourceTargets;
  /** Defaults for replace mode (original pair data) */
  defaults?: {
    subjectId?: string;
    entryType?: EntryType;
    teacherId?: string;
    room?: string;
  };
}

const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: 'lecture', label: 'Лекция' },
  { value: 'seminar', label: 'Семинар' },
  { value: 'practice', label: 'Практика' },
  { value: 'other', label: 'Другое' },
];

const DAY_NAMES: Record<number, string> = {
  0: 'вс', 1: 'пн', 2: 'вт', 3: 'ср', 4: 'чт', 5: 'пт', 6: 'сб',
};

function formatDateLabel(date: Date): string {
  const day = DAY_NAMES[date.getDay()] ?? '';
  return `${day}, ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

// ============================================================
// Component
// ============================================================

export function OverrideSheet({
  open,
  onClose,
  mode,
  date,
  pairNumber,
  subjects,
  teachers,
  sourceTargets,
  defaults,
}: OverrideSheetProps) {
  const title = mode === 'replace' ? 'Замена пары' : 'Дополнительная пара';

  const { fields, setField, submit, isValid, loading } = useOverrideForm({
    mode,
    date: toISODate(date),
    pairNumber,
    sourceTargets,
    defaults,
    onSuccess: onClose,
  });

  const [showComment, setShowComment] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button
          onClick={submit}
          disabled={!isValid || loading}
          className="w-full p-3 rounded-xl bg-blue-500 text-white font-medium text-sm disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          {loading ? 'Сохранение…' : 'Сохранить'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Context */}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatDateLabel(date)} · {pairNumber} пара
        </p>

        {/* Subject */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Предмет
          </label>
          <select
            className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 appearance-none"
            value={fields.subjectId}
            onChange={(e) => setField('subjectId', e.target.value)}
          >
            <option value="">Выберите предмет</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Entry type pills */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Тип занятия
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {ENTRY_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setField('entryType', value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  fields.entryType === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Teacher */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Преподаватель
          </label>
          <select
            className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 appearance-none"
            value={fields.teacherId}
            onChange={(e) => setField('teacherId', e.target.value)}
          >
            <option value="">Выберите преподавателя</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>

        {/* Room */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Аудитория
          </label>
          <input
            className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
            placeholder="Аудитория или ДОТ"
            value={fields.room}
            onChange={(e) => setField('room', e.target.value)}
          />
        </div>

        {/* Comment (collapsible) */}
        {!showComment ? (
          <button
            onClick={() => setShowComment(true)}
            className="text-sm text-blue-500 dark:text-blue-400 text-left active:opacity-70 transition-opacity"
          >
            + Добавить комментарий
          </button>
        ) : (
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
              Комментарий
            </label>
            <input
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
              placeholder="Например: преподаватель заболел"
              value={fields.comment}
              onChange={(e) => setField('comment', e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Advanced settings (collapsible) */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 active:opacity-70 transition-opacity"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Расширенные настройки
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 pl-2 border-l-2 border-neutral-200 dark:border-neutral-700">
            {/* Target language */}
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">
                Язык
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'en', 'de', 'fr', 'es'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setField('targetLanguage', lang)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      fields.targetLanguage === lang
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {lang === 'all' ? 'Все' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Target eng subgroup */}
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">
                Англ. подгруппа
              </label>
              <div className="flex gap-1.5">
                {(['all', 'a', 'b'] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setField('targetEngSubgroup', val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      fields.targetEngSubgroup === val
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {val === 'all' ? 'Все' : val.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Target oit subgroup */}
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block">
                ОИТ подгруппа
              </label>
              <div className="flex gap-1.5">
                {(['all', 'a', 'b'] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setField('targetOitSubgroup', val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      fields.targetOitSubgroup === val
                        ? 'bg-blue-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {val === 'all' ? 'Все' : val.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
