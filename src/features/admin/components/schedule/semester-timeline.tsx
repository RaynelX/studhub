import { useMemo } from 'react';
import type { ScheduleEntryDoc, SubjectDoc, SemesterConfigDoc } from '../../../../database/types';
import { getSubjectColor } from '../../hooks/use-week-grid';

interface SemesterTimelineProps {
  entries: ScheduleEntryDoc[];
  subjects: SubjectDoc[];
  semesterConfig: SemesterConfigDoc | null;
}

export function SemesterTimeline({ entries, subjects, semesterConfig }: SemesterTimelineProps) {
  const subjectIds = useMemo(() => subjects.map((s) => s.id), [subjects]);

  const semDates = useMemo(() => {
    if (!semesterConfig) return null;
    const semStart = new Date(semesterConfig.start_date + 'T00:00:00');
    const semEnd = new Date(semesterConfig.end_date + 'T00:00:00');
    const totalDays = Math.max(1, Math.round((semEnd.getTime() - semStart.getTime()) / (24 * 60 * 60 * 1000)));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOffset = Math.round((today.getTime() - semStart.getTime()) / (24 * 60 * 60 * 1000));
    const todayPercent = Math.max(0, Math.min(100, (todayOffset / totalDays) * 100));
    return { semStart, semEnd, totalDays, todayPercent };
  }, [semesterConfig]);

  // Group entries by subject
  const grouped = useMemo(() => {
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const map = new Map<string, ScheduleEntryDoc[]>();
    for (const e of entries) {
      const list = map.get(e.subject_id) ?? [];
      list.push(e);
      map.set(e.subject_id, list);
    }
    return Array.from(map.entries())
      .map(([subjectId, items]) => ({
        subjectId,
        subject: subjectMap.get(subjectId),
        entries: items.sort((a, b) => a.date_from.localeCompare(b.date_from)),
      }))
      .sort((a, b) => (a.subject?.name ?? '').localeCompare(b.subject?.name ?? ''));
  }, [entries, subjects]);

  // Month markers
  const months = useMemo(() => {
    if (!semDates) return [];
    const { semStart, semEnd, totalDays } = semDates;
    const result: { label: string; percent: number }[] = [];
    const cursor = new Date(semStart);
    cursor.setDate(1);
    if (cursor < semStart) {
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const formatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
    while (cursor <= semEnd) {
      const offset = Math.round((cursor.getTime() - semStart.getTime()) / (24 * 60 * 60 * 1000));
      result.push({
        label: formatter.format(cursor),
        percent: (offset / totalDays) * 100,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [semDates]);

  if (!semesterConfig || !semDates) {
    return (
      <div className="text-sm text-neutral-400 dark:text-neutral-500 py-8 text-center">
        Настройки семестра не заданы
      </div>
    );
  }

  const { semStart, totalDays, todayPercent } = semDates;

  return (
    <div>
      {/* Month axis */}
      <div className="relative h-6 mb-2 border-b border-neutral-200 dark:border-neutral-700">
        {months.map((m, i) => (
          <div
            key={i}
            className="absolute text-[10px] text-neutral-400 font-medium"
            style={{ left: `${m.percent}%`, transform: 'translateX(-50%)' }}
          >
            {m.label}
          </div>
        ))}
        {/* Today marker */}
        {todayPercent >= 0 && todayPercent <= 100 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-500"
            style={{ left: `${todayPercent}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500" />
          </div>
        )}
      </div>

      {/* Subject rows */}
      {grouped.length === 0 ? (
        <div className="text-sm text-neutral-400 dark:text-neutral-500 py-6 text-center">
          Нет записей в расписании
        </div>
      ) : (
        <div className="space-y-1.5">
          {grouped.map(({ subjectId, subject, entries: subEntries }) => {
            const colorCls = getSubjectColor(subjectId, subjectIds);
            return (
              <div key={subjectId} className="flex items-center gap-3">
                {/* Subject label */}
                <div className="w-40 shrink-0 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate text-right">
                  {subject?.short_name ?? subject?.name ?? subjectId}
                </div>

                {/* Timeline bar */}
                <div className="flex-1 relative h-6 bg-neutral-50 dark:bg-neutral-800 rounded">
                  {subEntries.map((entry) => {
                    const from = new Date(entry.date_from + 'T00:00:00');
                    const to = new Date(entry.date_to + 'T00:00:00');
                    const leftOffset = Math.max(0, (from.getTime() - semStart.getTime()) / (24 * 60 * 60 * 1000));
                    const width = Math.max(1, (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
                    const leftPercent = (leftOffset / totalDays) * 100;
                    const widthPercent = (width / totalDays) * 100;

                    const parityLabel =
                      entry.week_parity === 'odd' ? '○' : entry.week_parity === 'even' ? '●' : '';

                    return (
                      <div
                        key={entry.id}
                        className={`absolute top-0.5 bottom-0.5 rounded border text-[9px] flex items-center justify-center overflow-hidden ${colorCls}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          minWidth: '4px',
                        }}
                        title={`${entry.date_from} — ${entry.date_to} (${entry.entry_type})${parityLabel ? ` ${parityLabel}` : ''}`}
                      >
                        {widthPercent > 8 && (
                          <span className="truncate px-1">
                            {entry.entry_type.slice(0, 3)}
                            {parityLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Today line */}
                  {todayPercent >= 0 && todayPercent <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-blue-500/30"
                      style={{ left: `${todayPercent}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-neutral-400 dark:text-neutral-500">
        <span>○ — нечёт</span>
        <span>● — чёт</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Сегодня
        </span>
      </div>
    </div>
  );
}
