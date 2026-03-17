import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, addDays, parseLocalDate } from '../../schedule/utils/week-utils';
import { BELL_SCHEDULE } from '../../../shared/constants/bell-schedule';

export interface AllHomework {
  id: string;
  subjectName: string;
  content: string;
  date: string;
  dateLabel: string;
  dayNumber: string;
  dayOfWeek: string;
  pairNumber: number;
}

const DAYS_AHEAD = 30;

export function useAllHomework(): {
  homework: AllHomework[];
  loading: boolean;
} {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: homeworks, loading: l1 } = useRxCollection(db.homeworks);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { homework: [], loading: true };

    const now = new Date();
    const todayStr = toISODate(now);
    const endStr = toISODate(addDays(now, DAYS_AHEAD));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const filtered = homeworks.filter((hw) => {
      if (hw.is_deleted) return false;
      
      // Only show homework for today and future dates
      if (hw.date < todayStr || hw.date > endStr) return false;
      
      // Check if the pair has already ended
      if (isPairEnded(hw.date, hw.pair_number, now)) return false;
      
      const langOk =
        hw.target_language === 'all' || hw.target_language === settings.language;
      const engOk =
        hw.target_eng_subgroup === 'all' ||
        settings.language !== 'en' ||
        hw.target_eng_subgroup === settings.eng_subgroup;
      const oitOk =
        hw.target_oit_subgroup === 'all' ||
        hw.target_oit_subgroup === settings.oit_subgroup;
      return langOk && engOk && oitOk;
    });

    const sorted = [...filtered].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.pair_number - b.pair_number,
    );

    const result: AllHomework[] = sorted.map((hw) => {
      const subject = subjectMap.get(hw.subject_id);
      const hwDate = parseLocalDate(hw.date);

      return {
        id: hw.id,
        subjectName: subject?.name ?? subject?.short_name ?? 'Предмет',
        content: hw.content,
        date: hw.date,
        dateLabel: formatHomeworkDate(hw.date, todayStr),
        dayNumber: String(hwDate.getDate()),
        dayOfWeek: hwDate.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase(),
        pairNumber: hw.pair_number,
      };
    });

    return { homework: result, loading: false };
  }, [loading, homeworks, subjects, settings]);
}

/**
 * Check if a pair has already ended (for filtering out past homework)
 */
function isPairEnded(dateStr: string, pairNumber: number, now: Date): boolean {
  const bellSlot = BELL_SCHEDULE.find(s => s.pairNumber === pairNumber);
  if (!bellSlot) return false;

  const todayStr = toISODate(now);

  // If the date is in the past, the pair has ended
  if (dateStr < todayStr) {
    return true;
  }

  // If the date is today, check if the pair's end time has passed
  if (dateStr === todayStr) {
    const [hours, minutes] = bellSlot.endTime.split(':').map(Number);
    const pairEndTime = new Date(now);
    pairEndTime.setHours(hours, minutes, 0, 0);
    return now > pairEndTime;
  }

  // If the date is in the future, the pair hasn't ended
  return false;
}

function formatHomeworkDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Сегодня';

  const date = parseLocalDate(dateStr);
  const today = parseLocalDate(todayStr);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 1) return 'Завтра';

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
