import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useHorizontalSwipe } from '../../shared/hooks/use-horizontal-swipe';
import type { SwipeDirection } from '../../shared/hooks/use-horizontal-swipe';
import { useDaySchedule } from '../../features/schedule/hooks/use-day-schedule';
import { useDayDeadlines } from '../../features/schedule/hooks/use-day-deadlines';
import { DaySchedule } from '../../features/schedule/components/DaySchedule';
import { HomeworkViewSheet } from '../../features/schedule/components/HomeworkViewSheet';
import type { ResolvedPair } from '../../features/schedule/utils/schedule-builder';
import {
  getMonday,
  addDays,
  getDayOfWeek,
  isToday,
  formatWeekRange,
  getWeekNumber,
  toISODate,
} from '../../features/schedule/utils/week-utils';
import { useDatabase } from '../providers/DatabaseProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';
import type { HomeworkDoc } from '../../database/types';
import { DAY_NAMES_SHORT } from '../../shared/constants/days';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useFlipPill } from '../../shared/hooks/use-flip-pill';
import { useExitTransitionWait } from '../../shared/hooks/use-exit-transition';
import { useAdmin } from '../../features/admin/AdminProvider';
import { AdminActionSheet } from '../../features/admin/components/admin-action-sheet';
import type { AdminAction } from '../../features/admin/components/admin-action-sheet';
import { OverrideSheet } from '../../features/admin/components/override-sheet';
import { EventSheet } from '../../features/admin/components/event-sheet';
import { DeadlineSheet } from '../../features/admin/components/deadline-sheet';
import { HomeworkSheet } from '../../features/admin/components/homework-sheet';
import { UndoToast } from '../../features/admin/components/undo-toast';
import { AdminFab } from '../../features/admin/components/admin-fab';
import { useCancelPair } from '../../features/admin/hooks/use-cancel-pair';

// ============================================================
// Module-level constants (outside component to avoid lint warnings)
// ============================================================

const DOUBLE_TAP_MS = 350;
const HINT_KEY = 'studhub_swipe_hint_seen';

// ============================================================
// Компонент страницы
// ============================================================

