import type { CalendarEvent, CalendarDeadline } from '../hooks/use-calendar-data';
import type { EventType } from '../../../database/types';

const EVENT_PILL_COLORS: Record<EventType, string> = {
  usr:          'bg-violet-200 text-violet-800 dark:bg-violet-500/50 dark:text-violet-200',
  control_work: 'bg-red-200 text-red-800 dark:bg-red-500/50 dark:text-red-200',
  credit:       'bg-teal-200 text-teal-800 dark:bg-teal-500/50 dark:text-teal-200',
  exam:         'bg-rose-200 text-rose-800 dark:bg-rose-500/50 dark:text-rose-200',
  consultation: 'bg-sky-200 text-sky-800 dark:bg-sky-500/50 dark:text-sky-200',
  other:        'bg-purple-200 text-purple-800 dark:bg-purple-500/50 dark:text-purple-200',
};

const DEADLINE_PILL = 'bg-amber-200 text-amber-800 dark:bg-amber-500/50 dark:text-amber-200';

const MAX_PILLS = 3;

interface Props {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
  deadlines: CalendarDeadline[];
  onTap: () => void;
}

export function DayCell({ day, isCurrentMonth, isToday, isSelected, events, deadlines, onTap }: Props) {
  const totalItems = events.length + deadlines.length;
  const overflow = totalItems > MAX_PILLS ? totalItems - MAX_PILLS + 1 : 0;
  const visibleCount = overflow > 0 ? MAX_PILLS - 1 : totalItems;

  // Build visible pills: events first, then deadlines
  const pills: { label: string; color: string }[] = [];
  for (let i = 0; i < events.length && pills.length < visibleCount; i++) {
    const e = events[i];
    pills.push({
      label: e.subjectName ?? e.title,
      color: EVENT_PILL_COLORS[e.eventType] ?? EVENT_PILL_COLORS.other,
    });
  }
  for (let i = 0; i < deadlines.length && pills.length < visibleCount; i++) {
    const d = deadlines[i];
    pills.push({
      label: d.subjectName ?? d.description ?? 'Дедлайн',
      color: DEADLINE_PILL,
    });
  }

  return (
    <button
      onClick={onTap}
      className={`w-full h-full min-w-0 flex flex-col items-stretch p-0.5 min-h-[4.5rem] transition-colors overflow-hidden ${
        !isCurrentMonth ? 'opacity-40' : ''
      } ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/40'
          : 'active:bg-gray-100 dark:active:bg-neutral-800'
      }`}
    >
      {/* Day number */}
      <div className="flex justify-start pl-0.5 mb-0.5 shrink-0">
        <span
          className={`w-5 h-5 flex items-center justify-center rounded-full text-[11px] font-medium ${
            isToday
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : isSelected
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-neutral-700 dark:text-neutral-300'
          }`}
        >
          {day}
        </span>
      </div>

      {/* Event/deadline pills */}
      <div className="flex flex-col gap-px flex-1 min-w-0">
        {pills.map((pill, i) => (
          <div
            key={i}
            className={`rounded px-0.5 text-[9px] leading-[14px] font-medium truncate ${pill.color}`}
          >
            {pill.label}
          </div>
        ))}
        {overflow > 0 && (
          <div className="text-[9px] leading-[14px] text-neutral-400 dark:text-neutral-500 text-center font-medium">
            +{overflow}
          </div>
        )}
      </div>
    </button>
  );
}
