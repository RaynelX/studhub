import { useState } from 'react';
import { ChevronDown, Mail, Clock } from 'lucide-react';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';
import type { TeacherDoc } from '../../../database/types';

/** Инициалы для кружка-аватара: «Иванов Иван Иванович» → «ИИ» */
function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function DepartmentTeacherRow({ teacher }: { teacher: TeacherDoc }) {
  const [expanded, setExpanded] = useState(false);
  const hasContacts = !!(teacher.email || teacher.consultation_info);
  const rippleRef = useTouchRipple<HTMLDivElement>({ stopPropagation: true });

  return (
    <div ref={rippleRef} className="relative">
      <button
        onClick={() => hasContacts && setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:opacity-70 transition-opacity"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-500 dark:text-neutral-400 shrink-0">
          {initials(teacher.full_name)}
        </span>

        <span className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {teacher.full_name}
          </span>
          {teacher.position && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              {teacher.position}
            </span>
          )}
        </span>

        {hasContacts && (
          <span
            className="shrink-0 anim-chevron"
            style={{ transform: `rotate(${expanded ? 180 : 0}deg)` }}
          >
            <ChevronDown size={16} className="text-neutral-400 dark:text-neutral-500" />
          </span>
        )}
      </button>

      <div className="grid-expandable" data-expanded={expanded && hasContacts}>
        <div className="grid-expandable-inner">
          <div className="pl-16 pr-4 pb-3 space-y-2">
            {teacher.email && (
              <a
                href={`mailto:${teacher.email}`}
                className="flex w-fit items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
              >
                <Mail size={15} className="shrink-0" />
                <span>{teacher.email}</span>
              </a>
            )}
            {teacher.consultation_info && (
              <div className="flex items-start gap-2.5 text-sm text-neutral-500 dark:text-neutral-400">
                <Clock size={15} className="shrink-0 mt-0.5" />
                <span>{teacher.consultation_info}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
