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
  const days = Array.from({ length: 6 }, (_, i) => {
    const date = addDays(monday, i);
    const dateStr = toISODate(date);
    const dayOfWeek = i + 1; // 1=Пн, ..., 6=Сб
    return { date, dateStr, dayOfWeek, isToday: isToday(date) };
  });

  return (
    <div className="flex gap-1.5">
      {days.map(({ dateStr, dayOfWeek, date, isToday: today }) => {
        const isSelected = dateStr === selectedDate;
        return (
          <button
            key={dateStr}
            type="button"
            onClick={() => onSelectDate(dateStr)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white dark:bg-blue-500'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-gray-200 dark:border-transparent active:bg-neutral-50 dark:active:bg-neutral-800'
            }`}
          >
            <span>{DAY_NAMES_SHORT[dayOfWeek]}</span>
            <span className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-neutral-400 dark:text-neutral-500'}`}>
              {date.getDate()}
            </span>
            {today && !isSelected && (
              <span className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
