import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDaySchedule } from '../../features/schedule/hooks/use-day-schedule';
import { DaySchedule } from '../../features/schedule/components/DaySchedule';
import {
  getMonday,
  addDays,
  getDayOfWeek,
  isToday,
  formatWeekRange,
  getWeekNumber,
} from '../../features/schedule/utils/week-utils';
import { useDatabase } from '../providers/DatabaseProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';
import { DAY_NAMES_SHORT } from '../../shared/constants/days';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useFlipPill } from '../../shared/hooks/use-flip-pill';
import { useExitTransitionWait } from '../../shared/hooks/use-exit-transition';

// ============================================================
// Компонент страницы
// ============================================================

export function SchedulePage() {
  const db = useDatabase();
  const { data: semesterData } = useRxCollection(db.semester);
  const semesterConfig = semesterData[0] ?? null;

  // Если сегодня воскресенье — по умолчанию показываем понедельник следующей недели
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    return getDayOfWeek(today) === 7 ? addDays(today, 1) : today;
  });

  const monday = getMonday(selectedDate);
  const weekRange = formatWeekRange(monday);
  const weekNumber = semesterConfig
    ? getWeekNumber(selectedDate, semesterConfig.start_date)
    : null;

  // Границы навигации по неделям (на основе дат семестра)
  const semesterStartMonday = semesterConfig
    ? getMonday(new Date(semesterConfig.start_date))
    : null;
  const semesterEndMonday = semesterConfig
    ? getMonday(new Date(semesterConfig.end_date))
    : null;

  const canGoPrev = !semesterStartMonday || monday.getTime() > semesterStartMonday.getTime();
  const canGoNext = !semesterEndMonday || monday.getTime() < semesterEndMonday.getTime();

  // Направление анимации при смене дня — задаётся в обработчиках навигации
  const [animDirection, setAnimDirection] = useState<'right' | 'left' | 'fade'>('fade');

  // Навигация по неделям
  const goToPrevWeek = () => { if (canGoPrev) { setAnimDirection('fade'); setSelectedDate((d) => addDays(d, -7)); } };
  const goToNextWeek = () => { if (canGoNext) { setAnimDirection('fade'); setSelectedDate((d) => addDays(d, 7)); } };
  const goToDay = (dayOffset: number) => {
    const newDay = dayOffset + 1;
    const curDay = getDayOfWeek(selectedDate);
    setAnimDirection(newDay >= curDay ? 'right' : 'left');
    setSelectedDate(addDays(monday, dayOffset));
  };

  // Ref для контейнера дней (для FLIP pill)
  const dayTabsRef = useRef<HTMLDivElement>(null);

  // Определяем индекс выбранного дня для pill (0-6, воскресенье = -1)
  const selectedDayIndex = (() => {
    const day = getDayOfWeek(selectedDate);
    const isCurrentWeek = getMonday(selectedDate).getTime() === monday.getTime();
    if (!isCurrentWeek || day === 7) return -1;
    return day - 1;
  })();

  const pillStyle = useFlipPill(dayTabsRef, selectedDayIndex);

  // Ключ для анимации смены дня — displayedKey задерживается на время exit-анимации,
  // чтобы контент не менялся до завершения выхода.
  const dateKey = selectedDate.toISOString();
  const { displayedKey, entering: dayEntering } = useExitTransitionWait(dateKey, 120);

  // Данные расписания привязаны к displayedDate, а не к selectedDate.
  // Это гарантирует, что контент обновится только после exit-анимации.
  const displayedDate = new Date(displayedKey);
  const { schedule, loading } = useDaySchedule(displayedDate);

  // Определяем CSS класс анимации
  const dayAnimClass = dayEntering
    ? animDirection === 'right' ? 'anim-day-enter-right'
    : animDirection === 'left'  ? 'anim-day-enter-left'
    : 'anim-day-enter-fade'
    : animDirection === 'right' ? 'anim-day-exit-left'
    : animDirection === 'left'  ? 'anim-day-exit-right'
    : 'anim-day-exit-fade';

  useSetPageHeader({title: 'Расписание'});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Навигация по неделям */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
        <button
          onClick={goToPrevWeek}
          disabled={!canGoPrev}
          className={`p-2.5 -m-1 rounded-xl ${canGoPrev ? 'text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800' : 'text-gray-200 dark:text-neutral-700 cursor-default'}`}
        >
          <ChevronLeft size={22} />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">{weekRange}</p>
          {weekNumber !== null && weekNumber > 0 && (
            <p className="text-xs text-gray-500 dark:text-neutral-400">{weekNumber}-я неделя</p>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          disabled={!canGoNext}
          className={`p-2.5 -m-1 rounded-xl ${canGoNext ? 'text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800' : 'text-gray-200 dark:text-neutral-700 cursor-default'}`}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Табы дней */}
      <div ref={dayTabsRef} className="shrink-0 relative flex bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-1">
        {/* Скользящая пилюля */}
        {selectedDayIndex >= 0 && pillStyle.ready && (
          <div
            className="absolute anim-day-pill pointer-events-none"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
              bottom: 12,
              height: 32,
            }}
          >
            <div className="w-8 h-8 mx-auto bg-blue-600 dark:bg-blue-500 rounded-full" />
          </div>
        )}

        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
          const date = addDays(monday, offset);
          const dayNum = offset + 1;
          const isSunday = dayNum === 7;
          const isSelected =
            !isSunday &&
            getDayOfWeek(selectedDate) === dayNum &&
            getMonday(selectedDate).getTime() === monday.getTime();
          const isTodayDate = isToday(date);

          return (
            <button
              key={offset}
              onClick={() => !isSunday && goToDay(offset)}
              disabled={isSunday}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isSunday
                  ? 'text-gray-300 dark:text-neutral-600 cursor-default'
                  : isSelected
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-neutral-400 active:text-gray-700'
              }`}
            >
              <span className="text-xs font-medium">
                {DAY_NAMES_SHORT[dayNum]}
              </span>
              <span
                className={`relative z-10 text-sm w-8 h-8 flex items-center justify-center rounded-full font-medium ${
                  isSelected
                    ? 'text-white'
                    : isTodayDate && !isSunday
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : ''
                }`}
              >
                <span className="relative z-10">{date.getDate()}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Содержимое дня */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500 dark:text-neutral-400">Загрузка...</p>
          </div>
        ) : (
          <div key={displayedKey} className={dayAnimClass}>
            <DaySchedule
              slots={schedule.slots}
              floatingEvents={schedule.floatingEvents}
              date={displayedDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}