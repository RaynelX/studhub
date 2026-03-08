import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, addDays } from '../../schedule/utils/week-utils';

export interface ActiveHomework {
  id: string;
  subjectName: string;
  subjectId: string;
  content: string;
  assignedDate: string;
  pairNumber: number;
  dateLabel: string;
}

const DAYS_BACK = 14;

export function useActiveHomework(): {
  homework: ActiveHomework[];
  loading: boolean;
} {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: homeworks, loading: l1 } = useRxCollection(db.homeworks);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { homework: [], loading: true };

    const today = new Date();
    const todayStr = toISODate(today);
    const startStr = toISODate(addDays(today, -DAYS_BACK));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // Filter homeworks for this student from the last 14 days
    const filtered = homeworks.filter((hw) => {
      if (hw.is_deleted) return false;
      if (hw.date < startStr || hw.date > todayStr) return false;
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

    if (filtered.length === 0) return { homework: [], loading: false };

    // Keep only the most recent homework per subject
    const latestBySubject = new Map<string, typeof filtered[0]>();
    for (const hw of filtered) {
      const existing = latestBySubject.get(hw.subject_id);
      if (!existing || hw.date > existing.date || (hw.date === existing.date && hw.pair_number > existing.pair_number)) {
        latestBySubject.set(hw.subject_id, hw);
      }
    }

    // Sort by date descending (most recent first)
    const sorted = [...latestBySubject.values()].sort((a, b) => b.date.localeCompare(a.date));

    const result: ActiveHomework[] = sorted.map((hw) => {
      const subject = subjectMap.get(hw.subject_id);
      return {
        id: hw.id,
        subjectName: subject?.short_name ?? subject?.name ?? 'Предмет',
        subjectId: hw.subject_id,
        content: hw.content,
        assignedDate: hw.date,
        pairNumber: hw.pair_number,
        dateLabel: formatShortDate(hw.date, todayStr),
      };
    });

    return { homework: result, loading: false };
  }, [loading, homeworks, subjects, settings]);
}

function formatShortDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Сегодня';

  const date = new Date(dateStr);
  const today = new Date(todayStr);
  const diffDays = Math.round(
    (today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 1) return 'Вчера';

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
