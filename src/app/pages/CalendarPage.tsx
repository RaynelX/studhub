import { useState, useRef, useCallback } from 'react';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useDatabase } from '../providers/DatabaseProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';
import { useCalendarData } from '../../features/calendar/hooks/use-calendar-data';
import { CalendarGrid } from '../../features/calendar/components/CalendarGrid';
import { useHorizontalSwipe } from '../../shared/hooks/use-horizontal-swipe';
import type { SwipeDirection } from '../../shared/hooks/use-horizontal-swipe';
import { parseLocalDate } from '../../features/schedule/utils/week-utils';

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
  const semesterStart = semesterConfig ? parseLocalDate(semesterConfig.start_date) : null;
  const semesterEnd = semesterConfig ? parseLocalDate(semesterConfig.end_date) : null;

  const canGoPrev = !semesterStart || year > semesterStart.getFullYear() ||
    (year === semesterStart.getFullYear() && month > semesterStart.getMonth());
  const canGoNext = !semesterEnd || year < semesterEnd.getFullYear() ||
    (year === semesterEnd.getFullYear() && month < semesterEnd.getMonth());

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    if (month === 0) {
      setYear(y => y - 1);
      setMonth(11);
    } else {
      setMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    if (month === 11) {
      setYear(y => y + 1);
      setMonth(0);
    } else {
      setMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  // Swipe for month switching: left = next month, right = prev month
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerBounce = useCallback(
    (direction: SwipeDirection) => {
      const el = containerRef.current;
      if (!el) return;
      const cls = direction === 'left' ? 'anim-swipe-bounce-left' : 'anim-swipe-bounce-right';
      el.classList.remove('anim-swipe-bounce-left', 'anim-swipe-bounce-right');
      void el.offsetWidth;
      el.classList.add(cls);
      el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
    },
    [],
  );

  const swipeHandlers = useHorizontalSwipe({
    onSwipe: (dir) => {
      if (dir === 'left') {
        if (!canGoNext) { triggerBounce('left'); return; }
        goToNextMonth();
      } else {
        if (!canGoPrev) { triggerBounce('right'); return; }
        goToPrevMonth();
      }
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      {...swipeHandlers}
      className="h-full overflow-y-auto overflow-x-hidden"
    >
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
