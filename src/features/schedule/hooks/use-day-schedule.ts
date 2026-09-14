import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useStudentTargeting } from '../../targeting/hooks/use-student-targeting';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { buildDaySchedule, type DayEvents } from '../utils/schedule-builder';

export function useDaySchedule(date: Date): {
  schedule: DayEvents;
  loading: boolean;
} {
  const db = useDatabase();
  const { isForStudent, loading: targetingLoading } = useStudentTargeting();

  const { data: entries, loading: l1 } = useRxCollection(db.schedule);
  const { data: overrides, loading: l2 } = useRxCollection(db.overrides);
  const { data: events, loading: l3 } = useRxCollection(db.events);
  const { data: subjects, loading: l4 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l5 } = useRxCollection(db.teachers);
  const { data: semesterData, loading: l6 } = useRxCollection(db.semester);

  const loading = targetingLoading || l1 || l2 || l3 || l4 || l5 || l6;

  if (loading) {
    return { schedule: { slots: [], floatingEvents: [] }, loading: true };
  }

  const schedule = buildDaySchedule({
    date,
    isForStudent,
    entries,
    overrides,
    events,
    subjects,
    teachers,
    semesterConfig: semesterData[0] ?? null,
  });

  return { schedule, loading: false };
}