import { useRef } from 'react';
import {
  addDays,
  toISODate,
  isToday,
  getDayOfWeek,
  getMonday,
  parseLocalDate,
} from '../../schedule/utils/week-utils';
import { DAY_NAMES_SHORT } from '../../../shared/constants/days';
import { useFlipPill } from '../../../shared/hooks/use-flip-pill';

// ============================================================
// Типы
// ============================================================

interface DayTabsProps {
  monday: Date;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}

// ============================================================
// Компонент
// ============================================================

export function DayTabs({ monday, selectedDate, onSelectDate }: DayTabsProps) {
  const todayStr = toISODate(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Определяем индекс выбранного дня для pill (0-6, -1 если не в этой неделе)
  const selectedDayIndex = (() => {
    const sel = parseLocalDate(selectedDate);
    const day = getDayOfWeek(sel);
    const isSunday = day === 7;
    const isCurrentWeek = getMonday(sel).getTime() === monday.getTime();
    if (!isCurrentWeek || isSunday) return -1;
    return day - 1;
  })();

  const pillStyle = useFlipPill(containerRef, selectedDayIndex);

  return (
    <div
      ref={containerRef}
      className="shrink-0 relative flex bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-1"
    >
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
        const dateStr = toISODate(date);
        const dayNum = offset + 1;
        const isSunday = dayNum === 7;
        const isFuture = dateStr > todayStr;
        const isDisabled = isSunday || isFuture;
        const isSelected =
          !isDisabled &&
          getDayOfWeek(parseLocalDate(selectedDate)) === dayNum &&
          getMonday(parseLocalDate(selectedDate)).getTime() === monday.getTime();
        const isTodayDate = isToday(date);

        return (
          <button
            key={offset}
            type="button"
            onClick={() => !isDisabled && onSelectDate(dateStr)}
            disabled={isDisabled}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isDisabled
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
                  : isTodayDate && !isDisabled
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
  );
}
