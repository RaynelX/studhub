import { GraduationCap, CalendarCheck } from 'lucide-react';
import type { SessionEvent } from '../hooks/use-session-schedule';
import type { SessionResultsSummary } from '../hooks/use-session-results';
import { toISODate } from '../../schedule/utils/week-utils';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';

// ============================================================
// Типы
// ============================================================

interface SessionStatusBannerProps {
  events: SessionEvent[];
  summary: SessionResultsSummary;
}

// ============================================================
// Компонент
// ============================================================

export function SessionStatusBanner({ events, summary }: SessionStatusBannerProps) {
  const rippleRef = useTouchRipple();

  if (events.length === 0) return null;

  const today = toISODate(new Date());
  const gradable = events.filter(
    (e) => e.eventType === 'exam' || e.eventType === 'credit',
  );
  const totalCount = gradable.length;
  const completedCount = summary.completedExams + summary.completedCredits + summary.failedCount;

  // Ближайший предстоящий экзамен или зачёт
  const nextGradable = gradable.find((e) => e.date >= today);
  const allDone = totalCount > 0 && !nextGradable;

  if (allDone) {
    return (
      <div ref={rippleRef} className="relative overflow-hidden bg-green-50 dark:bg-green-950/40 rounded-2xl p-4 border border-green-200 dark:border-transparent">
        <div className="flex items-center gap-2.5">
          <CalendarCheck size={20} className="text-green-600 dark:text-green-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">
              Сессия завершена
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              Сдано {completedCount} из {totalCount}
              {summary.averageGrade != null && ` · Средний балл: ${summary.averageGrade}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Есть предстоящие — показываем ближайший + прогресс
  return (
    <div ref={rippleRef} className="relative overflow-hidden bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-4 border border-blue-200 dark:border-transparent">
      <div className="flex items-center gap-2.5">
        <GraduationCap size={20} className="text-blue-600 dark:text-blue-400 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {nextGradable ? (
                <>Ближайш{nextGradable.eventType === 'credit' ? 'ий зачёт' : 'ий экзамен'}</>
              ) : (
                'Сессия'
              )}
            </p>
            {totalCount > 0 && (
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                {completedCount}/{totalCount}
              </span>
            )}
          </div>
          {nextGradable && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
              {nextGradable.subjectShortName ?? nextGradable.subjectName ?? nextGradable.title}
              {' · '}{formatDateCompact(nextGradable.date)}
              {nextGradable.timeLabel !== 'В течение дня' && `, ${nextGradable.timeLabel}`}
            </p>
          )}
          {/* Прогресс-бар */}
          {totalCount > 0 && completedCount > 0 && (
            <div className="mt-2 h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Утилиты
// ============================================================

function formatDateCompact(dateStr: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(d);
}
