import { GraduationCap } from 'lucide-react';
import { SessionEventCard } from './SessionEventCard';
import type { SessionEvent } from '../hooks/use-session-schedule';
import type { GradeValue } from '../hooks/use-session-results';

// ============================================================
// Типы
// ============================================================

interface SessionScheduleSectionProps {
  byDate: Map<string, SessionEvent[]>;
  results: Record<string, GradeValue>;
  onSetResult: (eventId: string, value: GradeValue) => void;
  onClearResult: (eventId: string) => void;
}

// ============================================================
// Компонент
// ============================================================

export function SessionScheduleSection({
  byDate,
  results,
  onSetResult,
  onClearResult,
}: SessionScheduleSectionProps) {
  if (byDate.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <GraduationCap
          size={56}
          strokeWidth={1.2}
          className="text-neutral-300 dark:text-neutral-600 mb-4"
        />
        <p className="text-base font-medium text-neutral-500 dark:text-neutral-400 mb-1">
          Информация о сессии пока не добавлена
        </p>
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Расписание сессии появится ближе к концу семестра
        </p>
      </div>
    );
  }

  const dateEntries = Array.from(byDate.entries());

  return (
    <div className="space-y-5">
      {dateEntries.map(([dateStr, events]) => (
        <div key={dateStr}>
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
            {formatDateHeading(dateStr)}
          </h3>
          <div className="space-y-3">
            {events.map((event) => (
              <SessionEventCard
                key={event.id}
                event={event}
                result={results[event.id]}
                onSetResult={(v) => onSetResult(event.id, v)}
                onClearResult={() => onClearResult(event.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Утилиты
// ============================================================

const DAY_NAMES_LONG: Record<number, string> = {
  1: 'понедельник',
  2: 'вторник',
  3: 'среда',
  4: 'четверг',
  5: 'пятница',
  6: 'суббота',
  0: 'воскресенье',
};

function formatDateHeading(dateStr: string): string {
  const d = new Date(dateStr);
  const dayName = DAY_NAMES_LONG[d.getDay()] ?? '';
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(d);
  return `${formatted}, ${dayName}`;
}
