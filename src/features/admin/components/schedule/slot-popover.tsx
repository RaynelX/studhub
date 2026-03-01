import { X, Pencil, Trash2, Ban, RefreshCw, Plus } from 'lucide-react';
import type { GridCell } from '../../hooks/use-week-grid';
import type { SubjectDoc, TeacherDoc } from '../../../../database/types';
import { DAY_NAMES_SHORT } from '../../../../shared/constants/days';
import { getBellSlot } from '../../../../shared/constants/bell-schedule';
import { ENTRY_TYPE_LABELS, OVERRIDE_TYPE_LABELS, formatSubgroupCompact } from '../../../../shared/constants/admin-labels';

interface SlotPopoverProps {
  cell: GridCell;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  onClose: () => void;
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  onDeleteOverride?: (overrideId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  onQuickCancel?: (date: string, pairNumber: number) => void;
  onQuickReplace?: (date: string, pairNumber: number) => void;
  onQuickAdd?: (date: string, pairNumber: number) => void;
}

export function SlotPopover({
  cell,
  subjects,
  teachers,
  onClose,
  onEditEntry,
  onDeleteEntry,
  onDeleteOverride,
  onDeleteEvent,
  onQuickCancel,
  onQuickReplace,
  onQuickAdd,
}: SlotPopoverProps) {
  const bell = getBellSlot(cell.pairNumber);
  const dayName = DAY_NAMES_SHORT[cell.dayOfWeek] ?? '';

  const isEmpty = cell.entries.length === 0 && cell.overrides.length === 0 && cell.events.length === 0;

  return (
    <div className="mt-4 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 shadow-lg p-4 relative animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {dayName}, {cell.date} · {cell.pairNumber} пара
          {bell && (
            <span className="ml-1 text-neutral-400 font-normal">
              ({bell.startTime} – {bell.endTime})
            </span>
          )}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isEmpty ? (
        <div className="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
          Слот свободен. Можно добавить курс через визард «+ Добавить курс».
        </div>
      ) : (
        <div className="space-y-3">
          {/* Base entries */}
          {cell.entries.length > 0 && (
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Базовое расписание</div>
              {cell.entries.map((ge) => {
                const subj = ge.subject;
                const teacher = ge.teacher;
                const subgroups = formatSubgroupCompact(ge.entry, ', ');
                return (
                  <div
                    key={ge.entry.id}
                    className="flex items-start justify-between py-2 border-b border-neutral-50 dark:border-neutral-800 last:border-b-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {subj?.name ?? ge.entry.subject_id}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {ENTRY_TYPE_LABELS[ge.entry.entry_type] ?? ge.entry.entry_type}
                        {teacher && ` · ${teacher.full_name}`}
                        {ge.entry.room && ` · ${ge.entry.room}`}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {ge.entry.date_from} — {ge.entry.date_to}
                        {ge.entry.week_parity !== 'all' && (
                          <span className="ml-1">
                            ({ge.entry.week_parity === 'odd' ? 'нечёт' : 'чёт'})
                          </span>
                        )}
                        {subgroups && <span className="ml-1">· {subgroups}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button onClick={() => onEditEntry?.(ge.entry.id)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors" title="Редактировать">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDeleteEntry?.(ge.entry.id)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors" title="Удалить">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Overrides */}
          {cell.overrides.length > 0 && (
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Изменения на {cell.date}</div>
              {cell.overrides.map((go) => {
                const subj = go.subject ?? subjects.find((s) => s.id === go.override.subject_id);
                const teacher = go.teacher ?? teachers.find((t) => t.id === go.override.teacher_id);
                return (
                  <div
                    key={go.override.id}
                    className="flex items-start justify-between py-2 border-b border-neutral-50 dark:border-neutral-800 last:border-b-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            go.override.override_type === 'cancel'
                              ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                              : go.override.override_type === 'replace'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}
                        >
                          {OVERRIDE_TYPE_LABELS[go.override.override_type]}
                        </span>
                        {subj && (
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {subj.name}
                          </span>
                        )}
                      </div>
                      {(teacher || go.override.room || go.override.comment) && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {teacher && teacher.full_name}
                          {go.override.room && ` · ${go.override.room}`}
                          {go.override.comment && ` · ${go.override.comment}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button onClick={() => onDeleteOverride?.(go.override.id)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors" title="Удалить изменение">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Events */}
          {cell.events.length > 0 && (
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">События</div>
              {cell.events.map((ge) => (
                <div
                  key={ge.event.id}
                  className="flex items-start justify-between py-2 border-b border-neutral-50 dark:border-neutral-800 last:border-b-0"
                >
                  <div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{ge.event.title}</div>
                    {ge.event.description && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{ge.event.description}</div>
                    )}
                  </div>
                  <button onClick={() => onDeleteEvent?.(ge.event.id)} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition-colors" title="Удалить событие">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <button onClick={() => onQuickCancel?.(cell.date, cell.pairNumber)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors">
          <Ban className="w-3.5 h-3.5" />
          Отменить пару
        </button>
        <button onClick={() => onQuickReplace?.(cell.date, cell.pairNumber)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Замена
        </button>
        <button onClick={() => onQuickAdd?.(cell.date, cell.pairNumber)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Доп. пара
        </button>
      </div>
    </div>
  );
}
