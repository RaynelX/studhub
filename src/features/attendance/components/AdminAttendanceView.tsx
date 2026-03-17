import { useState, useMemo, useRef, useCallback } from 'react';
import { CalendarOff } from 'lucide-react';
import { WeekNavigator } from './WeekNavigator';
import { DayTabs } from './DayTabs';
import { AdminPairSection } from './AdminPairSection';
import { AdminSummaryTable } from './AdminSummaryTable';
import { useAdminAttendance } from '../hooks/use-admin-attendance';
import { useWeekSchedule } from '../hooks/use-week-schedule';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useExitTransitionWait } from '../../../shared/hooks/use-exit-transition';
import { useHorizontalSwipe } from '../../../shared/hooks/use-horizontal-swipe';
import type { SwipeDirection } from '../../../shared/hooks/use-horizontal-swipe';
import {
  getMonday,
  addDays,
  toISODate,
  getDayOfWeek,
  getWeekNumber,
  parseLocalDate,
} from '../../schedule/utils/week-utils';

const DOUBLE_TAP_MS = 350;

// ============================================================
// Компонент
// ============================================================

export function AdminAttendanceView() {
  const today = useMemo(() => new Date(), []);
  const todayMonday = useMemo(() => getMonday(today), [today]);
  const todayStr = useMemo(() => toISODate(today), [today]);

  // Если сегодня воскресенье — начинаем с субботы текущей недели
  const initialSelectedDate = useMemo(() => {
    if (getDayOfWeek(today) === 7) return toISODate(addDays(today, -1));
    return toISODate(today);
  }, [today]);

  const [monday, setMonday] = useState(todayMonday);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);

  // Анимация смены дня
  const [animDirection, setAnimDirection] = useState<'right' | 'left' | 'fade'>('fade');
  const { displayedKey, entering: dayEntering } = useExitTransitionWait(selectedDate, 120);

  const dayAnimClass = dayEntering
    ? animDirection === 'right' ? 'anim-day-enter-right'
    : animDirection === 'left'  ? 'anim-day-enter-left'
    : 'anim-day-enter-fade'
    : animDirection === 'right' ? 'anim-day-exit-left'
    : animDirection === 'left'  ? 'anim-day-exit-right'
    : 'anim-day-exit-fade';

  // Границы навигации
  const db = useDatabase();
  const { data: students } = useRxCollection(db.students);

  // Данные расписания — объявлены до функций навигации, чтобы canGoPrev/canGoNext
  // были доступны в deps массивах useCallback
  const { weekSchedule, loading, semesterConfig } = useWeekSchedule(monday);

  const weekNumber = semesterConfig
    ? getWeekNumber(monday, semesterConfig.start_date)
    : null;

  const canGoPrev = semesterConfig
    ? toISODate(monday) > semesterConfig.start_date
    : toISODate(monday) > toISODate(addDays(todayMonday, -28));

  const canGoNext = toISODate(monday) < toISODate(todayMonday);

  // Навигация
  const goToPrevWeek = useCallback(() => {
    if (!canGoPrev) return;
    setAnimDirection('fade');
    const newMonday = addDays(monday, -7);
    setMonday(newMonday);
    const dayOffset = getDayOfWeek(parseLocalDate(selectedDate)) - 1;
    setSelectedDate(toISODate(addDays(newMonday, dayOffset)));
  }, [canGoPrev, monday, selectedDate]);

  const goToNextWeek = useCallback(() => {
    if (!canGoNext) return;
    setAnimDirection('fade');
    const newMonday = addDays(monday, 7);
    setMonday(newMonday);
    const dayOffset = getDayOfWeek(parseLocalDate(selectedDate)) - 1;
    let newDate = toISODate(addDays(newMonday, dayOffset));
    if (newDate > todayStr) newDate = todayStr;
    setSelectedDate(newDate);
  }, [canGoNext, monday, selectedDate, todayStr]);

  const handleSelectDate = useCallback((dateStr: string) => {
    const newDay = getDayOfWeek(parseLocalDate(dateStr));
    const curDay = getDayOfWeek(parseLocalDate(selectedDate));
    setAnimDirection(newDay >= curDay ? 'right' : 'left');
    setSelectedDate(dateStr);
  }, [selectedDate]);

  // Данные посещаемости
  const { getAbsence, setAbsence, clearAbsence, studentSummaries } =
    useAdminAttendance(monday);

  // Сортированный список студентов (без удалённых)
  const sortedStudents = useMemo(() => {
    return students
      .filter((s) => !s.is_deleted)
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ru'));
  }, [students]);

  // Пары для отображаемого дня (с задержкой анимации)
  const dayPairs = useMemo(() => {
    const slots = weekSchedule.get(displayedKey) ?? [];
    return slots.filter(
      (s) => s.pair !== null && s.pair.status !== 'cancelled',
    );
  }, [weekSchedule, displayedKey]);

  // Тогл: none → unexcused → excused → none
  const handleToggleAbsence = useCallback(
    (date: string, pairNumber: number, studentId: string) => {
      const current = getAbsence(date, pairNumber, studentId);
      if (!current) {
        setAbsence(date, pairNumber, studentId, 'unexcused');
      } else if (current === 'unexcused') {
        setAbsence(date, pairNumber, studentId, 'excused');
      } else {
        clearAbsence(date, pairNumber, studentId);
      }
    },
    [getAbsence, setAbsence, clearAbsence],
  );

  // ============================================================
  // Gesture navigation
  // ============================================================

  const dayContentRef = useRef<HTMLDivElement>(null);
  const weekHeaderRef = useRef<HTMLDivElement>(null);

  const triggerBounce = useCallback(
    (container: HTMLDivElement | null, direction: SwipeDirection) => {
      if (!container) return;
      const cls = direction === 'left' ? 'anim-swipe-bounce-left' : 'anim-swipe-bounce-right';
      container.classList.remove('anim-swipe-bounce-left', 'anim-swipe-bounce-right');
      void container.offsetWidth;
      container.classList.add(cls);
      container.addEventListener('animationend', () => container.classList.remove(cls), { once: true });
    },
    [],
  );

  const handleDaySwipe = useCallback(
    (dir: SwipeDirection) => {
      const curOffset = getDayOfWeek(parseLocalDate(selectedDate)) - 1;
      if (dir === 'left') {
        const nextOffset = curOffset + 1;
        if (nextOffset > 5) {
          if (canGoNext) {
            const newMonday = addDays(monday, 7);
            setAnimDirection('right');
            setMonday(newMonday);
            let newDate = toISODate(newMonday);
            if (newDate > todayStr) newDate = todayStr;
            setSelectedDate(newDate);
          } else {
            triggerBounce(dayContentRef.current, 'left');
          }
        } else {
          setAnimDirection('right');
          setSelectedDate(toISODate(addDays(monday, nextOffset)));
        }
      } else {
        const prevOffset = curOffset - 1;
        if (prevOffset < 0) {
          if (canGoPrev) {
            const newMonday = addDays(monday, -7);
            setAnimDirection('left');
            setMonday(newMonday);
            setSelectedDate(toISODate(addDays(newMonday, 5)));
          } else {
            triggerBounce(dayContentRef.current, 'right');
          }
        } else {
          setAnimDirection('left');
          setSelectedDate(toISODate(addDays(monday, prevOffset)));
        }
      }
    },
    [selectedDate, monday, canGoNext, canGoPrev, triggerBounce, todayStr],
  );

  const handleDaySwipeBlocked = useCallback(
    (dir: SwipeDirection) => triggerBounce(dayContentRef.current, dir),
    [triggerBounce],
  );

  const daySwipeHandlers = useHorizontalSwipe({
    disabled: loading,
    onSwipe: handleDaySwipe,
    onBlocked: handleDaySwipeBlocked,
  });

  const handleWeekSwipe = useCallback(
    (dir: SwipeDirection) => {
      if (dir === 'left') {
        if (canGoNext) {
          goToNextWeek();
        } else {
          triggerBounce(weekHeaderRef.current, 'left');
        }
      } else {
        if (canGoPrev) {
          goToPrevWeek();
        } else {
          triggerBounce(weekHeaderRef.current, 'right');
        }
      }
    },
    [canGoNext, canGoPrev, goToNextWeek, goToPrevWeek, triggerBounce],
  );

  const handleWeekSwipeBlocked = useCallback(
    (dir: SwipeDirection) => triggerBounce(weekHeaderRef.current, dir),
    [triggerBounce],
  );

  const weekSwipeHandlers = useHorizontalSwipe({
    disabled: loading,
    onSwipe: handleWeekSwipe,
    onBlocked: handleWeekSwipeBlocked,
  });

  // Double-tap on week header → jump to today
  const lastTapRef = useRef(0);

  const handleWeekHeaderTap = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_MS) {
        lastTapRef.current = 0;
        setAnimDirection('fade');
        setMonday(todayMonday);
        setSelectedDate(initialSelectedDate);
      } else {
        lastTapRef.current = now;
      }
    },
    [todayMonday, initialSelectedDate],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={weekHeaderRef} {...weekSwipeHandlers} onClick={handleWeekHeaderTap} className="shrink-0">
        <WeekNavigator
          monday={monday}
          onPrev={goToPrevWeek}
          onNext={goToNextWeek}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          weekNumber={weekNumber}
        />
      </div>

      <DayTabs
        monday={monday}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />

      <div
        ref={dayContentRef}
        data-swipe-scroll
        {...daySwipeHandlers}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4"
      >
        <div key={displayedKey} className={dayAnimClass}>
          {dayPairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <CalendarOff
                size={56}
                strokeWidth={1.2}
                className="text-neutral-300 dark:text-neutral-600 mb-4"
              />
              <p className="text-base font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                Нет пар в этот день
              </p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500">
                Выберите другой день или неделю
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayPairs.map((slot) => (
                <AdminPairSection
                  key={slot.pairNumber}
                  pairNumber={slot.pairNumber}
                  pair={slot.pair!}
                  students={sortedStudents}
                  date={displayedKey}
                  getAbsence={getAbsence}
                  onToggleAbsence={handleToggleAbsence}
                />
              ))}
            </div>
          )}
        </div>

        <AdminSummaryTable
          students={sortedStudents}
          studentSummaries={studentSummaries}
          monday={monday}
        />
      </div>
    </div>
  );
}
