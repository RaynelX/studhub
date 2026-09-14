import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useStudentTargeting } from '../../targeting/hooks/use-student-targeting';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, parseLocalDate } from '../../schedule/utils/week-utils';

export interface AllDeadline {
  id: string;
  subjectName?: string;
  description?: string;
  date: string;
  dateLabel: string;
  dayNumber: string;
  dayOfWeek: string;
  timeLabel: string;
}

export function useAllDeadlines(): {
  deadlines: AllDeadline[];
  loading: boolean;
} {
  const db = useDatabase();
  const { isForStudent } = useStudentTargeting();

  const { data: deadlines, loading: l1 } = useRxCollection(db.deadlines);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { deadlines: [], loading: true };

    const today = new Date();
    const todayStr = toISODate(today);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const filtered = deadlines.filter((d) => d.date >= todayStr && isForStudent(d));

    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    const result: AllDeadline[] = sorted.map((dl) => {
      const subject = dl.subject_id
        ? subjectMap.get(dl.subject_id)
        : undefined;

      const dlDate = parseLocalDate(dl.date);

      return {
        id: dl.id,
        subjectName: subject?.name,
        description: dl.description ?? undefined,
        date: dl.date,
        dateLabel: formatDeadlineDate(dl.date, todayStr),
        dayNumber: String(dlDate.getDate()),
        dayOfWeek: dlDate.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase(),
        timeLabel: dl.time
          ? dl.time.slice(0, 5)
          : 'В течение дня',
      };
    });

    return { deadlines: result, loading: false };
  }, [loading, deadlines, subjects, isForStudent]);
}

function formatDeadlineDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Сегодня';

  const date = parseLocalDate(dateStr);
  const today = parseLocalDate(todayStr);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 1) return 'Завтра';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}
