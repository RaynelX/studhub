import { useMemo } from 'react';
import type { StudentDoc } from '../../../database/types';
import type { StudentHoursSummary } from '../hooks/use-admin-attendance';

// ============================================================
// Типы
// ============================================================

interface AdminSummaryTableProps {
  students: StudentDoc[];
  studentSummaries: Map<string, StudentHoursSummary>;
}

// ============================================================
// Компонент
// ============================================================

export function AdminSummaryTable({
  students,
  studentSummaries,
}: AdminSummaryTableProps) {
  // Показываем только студентов с пропусками
  const studentsWithAbsences = useMemo(() => {
    return students.filter((s) => studentSummaries.has(s.id));
  }, [students, studentSummaries]);

  if (studentsWithAbsences.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Сводка пропусков (ак. часы)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-neutral-800">
              <th className="sticky left-0 bg-white dark:bg-neutral-900 text-left px-4 py-2 font-medium text-neutral-500 dark:text-neutral-400 min-w-[140px]">
                Студент
              </th>
              <th className="px-3 py-2 font-medium text-amber-600 dark:text-amber-400 text-center whitespace-nowrap">
                Нед. У
              </th>
              <th className="px-3 py-2 font-medium text-red-600 dark:text-red-400 text-center whitespace-nowrap">
                Нед. Н
              </th>
              <th className="px-3 py-2 font-medium text-amber-600 dark:text-amber-400 text-center whitespace-nowrap">
                Мес. У
              </th>
              <th className="px-3 py-2 font-medium text-red-600 dark:text-red-400 text-center whitespace-nowrap">
                Мес. Н
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
            {studentsWithAbsences.map((student) => {
              const s = studentSummaries.get(student.id);
              return (
                <tr key={student.id}>
                  <td className="sticky left-0 bg-white dark:bg-neutral-900 px-4 py-2.5 text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">
                    {student.full_name}
                  </td>
                  <CellValue value={s?.weekExcused ?? 0} color="amber" />
                  <CellValue value={s?.weekUnexcused ?? 0} color="red" />
                  <CellValue value={s?.monthExcused ?? 0} color="amber" />
                  <CellValue value={s?.monthUnexcused ?? 0} color="red" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Внутренние компоненты
// ============================================================

function CellValue({ value, color }: { value: number; color: 'amber' | 'red' }) {
  const colorClass =
    value > 0
      ? color === 'amber'
        ? 'text-amber-600 dark:text-amber-400 font-semibold'
        : 'text-red-600 dark:text-red-400 font-semibold'
      : 'text-neutral-300 dark:text-neutral-600';

  return (
    <td className={`px-3 py-2.5 text-center ${colorClass}`}>
      {value}
    </td>
  );
}
