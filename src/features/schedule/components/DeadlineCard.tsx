import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';
import type { DayDeadline } from '../hooks/use-day-deadlines';

interface DeadlineCardProps {
  deadline: DayDeadline;
}

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const rippleRef = useTouchRipple();

  return (
    <div
      ref={rippleRef}
      className="relative rounded-xl border border-gray-200 dark:border-transparent bg-amber-50 dark:bg-amber-950/40 p-4 transform-gpu active:scale-[0.98] transition-transform duration-75"
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
          {deadline.subjectName ?? 'Без предмета'}
        </p>
        <span className="text-sm text-gray-400 dark:text-neutral-500 shrink-0 ml-3">
          {deadline.time ?? 'Весь день'}
        </span>
      </div>

      {deadline.description && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-neutral-400 leading-snug line-clamp-3">
          {deadline.description}
        </p>
      )}
    </div>
  );
}
