import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useDeadlineForm } from '../hooks/use-deadline-form';
import type { SubjectDoc } from '../../../database/types';
import { toISODate } from '../../schedule/utils/week-utils';

// ============================================================
// Types
// ============================================================

interface DeadlineSheetProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  subjects: SubjectDoc[];
}

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

export function DeadlineSheet({
  open,
  onClose,
  date,
  subjects,
}: DeadlineSheetProps) {
  const { fields, setField, submit, isValid, loading } = useDeadlineForm({
    defaultDate: toISODate(date),
    onSuccess: onClose,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Новый дедлайн"
      footer={
        <button
          onClick={submit}
          disabled={!isValid || loading}
          className="w-full p-3 rounded-xl bg-amber-500 text-white font-medium text-sm disabled:opacity-40 active:opacity-80 transition-opacity"
        >
          {loading ? 'Создание…' : 'Создать дедлайн'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Context */}
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatDateLabel(date)}
        </p>

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
            placeholder="Что нужно сделать"
            rows={2}
            value={fields.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
            Время (необязательно)
          </label>
          <input
            type="time"
            className="w-full min-w-0 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 appearance-none"
            value={fields.time}
            onChange={(e) => setField('time', e.target.value)}
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
                        ? 'bg-amber-500 text-white'
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
                        ? 'bg-amber-500 text-white'
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
                        ? 'bg-amber-500 text-white'
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
