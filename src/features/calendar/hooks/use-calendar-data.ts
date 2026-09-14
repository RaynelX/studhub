import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useStudentTargeting } from '../../targeting/hooks/use-student-targeting';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import type { EventType } from '../../../database/types';

export interface CalendarEvent {
  id: string;
  title: string;
  eventType: EventType;
  subjectName?: string;
  description?: string;
  timeLabel: string;
  teacherName?: string;
  room?: string;
}

export interface CalendarDeadline {
  id: string;
  subjectName?: string;
  description?: string;
  timeLabel: string;
}

export interface CalendarDayData {
  events: CalendarEvent[];
  deadlines: CalendarDeadline[];
}

export function useCalendarData(year: number, month: number): {
  days: Map<string, CalendarDayData>;
  loading: boolean;
} {
  const db = useDatabase();
  const { isForStudent, loading: targetingLoading } = useStudentTargeting();

  const { data: events, loading: l1 } = useRxCollection(db.events);
  const { data: deadlines, loading: l2 } = useRxCollection(db.deadlines);
  const { data: subjects, loading: l3 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l4 } = useRxCollection(db.teachers);

  const loading = targetingLoading || l1 || l2 || l3 || l4;

  return useMemo(() => {
    if (loading) return { days: new Map(), loading: true };

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    // Date range for the displayed month
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDate = new Date(year, month + 1, 0);
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')}`;

    const days = new Map<string, CalendarDayData>();

    // Filter events for this month
    for (const e of events) {
      if (e.date < firstDay || e.date > lastDay) continue;
      if (!isForStudent(e)) continue;

      const subject = e.subject_id ? subjectMap.get(e.subject_id) : undefined;
      const teacher = e.teacher_id ? teacherMap.get(e.teacher_id) : undefined;

      const calEvent: CalendarEvent = {
        id: e.id,
        title: subject?.name ?? e.title,
        eventType: e.event_type,
        subjectName: subject?.name,
        description: e.description ?? undefined,
        timeLabel: e.pair_number
          ? `${e.pair_number} пара`
          : e.event_time
            ? e.event_time.slice(0, 5)
            : 'В течение дня',
        teacherName: teacher?.full_name,
        room: e.room ?? undefined,
      };

      const entry = days.get(e.date);
      if (entry) {
        entry.events.push(calEvent);
      } else {
        days.set(e.date, { events: [calEvent], deadlines: [] });
      }
    }

    // Filter deadlines for this month
    for (const d of deadlines) {
      if (d.date < firstDay || d.date > lastDay) continue;
      if (!isForStudent(d)) continue;

      const subject = d.subject_id ? subjectMap.get(d.subject_id) : undefined;

      const calDeadline: CalendarDeadline = {
        id: d.id,
        subjectName: subject?.name,
        description: d.description ?? undefined,
        timeLabel: d.time ? d.time.slice(0, 5) : 'Весь день',
      };

      const entry = days.get(d.date);
      if (entry) {
        entry.deadlines.push(calDeadline);
      } else {
        days.set(d.date, { events: [], deadlines: [calDeadline] });
      }
    }

    return { days, loading: false };
  }, [loading, events, deadlines, subjects, teachers, isForStudent, year, month]);
}
