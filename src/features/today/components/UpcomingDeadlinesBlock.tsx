import { useState } from 'react';
import type { UpcomingDeadline } from '../hooks/use-upcoming-deadlines';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';
import { AllDeadlinesSheet } from './AllDeadlinesSheet';

interface Props {
  deadlines: UpcomingDeadline[];
}

export function UpcomingDeadlinesBlock({ deadlines }: Props) {
  const rippleRef = useTouchRipple();
  const [sheetOpen, setSheetOpen] = useState(false);
  if (deadlines.length === 0) return null;

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Ближайшие дедлайны
        </h3>
        <button
          onClick={() => setSheetOpen(true)}
          className="text-sm text-amber-600 dark:text-amber-400 font-medium active:opacity-70 transition-opacity"
        >
          Показать все &rsaquo;
        </button>
      </div>

      {/* Карточка */}
      <div ref={rippleRef} className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent px-4 py-2 transform-gpu active:scale-[0.98] transition-transform duration-75">
        <div>
          {deadlines.slice(0, 3).map((dl) => (
            <DeadlineRow key={dl.id} deadline={dl} />
          ))}
        </div>
      </div>

      <AllDeadlinesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

function DeadlineRow({ deadline }: { deadline: UpcomingDeadline }) {
  return (
    <div className="flex items-baseline gap-3 py-2">
      <span className="text-sm text-neutral-400 dark:text-neutral-500 w-14 shrink-0 tabular-nums">
        {deadline.dateLabel}
      </span>

      <p className="text-sm flex-1 min-w-0 truncate">
        {deadline.subjectName && (
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {deadline.subjectName}
          </span>
        )}
        {deadline.subjectName && deadline.description && (
          <span className="text-neutral-300 dark:text-neutral-600"> · </span>
        )}
        {deadline.description && (
          <span className="text-neutral-400 dark:text-neutral-500">
            {deadline.description}
          </span>
        )}
      </p>

      {deadline.timeLabel && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500 shrink-0 tabular-nums">
          {deadline.timeLabel}
        </span>
      )}
    </div>
  );
}
