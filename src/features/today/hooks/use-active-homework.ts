import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useStudentTargeting } from '../../targeting/hooks/use-student-targeting';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, addDays, parseLocalDate } from '../../schedule/utils/week-utils';
import { BELL_SCHEDULE } from '../../../shared/constants/bell-schedule';

export interface ActiveHomework {
  id: string;
  subjectName: string;
  subjectId: string;
  content: string;
  assignedDate: string;
  pairNumber: number;
  dateLabel: string;
}

const DAYS_AHEAD = 30;

export function useActiveHomework(): {
  homework: ActiveHomework[];
  loading: boolean;
} {
  const db = useDatabase();
  const { isForStudent } = useStudentTargeting();

  const { data: homeworks, loading: l1 } = useRxCollection(db.homeworks);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { homework: [], loading: true };

    const now = new Date();
    const todayStr = toISODate(now);
    const endStr = toISODate(addDays(now, DAYS_AHEAD));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // Filter homeworks: only show for pairs that haven't ended yet
    const filtered = homeworks.filter((hw) => {
      if (hw.is_deleted) return false;
      
      // Only show homework for today and future dates
      if (hw.date < todayStr || hw.date > endStr) return false;
      
      // Check if the pair has already ended
      if (isPairEnded(hw.date, hw.pair_number, now)) return false;

      return isForStudent(hw);
    });

    // Sort by date ascending (closest first), limit to 5
    const sorted = [...filtered]
      .sort((a, b) => a.date.localeCompare(b.date) || a.pair_number - b.pair_number)
      .slice(0, 5);

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
  }, [loading, homeworks, subjects, isForStudent]);
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

function formatShortDate(dateStr: string, todayStr: string): string {
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
