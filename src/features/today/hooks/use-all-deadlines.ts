import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate } from '../../schedule/utils/week-utils';

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
  const { settings } = useSettings();

  const { data: deadlines, loading: l1 } = useRxCollection(db.deadlines);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { deadlines: [], loading: true };

    const today = new Date();
    const todayStr = toISODate(today);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const filtered = deadlines.filter((d) => {
      if (d.date < todayStr) return false;
      const langOk =
        d.target_language === 'all' || d.target_language === settings.language;
      const engOk =
        d.target_eng_subgroup === 'all' ||
        settings.language !== 'en' ||
        d.target_eng_subgroup === settings.eng_subgroup;
      const oitOk =
        d.target_oit_subgroup === 'all' ||
        d.target_oit_subgroup === settings.oit_subgroup;
      return langOk && engOk && oitOk;
    });

    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    const result: AllDeadline[] = sorted.map((dl) => {
      const subject = dl.subject_id
        ? subjectMap.get(dl.subject_id)
        : undefined;

      const dlDate = new Date(dl.date);

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
  }, [loading, deadlines, subjects, settings]);
}

function formatDeadlineDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Сегодня';

  const date = new Date(dateStr);
  const today = new Date(todayStr);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 1) return 'Завтра';

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}
