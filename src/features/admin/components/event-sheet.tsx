import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useEventForm } from '../hooks/use-event-form';
import type { SubjectDoc, EventType } from '../../../database/types';
import type { ResolvedPair } from '../../schedule/utils/schedule-builder';
import { toISODate } from '../../schedule/utils/week-utils';

// ============================================================
// Types & config
// ============================================================

interface EventSheetProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  pairNumber?: number;
  subjects: SubjectDoc[];
  /** Reserved for future use (teacher picker) */
  teachers: unknown[];
  /** Existing pair at this slot — used to auto-fill subject & room */
  pair?: ResolvedPair | null;
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'usr', label: 'УСР' },
  { value: 'control_work', label: 'Контрольная' },
  { value: 'deadline', label: 'Дедлайн' },
  { value: 'credit', label: 'Зачёт' },
  { value: 'exam', label: 'Экзамен' },
  { value: 'consultation', label: 'Консультация' },
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

export function EventSheet({
  open,
  onClose,
  date,
  pairNumber,
  subjects,
  pair,
}: EventSheetProps) {
  const { fields, setField, submit, isValid, loading } = useEventForm({
    defaultDate: toISODate(date),
    defaultPairNumber: pairNumber,
    defaultSubjectId: pair?.subjectId,
    defaultRoom: pair?.room,
    onSuccess: onClose,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Новое событие"
      footer={
        <button
          onClick={submit}
          disabled={!isValid || loading}
          className="w-full p-3 rounded-xl bg-blue-500 text-white font-medium text-sm disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          {loading ? 'Создание…' : 'Создать событие'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Context */}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatDateLabel(date)}
          {pairNumber ? ` · ${pairNumber} пара` : ''}
        </p>

        {/* Event type pills */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Тип события
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {EVENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setField('eventType', value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  fields.eventType === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject (optional) */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Предмет
          </label>
          <select
            className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 appearance-none"
            value={fields.subjectId}
            onChange={(e) => setField('subjectId', e.target.value)}
          >
            <option value="">Без привязки к предмету</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Описание
          </label>
          <textarea
            className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 resize-none"
            placeholder="Подробности (необязательно)"
            rows={2}
            value={fields.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>

        {/* Pair number */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Привязка к паре
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={() => setField('pairNumber', null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                fields.pairNumber === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Весь день
            </button>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setField('pairNumber', n)}
                className={`w-9 h-9 rounded-lg text-xs font-medium ${
                  fields.pairNumber === n
                    ? 'bg-blue-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Time (only when "all day") */}
        {fields.pairNumber === null && (
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
              Время
            </label>
            <input
              type="time"
              className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
              value={fields.eventTime}
              onChange={(e) => setField('eventTime', e.target.value)}
            />
          </div>
        )}

        {/* Room */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Аудитория
          </label>
          <input
            className="w-full p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100"
            placeholder="Аудитория (необязательно)"
            value={fields.room}
            onChange={(e) => setField('room', e.target.value)}
          />
        </div>

        {/* Advanced settings */}
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
