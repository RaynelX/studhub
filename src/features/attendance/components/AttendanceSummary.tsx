import type { AttendanceHoursSummary } from '../hooks/use-attendance';
import {
  addDays,
  formatWeekRange,
} from '../../schedule/utils/week-utils';

// ============================================================
// Утилиты
// ============================================================

const MONTH_NAMES: Record<number, string> = {
  0: 'Январь', 1: 'Февраль', 2: 'Март', 3: 'Апрель',
  4: 'Май', 5: 'Июнь', 6: 'Июль', 7: 'Август',
  8: 'Сентябрь', 9: 'Октябрь', 10: 'Ноябрь', 11: 'Декабрь',
};

// ============================================================
// Типы
// ============================================================

interface AttendanceSummaryProps {
  summary: AttendanceHoursSummary;
  monday: Date;
}

// ============================================================
// Компонент
// ============================================================

export function AttendanceSummary({ summary, monday }: AttendanceSummaryProps) {
  const hasData =
    summary.weekExcused > 0 ||
    summary.weekUnexcused > 0 ||
    summary.monthExcused > 0 ||
    summary.monthUnexcused > 0;

  const saturday = addDays(monday, 5);
  const weekLabel = formatWeekRange(monday).replace(
    `${saturday.getDate() + 1}`,
    `${saturday.getDate()}`,
  );
  const monthLabel = MONTH_NAMES[monday.getMonth()];

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
            label={weekLabel}
            excused={summary.weekExcused}
            unexcused={summary.weekUnexcused}
          />
          <SummaryCard
            label={monthLabel}
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
  const total = excused + unexcused;

  return (
    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold mb-1 ${total > 0 ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600'}`}>
        {total}
      </p>
      <div className="flex items-center gap-1.5 text-xs">
        <span className={excused > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-300 dark:text-neutral-600'}>
          {excused} уваж.
        </span>
        <span className="text-neutral-300 dark:text-neutral-600">·</span>
        <span className={unexcused > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-300 dark:text-neutral-600'}>
          {unexcused} неуваж.
        </span>
      </div>
    </div>
  );
}
