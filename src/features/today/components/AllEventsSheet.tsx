import { useState, useMemo } from 'react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useAllEvents } from '../hooks/use-all-events';
import type { AllEvent } from '../hooks/use-all-events';
import type { EventType } from '../../../database/types';

// Цвета идентичны EVENT_TYPE_CONFIG из PairCard.tsx
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

const FILTER_OPTIONS: { value: EventType | 'all'; label: string }[] = [
  { value: 'all',          label: 'Все' },
  { value: 'usr',          label: 'УСР' },
  { value: 'control_work', label: 'КР' },
  { value: 'credit',       label: 'Зачёт' },
  { value: 'exam',         label: 'Экзамен' },
  { value: 'consultation', label: 'Конс.' },
  { value: 'other',        label: 'Другое' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AllEventsSheet({ open, onClose }: Props) {
  const { events, loading } = useAllEvents();
  const [filter, setFilter] = useState<EventType | 'all'>('all');

  const filtered = useMemo(
    () => filter === 'all' ? events : events.filter((e) => e.eventType === filter),
    [events, filter],
  );

  // Группировка по дате
  const grouped = useMemo(() => {
    const groups: { dateLabel: string; key: string; items: AllEvent[] }[] = [];
    for (const event of filtered) {
      const last = groups[groups.length - 1];
      if (last && last.key === event.date) {
        last.items.push(event);
      } else {
        groups.push({ dateLabel: event.dateLabel, key: event.date, items: [event] });
      }
    }
    return groups;
  }, [filtered]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Все события" height="98dvh">
      {/* Фильтры — flex wrap */}
      <div className="flex flex-wrap gap-2 pb-3">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === opt.value
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Контент */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-neutral-400">Загрузка...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-neutral-400 dark:text-neutral-500">
            {filter === 'all' ? 'Нет предстоящих событий' : 'Нет событий этого типа'}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium active:opacity-70 transition-opacity"
            >
              Показать все события
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.key}>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2.5">
                {group.dateLabel}
              </p>
              <div className="space-y-2.5">
                {group.items.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

function EventCard({ event }: { event: AllEvent }) {
  const config = EVENT_TYPE_CONFIG[event.eventType] ?? EVENT_TYPE_CONFIG.other;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-neutral-800/50 ${config.bg} ${config.darkBg} p-4`}>
      {/* Бейдж + время */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.badge}`}>
          {config.label}
        </span>
        <span className="text-sm text-gray-500 dark:text-neutral-400">
          {event.timeLabel}
        </span>
      </div>

      {/* Предмет */}
      <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
        {event.subjectName ?? 'Событие'}
      </p>

      {/* Описание */}
      {event.description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400 leading-snug line-clamp-3">
          {event.description}
        </p>
      )}

      {/* Преподаватель + аудитория — внизу слева */}
      {(event.teacherName || event.room) && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 dark:text-neutral-500">
          {event.teacherName && <span>{event.teacherName}</span>}
          {event.room && (
            <span>
              {event.room === 'ДОТ' ? 'ДОТ' : `ауд. ${event.room}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
