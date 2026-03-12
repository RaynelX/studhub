import { useState, useMemo } from 'react';
import { CalendarOff } from 'lucide-react';
import { WeekNavigator } from './WeekNavigator';
import { DayTabs } from './DayTabs';
import { AttendancePairCard } from './AttendancePairCard';
import { AttendanceSummary } from './AttendanceSummary';
import { useAttendance } from '../hooks/use-attendance';
import { useWeekSchedule } from '../hooks/use-week-schedule';
import { useExitTransitionWait } from '../../../shared/hooks/use-exit-transition';
import {
  getMonday,
  addDays,
  toISODate,
  getDayOfWeek,
  getWeekNumber,
  parseLocalDate,
} from '../../schedule/utils/week-utils';

// ============================================================
// Компонент
// ============================================================

export function StudentAttendanceView() {
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

  const goToPrevWeek = () => {
    if (!canGoPrev) return;
    setAnimDirection('fade');
    const newMonday = addDays(monday, -7);
    setMonday(newMonday);
    const dayOffset = getDayOfWeek(parseLocalDate(selectedDate)) - 1;
    setSelectedDate(toISODate(addDays(newMonday, dayOffset)));
  };

  const goToNextWeek = () => {
    if (!canGoNext) return;
    setAnimDirection('fade');
    const newMonday = addDays(monday, 7);
    setMonday(newMonday);
    const dayOffset = getDayOfWeek(parseLocalDate(selectedDate)) - 1;
    let newDate = toISODate(addDays(newMonday, dayOffset));
    if (newDate > todayStr) newDate = todayStr;
    setSelectedDate(newDate);
  };

  const handleSelectDate = (dateStr: string) => {
    const newDay = getDayOfWeek(parseLocalDate(dateStr));
    const curDay = getDayOfWeek(parseLocalDate(selectedDate));
    setAnimDirection(newDay >= curDay ? 'right' : 'left');
    setSelectedDate(dateStr);
  };

  // Данные расписания
  const { weekSchedule, loading, semesterConfig } = useWeekSchedule(monday);

  const weekNumber = semesterConfig
    ? getWeekNumber(monday, semesterConfig.start_date)
    : null;

  const canGoPrev = semesterConfig
    ? toISODate(monday) > semesterConfig.start_date
    : toISODate(monday) > toISODate(addDays(todayMonday, -28));

  const canGoNext = toISODate(monday) < toISODate(todayMonday);

  // Данные посещаемости
  const { getStatus, setStatus, clearStatus, summary } = useAttendance(monday);

  // Пары для отображаемого дня (с задержкой анимации)
  const dayPairs = useMemo(() => {
    const slots = weekSchedule.get(displayedKey) ?? [];
    return slots.filter(
      (s) => s.pair !== null && s.pair.status !== 'cancelled',
    );
  }, [weekSchedule, displayedKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <WeekNavigator
        monday={monday}
        onPrev={goToPrevWeek}
        onNext={goToNextWeek}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        weekNumber={weekNumber}
      />

      <DayTabs
        monday={monday}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4">
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
            <div className="space-y-3">
              {dayPairs.map((slot) => (
                <AttendancePairCard
                  key={slot.pairNumber}
                  pairNumber={slot.pairNumber}
                  pair={slot.pair!}
                  status={getStatus(displayedKey, slot.pairNumber)}
                  onSetStatus={(status) =>
                    setStatus(displayedKey, slot.pairNumber, status)
                  }
                  onClearStatus={() => clearStatus(displayedKey, slot.pairNumber)}
                />
              ))}
            </div>
          )}
        </div>

        <AttendanceSummary summary={summary} monday={monday} />
      </div>
    </div>
  );
}
