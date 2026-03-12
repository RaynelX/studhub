import { useState, useMemo, useCallback } from 'react';
import { CalendarOff } from 'lucide-react';
import { WeekNavigator } from './WeekNavigator';
import { DayTabs } from './DayTabs';
import { AdminPairSection } from './AdminPairSection';
import { AdminSummaryTable } from './AdminSummaryTable';
import { useAdminAttendance } from '../hooks/use-admin-attendance';
import type { AbsenceType } from '../hooks/use-admin-attendance';
import { useWeekSchedule } from '../hooks/use-week-schedule';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import {
  getMonday,
  addDays,
  toISODate,
  getDayOfWeek,
  getWeekNumber,
} from '../../schedule/utils/week-utils';

// ============================================================
// Компонент
// ============================================================

export function AdminAttendanceView() {
  const today = useMemo(() => new Date(), []);
  const todayMonday = useMemo(() => getMonday(today), [today]);
  const todayStr = useMemo(() => toISODate(today), [today]);

  const [monday, setMonday] = useState(todayMonday);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Границы навигации
  const db = useDatabase();
  const { data: semesterData } = useRxCollection(db.semester);
  const { data: students } = useRxCollection(db.students);
  const semesterConfig = semesterData[0] ?? null;

  const weekNumber = semesterConfig
    ? getWeekNumber(monday, semesterConfig.start_date)
    : null;

  const canGoPrev = semesterConfig
    ? toISODate(monday) > semesterConfig.start_date
    : toISODate(monday) > toISODate(addDays(todayMonday, -28));

  const canGoNext = toISODate(monday) < toISODate(todayMonday);

  const goToPrevWeek = () => {
    if (!canGoPrev) return;
    const newMonday = addDays(monday, -7);
    setMonday(newMonday);
    const dayOffset = getDayOfWeek(new Date(selectedDate)) - 1;
    setSelectedDate(toISODate(addDays(newMonday, dayOffset)));
  };

  const goToNextWeek = () => {
    if (!canGoNext) return;
    const newMonday = addDays(monday, 7);
    setMonday(newMonday);
    const dayOffset = getDayOfWeek(new Date(selectedDate)) - 1;
    let newDate = toISODate(addDays(newMonday, dayOffset));
    if (newDate > todayStr) newDate = todayStr;
    setSelectedDate(newDate);
  };

  // Данные расписания
  const { weekSchedule, loading } = useWeekSchedule(monday);

  // Данные посещаемости
  const { getAbsence, setAbsence, clearAbsence, studentSummaries } =
    useAdminAttendance();

  // Сортированный список студентов (без удалённых)
  const sortedStudents = useMemo(() => {
    return students
      .filter((s) => !s.is_deleted)
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ru'));
  }, [students]);

  // Пары для выбранного дня
  const dayPairs = useMemo(() => {
    const slots = weekSchedule.get(selectedDate) ?? [];
    return slots.filter(
      (s) => s.pair !== null && s.pair.status !== 'cancelled',
    );
  }, [weekSchedule, selectedDate]);

  // Тогл: none → unexcused → excused → none
  const handleToggleAbsence = useCallback(
    (date: string, pairNumber: number, studentId: string) => {
      const current = getAbsence(date, pairNumber, studentId);
      if (!current) {
        setAbsence(date, pairNumber, studentId, 'unexcused' as AbsenceType);
      } else if (current === 'unexcused') {
        setAbsence(date, pairNumber, studentId, 'excused' as AbsenceType);
      } else {
        clearAbsence(date, pairNumber, studentId);
      }
    },
    [getAbsence, setAbsence, clearAbsence],
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
        onSelectDate={setSelectedDate}
      />

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4">
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
                date={selectedDate}
                getAbsence={getAbsence}
                onToggleAbsence={handleToggleAbsence}
              />
            ))}
          </div>
        )}

        <AdminSummaryTable
          students={sortedStudents}
          studentSummaries={studentSummaries}
        />
      </div>
    </div>
  );
}
