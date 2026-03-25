import { Clock, MapPin, User, MessageSquare } from 'lucide-react';
import { GradeInput } from './GradeInput';
import type { SessionEvent } from '../hooks/use-session-schedule';
import type { GradeValue } from '../hooks/use-session-results';
import type { EventType } from '../../../database/types';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';

// ============================================================
// Типы
// ============================================================

interface SessionEventCardProps {
  event: SessionEvent;
  result: GradeValue | undefined;
  onSetResult: (value: GradeValue) => void;
  onClearResult: () => void;
}

// ============================================================
// Конфигурация
// ============================================================

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; badge: string; border: string }
> = {
  exam: {
    label: 'Экзамен',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-300',
    border: 'border-l-rose-500',
  },
  credit: {
    label: 'Зачёт',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-500/40 dark:text-teal-300',
    border: 'border-l-teal-500',
  },
  consultation: {
    label: 'Консультация',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/40 dark:text-sky-300',
    border: 'border-l-sky-500',
  },
};

function getResultBg(eventType: EventType, result: GradeValue | undefined): string {
  if (result == null) return '';
  if (result === 'failed') return 'bg-red-50/50 dark:bg-red-950/20';
  if (typeof result === 'number' && result <= 3) return 'bg-red-50/50 dark:bg-red-950/20';
  if (eventType === 'consultation') return '';
  return 'bg-green-50/50 dark:bg-green-950/20';
}

// ============================================================
// Компонент
// ============================================================

export function SessionEventCard({
  event,
  result,
  onSetResult,
  onClearResult,
}: SessionEventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.eventType] ?? EVENT_TYPE_CONFIG.consultation;
  const resultBg = getResultBg(event.eventType, result);
  const rippleRef = useTouchRipple();

  return (
    <div
      ref={rippleRef}
      className={`relative bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent border-l-4 ${config.border} overflow-hidden ${resultBg}`}
    >
      <div className="p-4 space-y-2.5">
        {/* Шапка: бейдж типа + время + аудитория */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}
          >
            {config.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Clock size={12} />
            {event.timeLabel}
          </span>
          {event.room && (
            <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <MapPin size={12} />
              {event.room}
            </span>
          )}
        </div>

        {/* Предмет */}
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
          {event.subjectName ?? event.title}
        </h3>

        {/* Преподаватель */}
        {event.teacherName && (
          <p className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            <User size={14} />
            {event.teacherName}
          </p>
        )}

        {/* Консультация к экзамену */}
        {event.consultation && (
          <p className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400">
            <MessageSquare size={13} />
            Консультация: {formatDateShort(event.consultation.date)}, {event.consultation.timeLabel}
          </p>
        )}

        {/* Описание */}
        {event.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Ввод оценки */}
        {event.eventType !== 'consultation' && (
          <div className="pt-1 overflow-hidden">
            <GradeInput
              eventType={event.eventType}
              value={result}
              onChange={onSetResult}
              onClear={onClearResult}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Утилиты
// ============================================================

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(d);
}
