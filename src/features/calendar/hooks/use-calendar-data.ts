import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
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
  const { settings } = useSettings();

  const { data: events, loading: l1 } = useRxCollection(db.events);
  const { data: deadlines, loading: l2 } = useRxCollection(db.deadlines);
  const { data: subjects, loading: l3 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l4 } = useRxCollection(db.teachers);

  const loading = l1 || l2 || l3 || l4;

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
      const langOk = e.target_language === 'all' || e.target_language === settings.language;
      const engOk = e.target_eng_subgroup === 'all' || settings.language !== 'en' || e.target_eng_subgroup === settings.eng_subgroup;
      const oitOk = e.target_oit_subgroup === 'all' || e.target_oit_subgroup === settings.oit_subgroup;
      if (!langOk || !engOk || !oitOk) continue;

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
      const langOk = d.target_language === 'all' || d.target_language === settings.language;
      const engOk = d.target_eng_subgroup === 'all' || settings.language !== 'en' || d.target_eng_subgroup === settings.eng_subgroup;
      const oitOk = d.target_oit_subgroup === 'all' || d.target_oit_subgroup === settings.oit_subgroup;
      if (!langOk || !engOk || !oitOk) continue;

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
  }, [loading, events, deadlines, subjects, teachers, settings, year, month]);
}
