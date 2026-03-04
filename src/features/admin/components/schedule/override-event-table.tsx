import { useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import type { ScheduleOverrideDoc, EventDoc, SubjectDoc, TeacherDoc } from '../../../../database/types';
import { OVERRIDE_TYPE_LABELS, OVERRIDE_TYPE_COLORS } from '../../../../shared/constants/admin-labels';
import { SortableTh } from '../ui/sortable-th';
import { useSortState } from '../../hooks/use-sort-state';

interface OverrideEventTableProps {
  overrides: ScheduleOverrideDoc[];
  events: EventDoc[];
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  onDeleteOverride?: (id: string) => void;
  onDeleteEvent?: (id: string) => void;
}

export function OverrideEventTable({
  overrides,
  events,
  subjects,
  teachers,
  onDeleteOverride,
  onDeleteEvent,
}: OverrideEventTableProps) {
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  type Row = { kind: 'override'; date: string; item: ScheduleOverrideDoc } | { kind: 'event'; date: string; item: EventDoc };

  const allItems = useMemo<Row[]>(() => [
    ...overrides
      .filter((o) => !o.is_deleted)
      .map((o) => ({ kind: 'override' as const, date: o.date, item: o })),
    ...events
      .filter((e) => !e.is_deleted)
      .map((e) => ({ kind: 'event' as const, date: e.date, item: e })),
  ], [overrides, events]);

  const sortAccessors = useMemo(
    () => ({
      date: (r: Row) => r.date,
      type: (r: Row) => r.kind === 'override' ? (OVERRIDE_TYPE_LABELS[r.item.override_type] ?? '') : 'Событие',
      pair: (r: Row) => r.kind === 'override' ? r.item.pair_number : (r.item.pair_number ?? 99),
      subject: (r: Row) => {
        const sid = r.kind === 'override' ? r.item.subject_id : r.item.subject_id;
        if (!sid) return '';
        const s = subjectMap.get(sid);
        return s?.short_name ?? s?.name ?? '';
      },
    }),
    [subjectMap],
  );

  const { column: sortCol, direction: sortDir, toggle: toggleSort, sorted: sortedItems } =
    useSortState(allItems, sortAccessors, 'date');

  if (sortedItems.length === 0) {
    return (
      <div className="text-sm text-neutral-400 dark:text-neutral-500 py-6 text-center">
        Нет изменений и событий для отображения
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
            <SortableTh column="date" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Дата</SortableTh>
            <SortableTh column="type" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Тип</SortableTh>
            <SortableTh column="pair" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Пара</SortableTh>
            <SortableTh column="subject" activeColumn={sortCol} direction={sortDir} onToggle={toggleSort} className="px-3 py-2">Предмет</SortableTh>
            <th className="px-3 py-2">Преп. / Описание</th>
            <th className="px-3 py-2">Ауд.</th>
            <th className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((row) => {
            if (row.kind === 'override') {
              const o = row.item;
              const subj = o.subject_id ? subjectMap.get(o.subject_id) : undefined;
              const teacher = o.teacher_id ? teacherMap.get(o.teacher_id) : undefined;
              return (
                <tr key={o.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300 tabular-nums">{o.date}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${OVERRIDE_TYPE_COLORS[o.override_type] ?? ''}`}>
                      {OVERRIDE_TYPE_LABELS[o.override_type] ?? o.override_type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{o.pair_number}</td>
                  <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{subj?.short_name ?? subj?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
                    {teacher?.full_name ?? ''}
                    {o.comment && <span className="ml-1 text-neutral-400 dark:text-neutral-500">({o.comment})</span>}
                  </td>
                  <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{o.room ?? '—'}</td>
                  <td className="px-3 py-2">
                    {onDeleteOverride && (
                      <button
                        onClick={() => onDeleteOverride(o.id)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            }

            // Event
            const e = row.item;
            const subj = e.subject_id ? subjectMap.get(e.subject_id) : undefined;
            return (
              <tr key={e.id} className="border-b border-neutral-50 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300 tabular-nums">{e.date}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Событие
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{e.pair_number ?? '—'}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{subj?.short_name ?? subj?.name ?? '—'}</td>
                <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400">{e.title}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{e.room ?? '—'}</td>
                <td className="px-3 py-2">
                  {onDeleteEvent && (
                    <button
                      onClick={() => onDeleteEvent(e.id)}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
