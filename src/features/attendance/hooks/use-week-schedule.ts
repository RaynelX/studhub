import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { buildDaySchedule } from '../../schedule/utils/schedule-builder';
import type { DaySlot } from '../../schedule/utils/schedule-builder';
import type { SemesterConfigDoc } from '../../../database/types';
import { addDays, toISODate, parseLocalDate } from '../../schedule/utils/week-utils';

// ============================================================
// Типы
// ============================================================

export interface WeekScheduleData {
  /** Map<"YYYY-MM-DD", DaySlot[]> — слоты по дням (Пн–Сб) */
  weekSchedule: Map<string, DaySlot[]>;
  loading: boolean;
  /** Конфигурация семестра (null если не загружена) */
  semesterConfig: SemesterConfigDoc | null;
}

// ============================================================
// Хук
// ============================================================

export function useWeekSchedule(monday: Date): WeekScheduleData {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: entries, loading: l1 } = useRxCollection(db.schedule);
  const { data: overrides, loading: l2 } = useRxCollection(db.overrides);
  const { data: events, loading: l3 } = useRxCollection(db.events);
  const { data: subjects, loading: l4 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l5 } = useRxCollection(db.teachers);
  const { data: semesterData, loading: l6 } = useRxCollection(db.semester);

  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  const mondayStr = toISODate(monday);

  return useMemo(() => {
    if (loading) return { weekSchedule: new Map(), loading: true, semesterConfig: null };

    const semesterConfig = semesterData[0] ?? null;
    const weekSchedule = new Map<string, DaySlot[]>();

    // Пн–Сб (6 дней) — derive Monday from string to avoid UTC-shift issues
    const mondayDate = parseLocalDate(mondayStr);
    for (let i = 0; i < 6; i++) {
      const date = addDays(mondayDate, i);
      const dateStr = toISODate(date);

      const { slots } = buildDaySchedule({
        date,
        settings,
        entries,
        overrides,
        events,
        subjects,
        teachers,
        semesterConfig,
      });

      weekSchedule.set(dateStr, slots);
    }

    return { weekSchedule, loading: false, semesterConfig };
  }, [loading, mondayStr, entries, overrides, events, subjects, teachers, semesterData, settings]);
}
