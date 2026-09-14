import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useStudentTargeting } from '../../targeting/hooks/use-student-targeting';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, parseLocalDate } from '../../schedule/utils/week-utils';
import type { EventType } from '../../../database/types';

export interface AllEvent {
  id: string;
  eventType: EventType;
  subjectName?: string;
  description?: string;
  date: string;
  dateLabel: string;
  dayNumber: string;
  dayOfWeek: string;
  timeLabel: string;
  teacherName?: string;
  room?: string;
}

export function useAllEvents(): {
  events: AllEvent[];
  loading: boolean;
} {
  const db = useDatabase();
  const { isForStudent, loading: targetingLoading } = useStudentTargeting();

  const { data: events, loading: l1 } = useRxCollection(db.events);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l3 } = useRxCollection(db.teachers);

  const loading = targetingLoading || l1 || l2 || l3;

  return useMemo(() => {
    if (loading) return { events: [], loading: true };

    const today = new Date();
    const todayStr = toISODate(today);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    const filtered = events.filter((e) => e.date >= todayStr && isForStudent(e));

    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    const result: AllEvent[] = sorted.map((event) => {
      const subject = event.subject_id
        ? subjectMap.get(event.subject_id)
        : undefined;
      const teacher = event.teacher_id
        ? teacherMap.get(event.teacher_id)
        : undefined;

      const eventDate = parseLocalDate(event.date);

      return {
        id: event.id,
        eventType: event.event_type,
        subjectName: subject?.name,
        description: event.description ?? undefined,
        date: event.date,
        dateLabel: formatEventDate(event.date, todayStr),
        dayNumber: String(eventDate.getDate()),
        dayOfWeek: eventDate.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase(),
        timeLabel: event.pair_number
          ? `${event.pair_number} пара`
          : event.event_time
            ? event.event_time.slice(0, 5)
            : 'В течение дня',
        teacherName: teacher?.full_name,
        room: event.room ?? undefined,
      };
    });

    return { events: result, loading: false };
  }, [loading, events, subjects, teachers, isForStudent]);
}

function formatEventDate(dateStr: string, todayStr: string): string {
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
