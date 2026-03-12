import { Clock } from 'lucide-react';
import { AdminStudentRow } from './AdminStudentRow';
import { formatBellTime, getBellSlot } from '../../../shared/constants/bell-schedule';
import type { ResolvedPair } from '../../schedule/utils/schedule-builder';
import type { StudentDoc } from '../../../database/types';
import type { AbsenceType } from '../hooks/use-admin-attendance';

// ============================================================
// Типы
// ============================================================

interface AdminPairSectionProps {
  pairNumber: number;
  pair: ResolvedPair;
  students: StudentDoc[];
  date: string;
  getAbsence: (date: string, pairNumber: number, studentId: string) => AbsenceType | undefined;
  onToggleAbsence: (date: string, pairNumber: number, studentId: string) => void;
}

// ============================================================
// Конфигурация
// ============================================================

const ENTRY_TYPE_LABELS: Record<string, string> = {
  lecture: 'Лекция',
  seminar: 'Семинар',
  practice: 'Практика',
  other: 'Другое',
};

// ============================================================
// Компонент
// ============================================================

export function AdminPairSection({
  pairNumber,
  pair,
  students,
  date,
  getAbsence,
  onToggleAbsence,
}: AdminPairSectionProps) {
  const bellSlot = getBellSlot(pairNumber);
  const timeLabel = bellSlot ? formatBellTime(bellSlot) : `${pairNumber} пара`;
  const entryType = pair.entryType ? ENTRY_TYPE_LABELS[pair.entryType] : null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden">
      {/* Шапка пары */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            {pairNumber}
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Clock size={12} />
            {timeLabel}
          </span>
          {entryType && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              · {entryType}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mt-1 leading-snug">
          {pair.subjectName}
        </h3>
      </div>

      {/* Список студентов */}
      <div className="divide-y divide-gray-100 dark:divide-neutral-800">
        {students.map((student) => (
          <AdminStudentRow
            key={student.id}
            student={student}
            absence={getAbsence(date, pairNumber, student.id)}
            onToggle={() => onToggleAbsence(date, pairNumber, student.id)}
          />
        ))}
      </div>
    </div>
  );
}
