import { useMemo } from 'react';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { toISODate, getMonday, addDays } from '../../schedule/utils/week-utils';

interface AdminStats {
  subjectCount: number;
  overrideCountThisWeek: number;
  upcomingEventsCount: number;
  studentCount: number;
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

  const today = useMemo(() => new Date(), []);
  const monday = useMemo(() => getMonday(today), [today]);
  const sunday = useMemo(() => addDays(monday, 6), [monday]);

  const mondayISO = toISODate(monday);
  const sundayISO = toISODate(sunday);

  const overrideCountThisWeek = useMemo(
    () => overrides.filter((o) => o.date >= mondayISO && o.date <= sundayISO).length,
    [overrides, mondayISO, sundayISO],
  );

  const todayISO = toISODate(today);
  const upcomingEventsCount = useMemo(
    () => events.filter((e) => e.date >= todayISO).length,
    [events, todayISO],
  );

  return {
    subjectCount: subjects.length,
    overrideCountThisWeek,
    upcomingEventsCount,
    studentCount: students.length,
    loading: l1 || l2 || l3 || l4,
  };
}
