import { useMemo } from 'react';
import type { StudentDoc } from '../../../database/types';
import type { StudentHoursSummary } from '../hooks/use-admin-attendance';
import { formatWeekRange } from '../../schedule/utils/week-utils';

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

interface AdminSummaryTableProps {
  students: StudentDoc[];
  studentSummaries: Map<string, StudentHoursSummary>;
  monday: Date;
}

// ============================================================
// Компонент
// ============================================================

export function AdminSummaryTable({
  students,
  studentSummaries,
  monday,
}: AdminSummaryTableProps) {
  const studentsWithAbsences = useMemo(() => {
    return students.filter((s) => studentSummaries.has(s.id));
  }, [students, studentSummaries]);

  if (studentsWithAbsences.length === 0) {
    return null;
  }

  const weekLabel = formatWeekRange(monday);
  const monthLabel = MONTH_NAMES[monday.getMonth()];

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Сводка пропусков (ак. часы)
        </h3>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
          {weekLabel} · {monthLabel}
        </p>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {studentsWithAbsences.map((student) => {
          const s = studentSummaries.get(student.id)!;
          const weekTotal = s.weekExcused + s.weekUnexcused;
          const monthTotal = s.monthExcused + s.monthUnexcused;

          return (
            <div key={student.id} className="px-4 py-3">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5 truncate">
                {student.full_name}
              </p>
              <div className="flex gap-4 text-xs">
                <PeriodValue
                  label="Неделя"
                  total={weekTotal}
                  excused={s.weekExcused}
                  unexcused={s.weekUnexcused}
                />
                <PeriodValue
                  label="Месяц"
                  total={monthTotal}
                  excused={s.monthExcused}
                  unexcused={s.monthUnexcused}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Внутренние компоненты
// ============================================================

function PeriodValue({
  label,
  total,
  excused,
  unexcused,
}: {
  label: string;
  total: number;
  excused: number;
  unexcused: number;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-neutral-500 dark:text-neutral-400">{label}:</span>
      <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
        {total}
      </span>
      <span className="text-neutral-400 dark:text-neutral-500">
        (<span className={excused > 0 ? 'text-amber-600 dark:text-amber-400' : ''}>{excused}у</span>
        {' · '}
        <span className={unexcused > 0 ? 'text-red-600 dark:text-red-400' : ''}>{unexcused}н</span>)
      </span>
    </div>
  );
}
