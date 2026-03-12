import type { AbsenceType } from '../hooks/use-admin-attendance';
import type { StudentDoc } from '../../../database/types';

// ============================================================
// Типы
// ============================================================

interface AdminStudentRowProps {
  student: StudentDoc;
  absence: AbsenceType | undefined;
  onToggle: () => void;
}

// ============================================================
// Компонент
// ============================================================

export function AdminStudentRow({ student, absence, onToggle }: AdminStudentRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-2.5 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors"
    >
      <span className="text-sm text-neutral-800 dark:text-neutral-200 truncate mr-3">
        {student.full_name}
      </span>
      <StatusBadge absence={absence} />
    </button>
  );
}

// ============================================================
// Внутренние компоненты
// ============================================================

function StatusBadge({ absence }: { absence: AbsenceType | undefined }) {
  if (!absence) {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-xs font-medium">
        ✓
      </span>
    );
  }

  if (absence === 'unexcused') {
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500 text-white dark:bg-red-600 text-xs font-bold">
        Н
      </span>
    );
  }

  return (
    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white dark:bg-amber-600 text-xs font-bold">
      У
    </span>
  );
}
