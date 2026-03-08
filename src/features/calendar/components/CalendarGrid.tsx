import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayCell } from './DayCell';
import { DayDetailSheet } from './DayDetailSheet';
import type { CalendarDayData } from '../hooks/use-calendar-data';

const WEEKDAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

interface CellData {
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
}

function buildGridCells(year: number, month: number): CellData[] {
  const firstOfMonth = new Date(year, month, 1);
  // Monday-based offset: Mon=0, Tue=1, ..., Sun=6
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CellData[] = [];

  // Previous month trailing days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({
      day,
      dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
  }

  // Next month leading days (fill to complete last row)
  const remainder = cells.length % 7;
  if (remainder > 0) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const fill = 7 - remainder;
    for (let d = 1; d <= fill; d++) {
      cells.push({
        day: d,
        dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }
  }

  return cells;
}

const EMPTY_DAY: CalendarDayData = { events: [], deadlines: [] };

interface Props {
  year: number;
  month: number;
  days: Map<string, CalendarDayData>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  isCurrentMonth: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function CalendarGrid({ year, month, days, onPrevMonth, onNextMonth, onGoToToday, isCurrentMonth, canGoPrev, canGoNext }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const cells = buildGridCells(year, month);

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedData = selectedDate ? (days.get(selectedDate) ?? EMPTY_DAY) : EMPTY_DAY;

  return (
    <>
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
        <button
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          className={`p-2.5 -m-1 rounded-xl ${canGoPrev ? 'text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800' : 'text-gray-200 dark:text-neutral-700 cursor-default'}`}
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-gray-900 dark:text-neutral-100">
            {MONTH_NAMES[month]} {year}
          </span>
          {!isCurrentMonth && (
            <button
              onClick={onGoToToday}
              className="text-xs text-blue-600 dark:text-blue-400 font-medium active:opacity-70 transition-opacity"
            >
              Сегодня
            </button>
          )}
        </div>

        <button
          onClick={onNextMonth}
          disabled={!canGoNext}
          className={`p-2.5 -m-1 rounded-xl ${canGoNext ? 'text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800' : 'text-gray-200 dark:text-neutral-700 cursor-default'}`}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-1">
        {WEEKDAY_HEADERS.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-neutral-400 dark:text-neutral-500 py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-neutral-800 p-px">
        {cells.map((cell) => {
          const data = days.get(cell.dateStr) ?? EMPTY_DAY;
          return (
            <div key={cell.dateStr} className="bg-white dark:bg-neutral-900 overflow-hidden">
              <DayCell
                day={cell.day}
                isCurrentMonth={cell.isCurrentMonth}
                isToday={cell.dateStr === todayStr}
                isSelected={cell.dateStr === selectedDate}
                events={data.events}
                deadlines={data.deadlines}
                onTap={() => setSelectedDate(cell.dateStr)}
              />
            </div>
          );
        })}
      </div>

      {/* Detail sheet */}
      <DayDetailSheet
        open={selectedDate !== null}
        onClose={() => setSelectedDate(null)}
        dateStr={selectedDate ?? todayStr}
        events={selectedData.events}
        deadlines={selectedData.deadlines}
      />
    </>
  );
}
