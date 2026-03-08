import { useState } from 'react';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';
import { useCalendarData } from '../../features/calendar/hooks/use-calendar-data';
import { CalendarGrid } from '../../features/calendar/components/CalendarGrid';

export function CalendarPage() {
  useSetPageHeader({ title: 'Календарь', backTo: '/more' });

  const db = useDatabase();
  const { data: semesterData } = useRxCollection(db.semester);
  const semesterConfig = semesterData[0] ?? null;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { days, loading } = useCalendarData(year, month);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Semester boundaries (by month)
  const semesterStart = semesterConfig ? new Date(semesterConfig.start_date) : null;
  const semesterEnd = semesterConfig ? new Date(semesterConfig.end_date) : null;

  const canGoPrev = !semesterStart || year > semesterStart.getFullYear() ||
    (year === semesterStart.getFullYear() && month > semesterStart.getMonth());
  const canGoNext = !semesterEnd || year < semesterEnd.getFullYear() ||
    (year === semesterEnd.getFullYear() && month < semesterEnd.getMonth());

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const goToToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <CalendarGrid
        year={year}
        month={month}
        days={days}
        onPrevMonth={goToPrevMonth}
        onNextMonth={goToNextMonth}
        onGoToToday={goToToday}
        isCurrentMonth={isCurrentMonth}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
      />
    </div>
  );
}
