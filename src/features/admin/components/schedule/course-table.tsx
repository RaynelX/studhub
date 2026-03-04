import { useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ScheduleEntryDoc, SubjectDoc, TeacherDoc, SemesterConfigDoc } from '../../../../database/types';
import { DAY_NAMES_SHORT } from '../../../../shared/constants/days';
import { ENTRY_TYPE_LABELS, PARITY_LABELS, formatSubgroupCompact } from '../../../../shared/constants/admin-labels';
import { countTotalPairs } from '../../utils/schedule-calculator';
import { SortableTh } from '../ui/sortable-th';
import { useSortState } from '../../hooks/use-sort-state';

interface CourseTableProps {
  entries: ScheduleEntryDoc[];
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  semesterConfig: SemesterConfigDoc | null;
  onEdit?: (entry: ScheduleEntryDoc) => void;
  onDelete?: (id: string) => void;
}

export function CourseTable({
  entries,
  subjects,
  teachers,
  semesterConfig,
  onEdit,
  onDelete,
}: CourseTableProps) {
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  const sortAccessors = useMemo(
    () => ({
      subject: (e: ScheduleEntryDoc) => subjectMap.get(e.subject_id)?.name ?? '',
      type: (e: ScheduleEntryDoc) => ENTRY_TYPE_LABELS[e.entry_type] ?? e.entry_type,
      day: (e: ScheduleEntryDoc) => e.day_of_week,
      pair: (e: ScheduleEntryDoc) => e.pair_number,
      parity: (e: ScheduleEntryDoc) => e.week_parity,
      teacher: (e: ScheduleEntryDoc) => teacherMap.get(e.teacher_id)?.full_name ?? '',
      room: (e: ScheduleEntryDoc) => e.room ?? '',
    }),
    [subjectMap, teacherMap],
  );

  const { column: sortCol, direction: sortDir, toggle: toggleSort, sorted } =
    useSortState(entries, sortAccessors, 'subject');

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-neutral-400 dark:text-neutral-500 py-8 text-center">
        Нет записей в расписании
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
            <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
            <SortableTh column="subject" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Предмет</SortableTh>
            <SortableTh column="type" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Тип</SortableTh>
            <SortableTh column="day" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">День</SortableTh>
            <SortableTh column="pair" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Пара</SortableTh>
            <SortableTh column="parity" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Чётность</SortableTh>
            <SortableTh column="teacher" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Преподаватель</SortableTh>
            <SortableTh column="room" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Ауд.</SortableTh>
            <th className="px-3 py-2">Период</th>
            <th className="px-3 py-2">Пар</th>
            <th className="px-3 py-2">Подгруппы</th>
            <th className="px-3 py-2 w-20" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const subject = subjectMap.get(entry.subject_id);
            const teacher = teacherMap.get(entry.teacher_id);
            const pairCount =
              semesterConfig
                ? countTotalPairs(
                    entry.date_from,
                    entry.date_to,
                    entry.day_of_week,
                    entry.week_parity,
                    semesterConfig.odd_week_start,
                  )
                : '—';
            const subgroups = formatSubgroupCompact(entry);

            return (
              <tr
                key={entry.id}
                className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                  {subject?.short_name ?? subject?.name ?? entry.subject_id}
                </td>
                <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                  {ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type}
                </td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{DAY_NAMES_SHORT[entry.day_of_week] ?? entry.day_of_week}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{entry.pair_number}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      entry.week_parity === 'all'
                        ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        : entry.week_parity === 'odd'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {PARITY_LABELS[entry.week_parity] ?? entry.week_parity}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">{teacher?.full_name ?? '—'}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{entry.room || '—'}</td>
                <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400 text-xs tabular-nums">
                  {entry.date_from}
                  <br />
                  {entry.date_to}
                </td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300 tabular-nums">{pairCount}</td>
                <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400 text-xs">{subgroups || '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(entry)}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
