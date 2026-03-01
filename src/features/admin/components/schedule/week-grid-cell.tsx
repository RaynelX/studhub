import { AlertTriangle, CalendarCheck, Plus } from 'lucide-react';
import type { GridCell } from '../../hooks/use-week-grid';
import { getSubjectColor } from '../../hooks/use-week-grid';

const ENTRY_TYPE_LABELS: Record<string, string> = {
  lecture: 'Лек',
  seminar: 'Сем',
  practice: 'Пр',
  other: 'Др',
};

const SUBGROUP_LABELS: Record<string, string> = {
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  a: 'A',
  b: 'B',
};

interface WeekGridCellProps {
  cell: GridCell;
  subjectIds: string[];
  onClick: (cell: GridCell) => void;
}

export function WeekGridCell({ cell, subjectIds, onClick }: WeekGridCellProps) {
  const isEmpty = cell.entries.length === 0 && cell.overrides.length === 0 && cell.events.length === 0;
  const hasCancels = cell.overrides.some((o) => o.override.override_type === 'cancel');
  const hasReplacements = cell.overrides.some((o) => o.override.override_type === 'replace');
  const hasAdds = cell.overrides.some((o) => o.override.override_type === 'add');
  const hasEvents = cell.events.length > 0;

  return (
    <button
      onClick={() => onClick(cell)}
      className={`
        relative w-full min-h-[68px] p-1.5 rounded-lg border text-left transition-all text-xs
        hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:z-10
        ${isEmpty
          ? 'border-dashed border-neutral-200 dark:border-neutral-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 group'
          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
        }
      `}
    >
      {/* Empty state — plus icon */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-blue-400" />
        </div>
      )}

      {/* Base entries */}
      {cell.entries.map((ge, i) => {
        const colorCls = getSubjectColor(ge.entry.subject_id, subjectIds);
        const name = ge.subject?.short_name ?? ge.subject?.name ?? '—';
        const type = ENTRY_TYPE_LABELS[ge.entry.entry_type] ?? '';
        const subgroups = buildSubgroupBadges(ge.entry);
        const isCancelled = hasCancels && cell.overrides.some(
          (o) =>
            o.override.override_type === 'cancel' &&
            matchesSubgroup(o.override, ge.entry),
        );

        return (
          <div
            key={ge.entry.id}
            className={`
              rounded px-1 py-0.5 border leading-tight
              ${colorCls}
              ${isCancelled ? 'line-through opacity-50' : ''}
              ${i > 0 ? 'mt-0.5' : ''}
            `}
          >
            <div className="font-medium truncate">{name}</div>
            <div className="flex items-center gap-1 text-[10px] opacity-70">
              {type && <span>{type}</span>}
              {ge.entry.room && <span>· {ge.entry.room}</span>}
              {subgroups.length > 0 && (
                <span className="ml-auto">{subgroups.join('/')}</span>
              )}
            </div>
          </div>
        );
      })}

      {/* Override: replace / add entries */}
      {cell.overrides
        .filter((o) => o.override.override_type !== 'cancel')
        .map((go) => {
          const isReplace = go.override.override_type === 'replace';
          const name = go.subject?.short_name ?? go.subject?.name ?? '—';
          return (
            <div
              key={go.override.id}
              className={`
                rounded px-1 py-0.5 border leading-tight mt-0.5
                ${isReplace
                  ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                }
              `}
            >
              <div className="font-medium truncate">{name}</div>
              <div className="text-[10px] opacity-70">
                {isReplace ? 'Замена' : 'Доп.'}
                {go.override.room && ` · ${go.override.room}`}
              </div>
            </div>
          );
        })}

      {/* Events */}
      {cell.events.map((ge) => (
        <div
          key={ge.event.id}
          className="rounded px-1 py-0.5 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 leading-tight mt-0.5"
        >
          <div className="font-medium truncate">{ge.event.title}</div>
        </div>
      ))}

      {/* Corner badges for overrides/events */}
      <div className="absolute top-0.5 right-0.5 flex gap-0.5">
        {(hasCancels || hasReplacements || hasAdds) && (
          <AlertTriangle className="w-3 h-3 text-amber-500" />
        )}
        {hasEvents && (
          <CalendarCheck className="w-3 h-3 text-blue-500" />
        )}
      </div>
    </button>
  );
}

// ============================================================
// Helpers
// ============================================================

function buildSubgroupBadges(
  entry: { target_language: string; target_eng_subgroup: string; target_oit_subgroup: string },
): string[] {
  const badges: string[] = [];
  if (entry.target_language !== 'all') {
    badges.push(SUBGROUP_LABELS[entry.target_language] ?? entry.target_language);
  }
  if (entry.target_eng_subgroup !== 'all') {
    badges.push(`EN-${SUBGROUP_LABELS[entry.target_eng_subgroup] ?? entry.target_eng_subgroup}`);
  }
  if (entry.target_oit_subgroup !== 'all') {
    badges.push(`ОИТ-${SUBGROUP_LABELS[entry.target_oit_subgroup] ?? entry.target_oit_subgroup}`);
  }
  return badges;
}

function matchesSubgroup(
  a: { target_language: string; target_eng_subgroup: string; target_oit_subgroup: string },
  b: { target_language: string; target_eng_subgroup: string; target_oit_subgroup: string },
): boolean {
  // "all" matches everything
  if (a.target_language !== 'all' && b.target_language !== 'all' && a.target_language !== b.target_language) {
    return false;
  }
  if (a.target_eng_subgroup !== 'all' && b.target_eng_subgroup !== 'all' && a.target_eng_subgroup !== b.target_eng_subgroup) {
    return false;
  }
  if (a.target_oit_subgroup !== 'all' && b.target_oit_subgroup !== 'all' && a.target_oit_subgroup !== b.target_oit_subgroup) {
    return false;
  }
  return true;
}
