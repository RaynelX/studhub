import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatWeekRange } from '../../schedule/utils/week-utils';

// ============================================================
// Типы
// ============================================================

interface WeekNavigatorProps {
  monday: Date;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
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
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent px-2 py-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft size={20} />
      </button>

      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {formatWeekRange(monday)}
      </span>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
