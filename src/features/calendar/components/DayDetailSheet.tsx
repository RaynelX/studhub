import { BottomSheet } from '../../../shared/ui/BottomSheet';
import type { CalendarEvent, CalendarDeadline } from '../hooks/use-calendar-data';
import type { EventType } from '../../../database/types';

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; badge: string; bg: string; darkBg: string }
> = {
  usr:           { label: 'УСР',          badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/40 dark:text-violet-300',   bg: 'bg-violet-50',  darkBg: 'dark:bg-violet-950/40' },
  control_work:  { label: 'Контрольная',  badge: 'bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-300',               bg: 'bg-red-50',     darkBg: 'dark:bg-red-950/40' },
  credit:        { label: 'Зачёт',        badge: 'bg-teal-100 text-teal-700 dark:bg-teal-500/40 dark:text-teal-300',           bg: 'bg-teal-50',    darkBg: 'dark:bg-teal-950/40' },
  exam:          { label: 'Экзамен',      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-300',           bg: 'bg-rose-50',    darkBg: 'dark:bg-rose-950/40' },
  consultation:  { label: 'Консультация', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/40 dark:text-sky-300',               bg: 'bg-sky-50',     darkBg: 'dark:bg-sky-950/40' },
  other:         { label: 'Событие',      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/40 dark:text-purple-300',   bg: 'bg-purple-50',  darkBg: 'dark:bg-purple-950/40' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  dateStr: string;
  events: CalendarEvent[];
  deadlines: CalendarDeadline[];
}

export function DayDetailSheet({ open, onClose, dateStr, events, deadlines }: Props) {
  const date = new Date(dateStr + 'T00:00:00');
  const title = date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  // Capitalize first letter
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

  const isEmpty = events.length === 0 && deadlines.length === 0;

  return (
    <BottomSheet open={open} onClose={onClose} title={formattedTitle}>
      {isEmpty ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-neutral-400 dark:text-neutral-500">Нет событий</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((event) => (
            <EventDetailCard key={event.id} event={event} />
          ))}
          {deadlines.map((dl) => (
            <DeadlineDetailCard key={dl.id} deadline={dl} />
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

function EventDetailCard({ event }: { event: CalendarEvent }) {
  const config = EVENT_TYPE_CONFIG[event.eventType as EventType] ?? EVENT_TYPE_CONFIG.other;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-neutral-800/50 ${config.bg} ${config.darkBg} p-4`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.badge}`}>
          {config.label}
        </span>
        <span className="text-sm text-gray-500 dark:text-neutral-400">
          {event.timeLabel}
        </span>
      </div>

      <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
        {event.subjectName ?? event.title}
      </p>

      {event.description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400 leading-snug line-clamp-3">
          {event.description}
        </p>
      )}

      {(event.teacherName || event.room) && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-neutral-500">
          {event.teacherName && <span>{event.teacherName}</span>}
          {event.room && (
            <span>{event.room === 'ДОТ' ? 'ДОТ' : `ауд. ${event.room}`}</span>
          )}
        </div>
      )}
    </div>
  );
}

function DeadlineDetailCard({ deadline }: { deadline: CalendarDeadline }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800/50 bg-amber-50 dark:bg-amber-950/40 p-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/40 dark:text-amber-300">
          Дедлайн
        </span>
        <span className="text-sm text-gray-500 dark:text-neutral-400">
          {deadline.timeLabel}
        </span>
      </div>

      <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
        {deadline.subjectName ?? 'Без предмета'}
      </p>

      {deadline.description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400 leading-snug line-clamp-3">
          {deadline.description}
        </p>
      )}
    </div>
  );
}
