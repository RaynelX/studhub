import { Award } from 'lucide-react';
import type { SessionResultsSummary } from '../hooks/use-session-results';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';

// ============================================================
// Типы
// ============================================================

interface SessionSummaryProps {
  summary: SessionResultsSummary;
}

// ============================================================
// Компонент
// ============================================================

export function SessionSummary({ summary }: SessionSummaryProps) {
  const hasResults =
    summary.completedExams > 0 ||
    summary.completedCredits > 0 ||
    summary.failedCount > 0;

  if (!hasResults) return null;

  const rippleRef = useTouchRipple();

  return (
    <div ref={rippleRef} className="relative overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent p-4">
      <div className="flex items-center gap-3">
        {/* Средний балл */}
        {summary.averageGrade != null && (
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 shrink-0">
            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {summary.averageGrade}
            </span>
          </div>
        )}
        {summary.averageGrade == null && (
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 shrink-0">
            <Award size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {/* Статистика */}
        <div className="min-w-0">
          {summary.averageGrade != null && (
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Средний балл
            </p>
          )}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {buildStatsLine(summary)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Утилиты
// ============================================================

function buildStatsLine(s: SessionResultsSummary): string {
  const parts: string[] = [];

  if (s.totalExams > 0) {
    parts.push(`Экз.: ${s.completedExams}/${s.totalExams}`);
  }
  if (s.totalCredits > 0) {
    parts.push(`Зач.: ${s.completedCredits}/${s.totalCredits}`);
  }
  if (s.failedCount > 0) {
    parts.push(`Не сдано: ${s.failedCount}`);
  }

  return parts.join(' · ');
}
