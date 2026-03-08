import { useState } from 'react';
import { X } from 'lucide-react';
import type { GradeValue } from '../hooks/use-session-results';
import type { EventType } from '../../../database/types';

// ============================================================
// Типы
// ============================================================

interface GradeInputProps {
  eventType: EventType;
  value: GradeValue | undefined;
  onChange: (value: GradeValue) => void;
  onClear: () => void;
}

// ============================================================
// Конфигурация — цвета кружков по оценке (1–10)
// ============================================================

const GRADE_COLORS: Record<number, string> = {
  1:  'bg-red-500',
  2:  'bg-red-500',
  3:  'bg-red-500',
  4:  'bg-orange-500',
  5:  'bg-orange-500',
  6:  'bg-orange-500',
  7:  'bg-yellow-500',
  8:  'bg-yellow-500',
  9:  'bg-green-500',
  10: 'bg-green-500',
};

const INACTIVE =
  'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400';

// ============================================================
// Компонент
// ============================================================

export function GradeInput({ eventType, value, onChange, onClear }: GradeInputProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (eventType === 'consultation') return null;

  // ---------- Зачёт: только две кнопки ----------
  if (eventType === 'credit') {
    return (
      <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <CreditPill
          label="Незачёт"
          active={value === 'failed'}
          activeClass="bg-red-500 text-white dark:bg-red-600"
          onClick={() => (value === 'failed' ? onClear() : onChange('failed'))}
        />
        <CreditPill
          label="Зачёт"
          active={value === 'passed'}
          activeClass="bg-green-500 text-white dark:bg-green-600"
          onClick={() => (value === 'passed' ? onClear() : onChange('passed'))}
        />
      </div>
    );
  }

  // ---------- Экзамен: кнопка-триггер + выпадающий 1–10 ----------
  const numericValue = typeof value === 'number' ? value : null;

  return (
    <div className="space-y-2" onPointerDown={(e) => e.stopPropagation()}>
      {/* Кнопка-триггер */}
      <button
        type="button"
        onClick={() => setPickerOpen(!pickerOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          numericValue
            ? `${GRADE_COLORS[numericValue]} text-white`
            : INACTIVE
        }`}
      >
        {numericValue != null ? numericValue : 'Оценка'}
      </button>

      {/* Грид кружков */}
      {pickerOpen && (
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Сброс */}
          <GradeCircle
            label={<X size={14} strokeWidth={2.5} />}
            active={false}
            color="bg-neutral-400 dark:bg-neutral-600"
            onClick={() => { onClear(); setPickerOpen(false); }}
          />
          {/* 1–10 */}
          {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((n) => (
            <GradeCircle
              key={n}
              label={String(n)}
              active={numericValue === n}
              color={GRADE_COLORS[n]}
              onClick={() => { onChange(n); setPickerOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Внутренние компоненты
// ============================================================

function GradeCircle({
  label,
  active,
  color,
  onClick,
}: {
  label: React.ReactNode;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold transition-all ${color} text-white ${
        active ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-neutral-900' : 'opacity-80 active:scale-95'
      }`}
    >
      {label}
    </button>
  );
}

function CreditPill({
  label,
  active,
  activeClass,
  onClick,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active ? activeClass : INACTIVE
      }`}
    >
      {label}
    </button>
  );
}
