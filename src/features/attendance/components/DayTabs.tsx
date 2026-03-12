import { addDays, toISODate, isToday } from '../../schedule/utils/week-utils';
import { DAY_NAMES_SHORT } from '../../../shared/constants/days';

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

  const days = Array.from({ length: 6 }, (_, i) => {
    const date = addDays(monday, i);
    const dateStr = toISODate(date);
    const dayOfWeek = i + 1;
    return { date, dateStr, dayOfWeek, isToday: isToday(date), isFuture: dateStr > todayStr };
  });

  return (
    <div className="shrink-0 relative flex bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-1">
      {days.map(({ dateStr, dayOfWeek, date, isToday: today, isFuture }) => {
        const isSelected = dateStr === selectedDate;
        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => !isFuture && onSelectDate(dateStr)}
            disabled={isFuture}
            className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isFuture
                ? 'text-gray-300 dark:text-neutral-600 cursor-default'
                : isSelected
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-neutral-400 active:text-gray-700'
            }`}
          >
            <span className="text-xs font-medium">
              {DAY_NAMES_SHORT[dayOfWeek]}
            </span>
            <span
              className={`text-sm w-8 h-8 flex items-center justify-center rounded-full font-medium ${
                isSelected
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : today && !isFuture
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    : ''
              }`}
            >
              {date.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
