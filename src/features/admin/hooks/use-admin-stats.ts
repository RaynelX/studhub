import { useMemo } from 'react';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { toISODate, getMonday, addDays } from '../../schedule/utils/week-utils';

interface SemesterProgress {
  name: string;
  percent: number;
  daysLeft: number;
  totalDays: number;
}

interface AdminStats {
  subjectCount: number;
  overrideCountThisWeek: number;
  upcomingEventsCount: number;
  upcomingDeadlinesCount: number;
  studentCount: number;
  todayPairsCount: number;
  todayOverridesCount: number;
  scheduleEntryCount: number;
  semesterProgress: SemesterProgress | null;
  loading: boolean;
}

/**
 * Reads RxDB collections to compute dashboard stats.
 */
export function useAdminStats(): AdminStats {
  const db = useDatabase();
  const { data: subjects, loading: l1 } = useRxCollection(db.subjects);
  const { data: overrides, loading: l2 } = useRxCollection(db.overrides);
  const { data: events, loading: l3 } = useRxCollection(db.events);
  const { data: students, loading: l4 } = useRxCollection(db.students);
  const { data: schedule, loading: l5 } = useRxCollection(db.schedule);
  const { data: semesters, loading: l6 } = useRxCollection(db.semester);
  const { data: deadlines, loading: l7 } = useRxCollection(db.deadlines);

  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => getMonday(today), [today]);
  const sunday = useMemo(() => addDays(monday, 6), [monday]);

  const mondayISO = toISODate(monday);
  const sundayISO = toISODate(sunday);
  const todayISO = toISODate(today);
  const todayDow = today.getDay() === 0 ? 7 : today.getDay(); // 1-7 Mon-Sun

  const overrideCountThisWeek = useMemo(
    () => overrides.filter((o) => o.date >= mondayISO && o.date <= sundayISO).length,
    [overrides, mondayISO, sundayISO],
  );

  const upcomingEventsCount = useMemo(
    () => events.filter((e) => e.date >= todayISO).length,
    [events, todayISO],
  );

  const upcomingDeadlinesCount = useMemo(
    () => deadlines.filter((d) => d.date >= todayISO).length,
    [deadlines, todayISO],
  );

  const todayPairsCount = useMemo(
    () =>
      schedule.filter(
        (e) =>
          !e.is_deleted &&
          e.day_of_week === todayDow &&
          e.date_from <= todayISO &&
          e.date_to >= todayISO,
      ).length,
    [schedule, todayDow, todayISO],
  );

  const todayOverridesCount = useMemo(
    () => overrides.filter((o) => o.date === todayISO).length,
    [overrides, todayISO],
  );

  const scheduleEntryCount = useMemo(
    () => schedule.filter((e) => !e.is_deleted).length,
    [schedule],
  );

  const semesterProgress = useMemo<SemesterProgress | null>(() => {
    if (semesters.length === 0) return null;
    // Find the current semester (today is between start and end)
    const current = semesters.find(
      (s) => s.start_date <= todayISO && s.end_date >= todayISO,
    );
    if (!current) return null;

    const start = new Date(current.start_date + 'T00:00:00');
    const end = new Date(current.end_date + 'T00:00:00');
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
    const elapsed = Math.round((today.getTime() - start.getTime()) / 86_400_000);
    const percent = totalDays > 0 ? Math.min(100, Math.round((elapsed / totalDays) * 100)) : 0;
    const daysLeft = Math.max(0, totalDays - elapsed);

    return { name: current.name, percent, daysLeft, totalDays };
  }, [semesters, todayISO, today]);

  return {
    subjectCount: subjects.filter((s) => !s.is_deleted).length,
    overrideCountThisWeek,
    upcomingEventsCount,
    upcomingDeadlinesCount,
    studentCount: students.filter((s) => !s.is_deleted).length,
    todayPairsCount,
    todayOverridesCount,
    scheduleEntryCount,
    semesterProgress,
    loading: l1 || l2 || l3 || l4 || l5 || l6 || l7,
  };
}
