import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useStudentTargeting } from '../../targeting/hooks/use-student-targeting';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate } from '../utils/week-utils';

export interface DayDeadline {
  id: string;
  subjectName?: string;
  description?: string;
  time?: string;
}

export function useDayDeadlines(date: Date): {
  deadlines: DayDeadline[];
  loading: boolean;
} {
  const db = useDatabase();
  const { isForStudent } = useStudentTargeting();

  const { data: deadlines, loading: l1 } = useRxCollection(db.deadlines);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { deadlines: [], loading: true };

    const dateStr = toISODate(date);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const filtered = deadlines.filter((d) => d.date === dateStr && isForStudent(d));

    const result: DayDeadline[] = filtered.map((dl) => {
      const subject = dl.subject_id ? subjectMap.get(dl.subject_id) : undefined;

      return {
        id: dl.id,
        subjectName: subject?.name,
        description: dl.description ?? undefined,
        time: dl.time?.slice(0, 5) ?? undefined,
      };
    });

    return { deadlines: result, loading: false };
  }, [loading, deadlines, subjects, isForStudent, date]);
}
