import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import type { EventType } from '../../../database/types';
import { getBellSlot } from '../../../shared/constants/bell-schedule';

// ============================================================
// Типы
// ============================================================

export interface SessionEvent {
  id: string;
  eventType: EventType;
  title: string;
  subjectName?: string;
  subjectShortName?: string;
  teacherName?: string;
  description?: string;
  date: string;
  timeLabel: string;
  room?: string;
  consultation?: { date: string; timeLabel: string };
}

export interface SessionScheduleData {
  events: SessionEvent[];
  byDate: Map<string, SessionEvent[]>;
  loading: boolean;
}

const SESSION_EVENT_TYPES: EventType[] = ['exam', 'credit', 'consultation'];

// ============================================================
// Хук
// ============================================================

export function useSessionSchedule(): SessionScheduleData {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: events, loading: l1 } = useRxCollection(db.events);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l3 } = useRxCollection(db.teachers);

  const loading = l1 || l2 || l3;

  return useMemo(() => {
    if (loading) return { events: [], byDate: new Map(), loading: true };

    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t]));

    // Фильтруем события сессии по типу и настройкам студента
    const filtered = events.filter((e) => {
      if (!SESSION_EVENT_TYPES.includes(e.event_type)) return false;
      const langOk =
        e.target_language === 'all' || e.target_language === settings.language;
      const engOk =
        e.target_eng_subgroup === 'all' ||
        settings.language !== 'en' ||
        e.target_eng_subgroup === settings.eng_subgroup;
      const oitOk =
        e.target_oit_subgroup === 'all' ||
        e.target_oit_subgroup === settings.oit_subgroup;
      return langOk && engOk && oitOk;
    });

    // Собираем консультации по subject_id для перекрёстных ссылок
    const consultationBySubject = new Map<string, { date: string; timeLabel: string }>();
    for (const e of filtered) {
      if (e.event_type === 'consultation' && e.subject_id) {
        consultationBySubject.set(e.subject_id, {
          date: e.date,
          timeLabel: formatTimeLabel(e.pair_number, e.event_time),
        });
      }
    }

    // Преобразуем в SessionEvent
    const sessionEvents: SessionEvent[] = filtered.map((e) => {
      const subject = e.subject_id ? subjectMap.get(e.subject_id) : undefined;
      const teacher = e.teacher_id ? teacherMap.get(e.teacher_id) : undefined;

      const consultation =
        e.event_type === 'exam' && e.subject_id
          ? consultationBySubject.get(e.subject_id)
          : undefined;

      return {
        id: e.id,
        eventType: e.event_type,
        title: subject?.name ?? e.title,
        subjectName: subject?.name,
        subjectShortName: subject?.short_name,
        teacherName: teacher?.full_name,
        description: e.description ?? undefined,
        date: e.date,
        timeLabel: formatTimeLabel(e.pair_number, e.event_time),
        room: e.room ?? undefined,
        consultation,
      };
    });

    // Сортировка: по дате, затем по времени
    sessionEvents.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.timeLabel.localeCompare(b.timeLabel);
    });

    // Группировка по дате
    const byDate = new Map<string, SessionEvent[]>();
    for (const event of sessionEvents) {
      const dateEvents = byDate.get(event.date);
      if (dateEvents) {
        dateEvents.push(event);
      } else {
        byDate.set(event.date, [event]);
      }
    }

    return { events: sessionEvents, byDate, loading: false };
  }, [loading, events, subjects, teachers, settings]);
}

// ============================================================
// Утилиты
// ============================================================

function formatTimeLabel(pairNumber?: number, eventTime?: string): string {
  if (pairNumber) {
    const slot = getBellSlot(pairNumber);
    return slot ? `${slot.startTime}–${slot.endTime}` : `${pairNumber} пара`;
  }
  if (eventTime) return eventTime.slice(0, 5);
  return 'В течение дня';
}
