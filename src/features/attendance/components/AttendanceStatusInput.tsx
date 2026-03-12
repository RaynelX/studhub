import type { AttendanceStatus } from '../hooks/use-attendance';

// ============================================================
// Типы
// ============================================================

interface AttendanceStatusInputProps {
  value: AttendanceStatus | undefined;
  onChange: (status: AttendanceStatus) => void;
  onClear: () => void;
}

// ============================================================
// Конфигурация
// ============================================================

const STATUSES: { key: AttendanceStatus; label: string; activeClass: string }[] = [
  {
    key: 'present',
    label: 'Был',
    activeClass: 'bg-green-500 text-white dark:bg-green-600',
  },
  {
    key: 'excused',
    label: 'Уваж.',
    activeClass: 'bg-amber-500 text-white dark:bg-amber-600',
  },
  {
    key: 'unexcused',
    label: 'Неуваж.',
    activeClass: 'bg-red-500 text-white dark:bg-red-600',
  },
];

const INACTIVE =
  'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400';

// ============================================================
// Компонент
// ============================================================

export function AttendanceStatusInput({
  value,
  onChange,
  onClear,
}: AttendanceStatusInputProps) {
  return (
    <div
      className="flex gap-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {STATUSES.map(({ key, label, activeClass }) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => (isActive ? onClear() : onChange(key))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive ? activeClass : INACTIVE
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
