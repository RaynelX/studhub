import type { AttendanceHoursSummary } from '../hooks/use-attendance';

// ============================================================
// Типы
// ============================================================

interface AttendanceSummaryProps {
  summary: AttendanceHoursSummary;
}

// ============================================================
// Компонент
// ============================================================

export function AttendanceSummary({ summary }: AttendanceSummaryProps) {
  const hasData =
    summary.weekExcused > 0 ||
    summary.weekUnexcused > 0 ||
    summary.monthExcused > 0 ||
    summary.monthUnexcused > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent p-4 space-y-3">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Пропущено часов
      </h3>

      {!hasData ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Пропусков нет — отлично!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="За неделю"
            excused={summary.weekExcused}
            unexcused={summary.weekUnexcused}
          />
          <SummaryCard
            label="За месяц"
            excused={summary.monthExcused}
            unexcused={summary.monthUnexcused}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Внутренние компоненты
// ============================================================

function SummaryCard({
  label,
  excused,
  unexcused,
}: {
  label: string;
  excused: number;
  unexcused: number;
}) {
  return (
    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 space-y-1.5">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Уваж.</span>
          <span className={`font-semibold ${excused > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}`}>
            {excused}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500 dark:text-neutral-400">Неуваж.</span>
          <span className={`font-semibold ${unexcused > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-300 dark:text-neutral-600'}`}>
            {unexcused}
          </span>
        </div>
      </div>
    </div>
  );
}
