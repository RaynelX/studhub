import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
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
  const { settings } = useSettings();

  const { data: deadlines, loading: l1 } = useRxCollection(db.deadlines);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { deadlines: [], loading: true };

    const dateStr = toISODate(date);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const filtered = deadlines.filter((d) => {
      if (d.date !== dateStr) return false;
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
  }, [loading, deadlines, subjects, settings, date]);
}