export function SchedulePage() {
  const db = useDatabase();
  const { data: semesterData } = useRxCollection(db.semester);
  const semesterConfig = semesterData[0] ?? null;

  // Admin state
  const { isAdmin } = useAdmin();
  const { data: subjects } = useRxCollection(db.subjects);
  const { data: teachers } = useRxCollection(db.teachers);

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

  // Навигация по неделям — при смене недели всегда переходим на понедельник,
  // чтобы пользователь видел изменения (расписание часто одинаковое для одного дня).
  const goToPrevWeek = useCallback(() => { if (canGoPrev) { setAnimDirection('fade'); setSelectedDate(addDays(monday, -7)); } }, [canGoPrev, monday]);
  const goToNextWeek = useCallback(() => { if (canGoNext) { setAnimDirection('fade'); setSelectedDate(addDays(monday, 7)); } }, [canGoNext, monday]);
  const goToDay = useCallback((dayOffset: number) => {
    const newDay = dayOffset + 1;
    const curDay = getDayOfWeek(selectedDate);
    setAnimDirection(newDay >= curDay ? 'right' : 'left');
    setSelectedDate(addDays(monday, dayOffset));
  }, [selectedDate, monday]);

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
  const displayedDate = useMemo(() => new Date(displayedKey), [displayedKey]);
  const { schedule, loading } = useDaySchedule(displayedDate);
  const { deadlines } = useDayDeadlines(displayedDate);

  // Homeworks for the displayed date
  const { data: allHomeworks } = useRxCollection(db.homeworks);
  const displayedDateStr = toISODate(displayedDate);
  const homeworkMap = useMemo(() => {
    const map = new Map<number, HomeworkDoc>();
    for (const hw of allHomeworks) {
      if (hw.date === displayedDateStr && !hw.is_deleted) {
        map.set(hw.pair_number, hw);
      }
    }
    return map;
  }, [allHomeworks, displayedDateStr]);

  // ============================================================
  // Admin: sheet state
  // ============================================================

  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [overrideSheetOpen, setOverrideSheetOpen] = useState(false);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);
  const [deadlineSheetOpen, setDeadlineSheetOpen] = useState(false);
  const [homeworkSheetOpen, setHomeworkSheetOpen] = useState(false);
  const [overrideMode, setOverrideMode] = useState<'replace' | 'add'>('replace');

  // Context for the action being performed (stored as state so it's safe in render)
  const [sheetContext, setSheetContext] = useState<{
    pairNumber: number;
    pair: ResolvedPair | null;
    date: Date;
  }>({ pairNumber: 1, pair: null, date: new Date() });

  const { cancelPair, undoCancel, toastOpen, dismissToast } = useCancelPair();

  const handlePairLongPress = (pairNumber: number, pair: ResolvedPair | null) => {
    setSheetContext({ pairNumber, pair, date: displayedDate });
    setActionSheetOpen(true);
  };

  const handleAction = (action: AdminAction) => {
    const { pairNumber, pair, date } = sheetContext;

    switch (action) {
      case 'cancel': {
        const targets = pair?.sourceTargets ?? {
          target_language: 'all' as const,
          target_eng_subgroup: 'all' as const,
          target_oit_subgroup: 'all' as const,
        };
        cancelPair(toISODate(date), pairNumber, targets);
        break;
      }
      case 'replace':
        setOverrideMode('replace');
        setOverrideSheetOpen(true);
        break;
      case 'add':
        setOverrideMode('add');
        setOverrideSheetOpen(true);
        break;
      case 'event':
        setEventSheetOpen(true);
        break;
      case 'homework':
        setHomeworkSheetOpen(true);
        break;
    }
  };

  const handleFabAction = (action: 'add' | 'event' | 'deadline') => {
    // FAB uses the currently displayed date, pair number starts at the first empty slot
    const firstEmptySlot = schedule.slots.find((s) => s.pair === null);
    const pairNumber = firstEmptySlot?.pairNumber ?? 1;
    setSheetContext({ pairNumber, pair: null, date: displayedDate });

    if (action === 'add') {
      setOverrideMode('add');
      setOverrideSheetOpen(true);
    } else if (action === 'event') {
      setEventSheetOpen(true);
    } else {
      setDeadlineSheetOpen(true);
    }
  };

  // Homework view sheet (for students)
  const [homeworkViewOpen, setHomeworkViewOpen] = useState(false);
  const [viewedHomework, setViewedHomework] = useState<{ content: string; subjectName: string; dateLabel: string } | null>(null);

  const handleHomeworkTap = (homework: HomeworkDoc, pair: ResolvedPair) => {
    const dayNames: Record<number, string> = { 0: 'вс', 1: 'пн', 2: 'вт', 3: 'ср', 4: 'чт', 5: 'пт', 6: 'сб' };
    const d = displayedDate;
    const dayName = dayNames[d.getDay()] ?? '';
    const dateLabel = `${dayName}, ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
    setViewedHomework({ content: homework.content, subjectName: pair.subjectName, dateLabel });
    setHomeworkViewOpen(true);
  };

  // ============================================================
  // Gesture state & logic
  // ============================================================

  // Any admin sheet or the homework view being open should disable swipes
  const anySheetOpen =
    actionSheetOpen ||
    overrideSheetOpen ||
    eventSheetOpen ||
    deadlineSheetOpen ||
    homeworkSheetOpen ||
    homeworkViewOpen;

  // Refs for DOM bounce animation on the day-content and week-header containers
  const dayContentRef = useRef<HTMLDivElement>(null);
  const weekHeaderRef = useRef<HTMLDivElement>(null);

  const triggerBounce = useCallback(
    (container: HTMLDivElement | null, direction: SwipeDirection) => {
      if (!container) return;
      const cls =
        direction === 'left'
          ? 'anim-swipe-bounce-left'
          : 'anim-swipe-bounce-right';
      container.classList.remove('anim-swipe-bounce-left', 'anim-swipe-bounce-right');
      // Force reflow so the animation restarts even if same class
      void container.offsetWidth;
      container.classList.add(cls);
      container.addEventListener(
        'animationend',
        () => container.classList.remove(cls),
        { once: true },
      );
    },
    [],
  );

  // ---------- Day-area swipe callbacks ----------
  const handleDaySwipe = useCallback(
    (dir: SwipeDirection) => {
      const curOffset = getDayOfWeek(selectedDate) - 1; // 0-based Mon=0..Sat=5
      if (dir === 'left') {
        const nextOffset = curOffset + 1;
        if (nextOffset > 5) {
          if (canGoNext) {
            setAnimDirection('right');
            setSelectedDate(addDays(addDays(monday, 7), 0));
          } else {
            triggerBounce(dayContentRef.current, 'left');
          }
        } else {
          goToDay(nextOffset);
        }
      } else {
        const prevOffset = curOffset - 1;
        if (prevOffset < 0) {
          if (canGoPrev) {
            setAnimDirection('left');
            setSelectedDate(addDays(addDays(monday, -7), 5));
          } else {
            triggerBounce(dayContentRef.current, 'right');
          }
        } else {
          goToDay(prevOffset);
        }
      }
    },
    [selectedDate, monday, canGoNext, canGoPrev, goToDay, triggerBounce],
  );

  const handleDaySwipeBlocked = useCallback(
    (dir: SwipeDirection) => triggerBounce(dayContentRef.current, dir),
    [triggerBounce],
  );

  const daySwipeHandlers = useHorizontalSwipe({
    disabled: anySheetOpen || loading,
    onSwipe: handleDaySwipe,
    onBlocked: handleDaySwipeBlocked,
  });

  // ---------- Week-header swipe callbacks ----------
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
    disabled: anySheetOpen,
    onSwipe: handleWeekSwipe,
    onBlocked: handleWeekSwipeBlocked,
  });

  // ---------- Double-tap on week header → jump to today ----------
  const lastTapRef = useRef(0);

  const handleWeekHeaderTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      const today = new Date();
      const todayDow = getDayOfWeek(today);
      // If today is within semester or we have no config, jump there
      const targetDate = todayDow === 7 ? addDays(today, 1) : today;
      const targetMonday = getMonday(targetDate);
      const inBounds =
        (!semesterStartMonday || targetMonday >= semesterStartMonday) &&
        (!semesterEndMonday || targetMonday <= semesterEndMonday);
      if (inBounds) {
        setAnimDirection('fade');
        setSelectedDate(targetDate);
      }
    } else {
      lastTapRef.current = now;
    }
  }, [semesterStartMonday, semesterEndMonday]);

  // ---------- One-time swipe hint ----------
  const [hintVisible, setHintVisible] = useState(() => {
    try {
      return !localStorage.getItem(HINT_KEY);
    } catch {
      return false;
    }
  });
  const [hintDismissing, setHintDismissing] = useState(false);

  const dismissHint = useCallback(() => {
    setHintDismissing(true);
    setTimeout(() => {
      setHintVisible(false);
    }, 200);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  // Auto-dismiss hint after 4 seconds
  useEffect(() => {
    if (!hintVisible) return;
    const t = setTimeout(dismissHint, 4000);
    return () => clearTimeout(t);
  }, [hintVisible, dismissHint]);

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
      {/* Навигация по неделям — свайп влево/вправо меняет неделю, двойной тап → сегодня */}
      <div
        ref={weekHeaderRef}
        {...weekSwipeHandlers}
        onClick={handleWeekHeaderTap}
        className="shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800"
      >
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

      {/* Содержимое дня — свайп влево/вправо меняет день */}
      <div
        ref={dayContentRef}
        data-swipe-scroll
        {...daySwipeHandlers}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4"
      >
        {/* Одноразовая подсказка о свайпах */}
        {hintVisible && (
          <div
            className={`flex items-center justify-center gap-2 mb-3 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs select-none cursor-pointer ${hintDismissing ? 'anim-hint-dismiss' : 'anim-hint-appear'}`}
            onClick={dismissHint}
          >
            <span>← Свайп для смены дня&nbsp;&nbsp;·&nbsp;&nbsp;Свайп по шапке для смены недели →</span>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500 dark:text-neutral-400">Загрузка...</p>
          </div>
        ) : (
          <div key={displayedKey} className={dayAnimClass}>
            <DaySchedule
              slots={schedule.slots}
              floatingEvents={schedule.floatingEvents}
              deadlines={deadlines}
              date={displayedDate}
              isAdmin={isAdmin}
              onPairLongPress={isAdmin ? handlePairLongPress : undefined}
              homeworkMap={homeworkMap}
              onHomeworkTap={handleHomeworkTap}
            />
          </div>
        )}
      </div>

      {/* Admin UI */}
      {isAdmin && (
        <>
          <AdminActionSheet
            open={actionSheetOpen}
            onClose={() => setActionSheetOpen(false)}
            pair={sheetContext.pair}
            date={sheetContext.date}
            pairNumber={sheetContext.pairNumber}
            onAction={handleAction}
            hasHomework={!!sheetContext.pair?.subjectId && homeworkMap.has(sheetContext.pairNumber)}
          />

          <OverrideSheet
            key={`override-${toISODate(sheetContext.date)}-${sheetContext.pairNumber}-${overrideMode}`}
            open={overrideSheetOpen}
            onClose={() => setOverrideSheetOpen(false)}
            mode={overrideMode}
            date={sheetContext.date}
            pairNumber={sheetContext.pairNumber}
            subjects={subjects}
            teachers={teachers}
            sourceTargets={sheetContext.pair?.sourceTargets}
            defaults={
              overrideMode === 'replace' && sheetContext.pair
                ? {
                    subjectId: undefined,
                    entryType: sheetContext.pair.entryType,
                    teacherId: undefined,
                    room: sheetContext.pair.room,
                  }
                : undefined
            }
          />

          <EventSheet
            key={`event-${toISODate(sheetContext.date)}-${sheetContext.pairNumber}`}
            open={eventSheetOpen}
            onClose={() => setEventSheetOpen(false)}
            date={sheetContext.date}
            pairNumber={sheetContext.pairNumber}
            subjects={subjects}
            teachers={teachers}
            pair={sheetContext.pair}
          />

          <DeadlineSheet
            key={`deadline-${toISODate(sheetContext.date)}`}
            open={deadlineSheetOpen}
            onClose={() => setDeadlineSheetOpen(false)}
            date={sheetContext.date}
            subjects={subjects}
          />

          {sheetContext.pair?.subjectId && (
            <HomeworkSheet
              key={`hw-${toISODate(sheetContext.date)}-${sheetContext.pairNumber}`}
              open={homeworkSheetOpen}
              onClose={() => setHomeworkSheetOpen(false)}
              date={sheetContext.date}
              pairNumber={sheetContext.pairNumber}
              subjectId={sheetContext.pair.subjectId}
              subjectName={sheetContext.pair.subjectName}
              existing={homeworkMap.get(sheetContext.pairNumber)}
            />
          )}

          <UndoToast
            message="Пара отменена"
            open={toastOpen}
            onUndo={undoCancel}
            onDismiss={dismissToast}
          />

          <AdminFab onAction={handleFabAction} />
        </>
      )}

      {/* Homework view (for all users) */}
      {viewedHomework && (
        <HomeworkViewSheet
          open={homeworkViewOpen}
          onClose={() => setHomeworkViewOpen(false)}
          subjectName={viewedHomework.subjectName}
          dateLabel={viewedHomework.dateLabel}
          content={viewedHomework.content}
        />
      )}
    </div>
  );
}