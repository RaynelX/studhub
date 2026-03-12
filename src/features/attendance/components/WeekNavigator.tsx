import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRangeSat } from '../../schedule/utils/week-utils';

// ============================================================
// Типы
// ============================================================

interface WeekNavigatorProps {
  monday: Date;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  weekNumber?: number | null;
}

// ============================================================
// Компонент
// ============================================================

export function WeekNavigator({
  monday,
  onPrev,
  onNext,
  canGoNext,
  canGoPrev,
  weekNumber,
}: WeekNavigatorProps) {
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        className={`p-2.5 -m-1 rounded-xl ${
          canGoPrev
            ? 'text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800'
            : 'text-gray-200 dark:text-neutral-700 cursor-default'
        }`}
      >
        <ChevronLeft size={22} />
      </button>

      <div className="text-center">
        <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
          {formatWeekRangeSat(monday)}
        </p>
        {weekNumber != null && weekNumber > 0 && (
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {weekNumber}-я неделя
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={`p-2.5 -m-1 rounded-xl ${
          canGoNext
            ? 'text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800'
            : 'text-gray-200 dark:text-neutral-700 cursor-default'
        }`}
      >
        <ChevronRight size={22} />
      </button>
    </div>
  );
}
