import { useMemo } from 'react';
import type {
  ScheduleEntryDoc,
  ScheduleOverrideDoc,
  EventDoc,
  SubjectDoc,
  TeacherDoc,
  SemesterConfigDoc,
} from '../../../database/types';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { addDays, getMonday, toISODate, getWeekParity } from '../../schedule/utils/week-utils';
import { BELL_SCHEDULE } from '../../../shared/constants/bell-schedule';

// ============================================================
// Types
// ============================================================

export interface GridEntry {
  entry: ScheduleEntryDoc;
  subject?: SubjectDoc;
  teacher?: TeacherDoc;
}

export interface GridOverride {
  override: ScheduleOverrideDoc;
  subject?: SubjectDoc;
  teacher?: TeacherDoc;
}

export interface GridEvent {
  event: EventDoc;
  subject?: SubjectDoc;
  teacher?: TeacherDoc;
}

export interface GridCell {
  dayOfWeek: number;        // 1-6
  pairNumber: number;       // 1-5
  date: string;             // ISO date for this day in the current week
  entries: GridEntry[];      // base schedule entries active here
  overrides: GridOverride[]; // overrides for this date+pair
  events: GridEvent[];       // events for this date+pair
}

export interface WeekGridData {
  /** 6×5 grid: grid[dayIndex][pairIndex], dayIndex 0=Mon, pairIndex 0=pair1 */
  cells: GridCell[][];
  monday: Date;
  weekParity: 'odd' | 'even' | null;
  weekNumber: number | null;
  loading: boolean;
  subjects: SubjectDoc[];
  teachers: TeacherDoc[];
  semesterConfig: SemesterConfigDoc | null;
  entries: ScheduleEntryDoc[];
  overrides: ScheduleOverrideDoc[];
  events: EventDoc[];
}

// ============================================================
// Hook
// ============================================================

export function useWeekGrid(currentMonday: Date): WeekGridData {
  const db = useDatabase();
  const { data: entries, loading: l1 } = useRxCollection(db.schedule);
  const { data: overrides, loading: l2 } = useRxCollection(db.overrides);
  const { data: events, loading: l3 } = useRxCollection(db.events);
  const { data: subjects, loading: l4 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l5 } = useRxCollection(db.teachers);
  const { data: semesters, loading: l6 } = useRxCollection(db.semester);

  const loading = l1 || l2 || l3 || l4 || l5 || l6;
  const semesterConfig = semesters[0] ?? null;

  const monday = getMonday(currentMonday);

  const cells = useMemo(() => {
    const subjectMap = new Map(subjects.filter((s) => !s.is_deleted).map((s) => [s.id, s]));
    const teacherMap = new Map(teachers.filter((t) => !t.is_deleted).map((t) => [t.id, t]));

    const activeEntries = entries.filter((e) => !e.is_deleted);
    const activeOverrides = overrides.filter((o) => !o.is_deleted);
    const activeEvents = events.filter((e) => !e.is_deleted);

    const grid: GridCell[][] = [];

    for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
      const dayOfWeek = dayIdx + 1; // 1-6
      const dateObj = addDays(monday, dayIdx);
      const dateStr = toISODate(dateObj);
      const parity = semesterConfig
        ? getWeekParity(dateObj, semesterConfig.odd_week_start)
        : null;

      const dayCells: GridCell[] = [];

      for (let pairIdx = 0; pairIdx < BELL_SCHEDULE.length; pairIdx++) {
        const pairNumber = BELL_SCHEDULE[pairIdx].pairNumber;

        // Base entries for this day+pair that are active for this week
        const cellEntries = activeEntries
          .filter(
            (e) =>
              e.day_of_week === dayOfWeek &&
              e.pair_number === pairNumber &&
              dateStr >= e.date_from &&
              dateStr <= e.date_to &&
              (e.week_parity === 'all' || parity === null || e.week_parity === parity),
          )
          .map((e) => ({
            entry: e,
            subject: subjectMap.get(e.subject_id),
            teacher: teacherMap.get(e.teacher_id),
          }));

        // Overrides for this exact date+pair
        const cellOverrides = activeOverrides
          .filter((o) => o.date === dateStr && o.pair_number === pairNumber)
          .map((o) => ({
            override: o,
            subject: o.subject_id ? subjectMap.get(o.subject_id) : undefined,
            teacher: o.teacher_id ? teacherMap.get(o.teacher_id) : undefined,
          }));

        // Events for this exact date+pair
        const cellEvents = activeEvents
          .filter((ev) => ev.date === dateStr && ev.pair_number === pairNumber)
          .map((ev) => ({
            event: ev,
            subject: ev.subject_id ? subjectMap.get(ev.subject_id) : undefined,
            teacher: ev.teacher_id ? teacherMap.get(ev.teacher_id) : undefined,
          }));

        dayCells.push({
          dayOfWeek,
          pairNumber,
          date: dateStr,
          entries: cellEntries,
          overrides: cellOverrides,
          events: cellEvents,
        });
      }

      grid.push(dayCells);
    }

    return grid;
  }, [entries, overrides, events, subjects, teachers, monday, semesterConfig]);

  const weekParity = semesterConfig
    ? getWeekParity(monday, semesterConfig.odd_week_start)
    : null;

  const weekNumber = semesterConfig
    ? Math.floor(
        (monday.getTime() - getMonday(new Date(semesterConfig.start_date)).getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      ) + 1
    : null;

  return {
    cells,
    monday,
    weekParity,
    weekNumber,
    loading,
    subjects: subjects.filter((s) => !s.is_deleted),
    teachers: teachers.filter((t) => !t.is_deleted),
    semesterConfig,
    entries: entries.filter((e) => !e.is_deleted),
    overrides: overrides.filter((o) => !o.is_deleted),
    events: events.filter((e) => !e.is_deleted),
  };
}

// ============================================================
// Helpers
// ============================================================

/** A stable set of colors for subjects based on their index */
const SUBJECT_COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
  'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
  'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300',
  'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300',
  'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300',
  'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950 dark:border-cyan-800 dark:text-cyan-300',
  'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300',
  'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300',
  'bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300',
  'bg-pink-50 border-pink-200 text-pink-800 dark:bg-pink-950 dark:border-pink-800 dark:text-pink-300',
];

export function getSubjectColor(subjectId: string, subjectIds: string[]): string {
  const idx = subjectIds.indexOf(subjectId);
  return SUBJECT_COLORS[(idx >= 0 ? idx : 0) % SUBJECT_COLORS.length];
}
