import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BELL_SCHEDULE } from '../../../../shared/constants/bell-schedule';
import { DAY_NAMES_SHORT } from '../../../../shared/constants/days';
import { addDays, formatWeekRange, getMonday, toISODate } from '../../../schedule/utils/week-utils';
import { useWeekGrid } from '../../hooks/use-week-grid';
import type { GridCell } from '../../hooks/use-week-grid';
import { WeekGridCell } from './week-grid-cell';
import { SlotPopover } from './slot-popover';

interface WeekGridProps {
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  onDeleteOverride?: (overrideId: string) => void;
  onDeleteEvent?: (eventId: string) => void;
  onQuickCancel?: (date: string, pairNumber: number) => void;
  onQuickReplace?: (date: string, pairNumber: number) => void;
  onQuickAdd?: (date: string, pairNumber: number) => void;
}

export function WeekGrid({
  onEditEntry,
  onDeleteEntry,
  onDeleteOverride,
  onDeleteEvent,
  onQuickCancel,
  onQuickReplace,
  onQuickAdd,
}: WeekGridProps) {
  const [mondayDate, setMondayDate] = useState(() => getMonday(new Date()));
  const gridData = useWeekGrid(mondayDate);
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);

  const subjectIds = useMemo(
    () => gridData.subjects.map((s) => s.id),
    [gridData.subjects],
  );

  function handlePrevWeek() {
    setMondayDate((m) => addDays(m, -7));
    setSelectedCell(null);
  }

  function handleNextWeek() {
    setMondayDate((m) => addDays(m, 7));
    setSelectedCell(null);
  }

  function handleToday() {
    setMondayDate(getMonday(new Date()));
    setSelectedCell(null);
  }

  function handleCellClick(cell: GridCell) {
    setSelectedCell((prev) =>
      prev?.dayOfWeek === cell.dayOfWeek && prev?.pairNumber === cell.pairNumber
        ? null
        : cell,
    );
  }

  if (gridData.loading) {
    return (
      <div className="flex items-center justify-center p-12 text-neutral-400 dark:text-neutral-500 text-sm">
        Загрузка расписания…
      </div>
    );
  }

  const todayISO = toISODate(new Date());

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Сегодня
          </button>
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <span className="font-medium">{formatWeekRange(mondayDate)}</span>
          {gridData.weekNumber !== null && (
            <span className="ml-2 text-neutral-400">
              · {gridData.weekNumber} неделя
              {gridData.weekParity && (
                <span className="ml-1">
                  ({gridData.weekParity === 'odd' ? 'нечёт' : 'чёт'})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
        {/* Header: day names + dates */}
        <div className="grid grid-cols-[60px_repeat(6,1fr)] border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="p-2 text-xs text-neutral-400 font-medium" />
          {Array.from({ length: 6 }, (_, i) => {
            const day = i + 1;
            const dateStr = toISODate(addDays(mondayDate, i));
            const isToday = dateStr === todayISO;
            return (
              <div
                key={day}
                className={`p-2 text-center text-xs font-medium border-l border-neutral-200 dark:border-neutral-700 ${
                  isToday ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <div>{DAY_NAMES_SHORT[day]}</div>
                <div className="text-[10px] text-neutral-400">
                  {new Date(dateStr + 'T00:00:00').getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rows: pair slots */}
        {BELL_SCHEDULE.map((bell, pairIdx) => (
          <div
            key={bell.pairNumber}
            className={`grid grid-cols-[60px_repeat(6,1fr)] ${
              pairIdx < BELL_SCHEDULE.length - 1 ? 'border-b border-neutral-100 dark:border-neutral-800' : ''
            }`}
          >
            {/* Pair label */}
            <div className="p-2 flex flex-col items-center justify-center text-xs text-neutral-400 dark:text-neutral-500">
              <div className="font-medium text-neutral-600 dark:text-neutral-400">{bell.pairNumber}</div>
              <div className="text-[10px]">{bell.startTime}</div>
              <div className="text-[10px]">{bell.endTime}</div>
            </div>

            {/* Day cells */}
            {Array.from({ length: 6 }, (_, dayIdx) => {
              const cell = gridData.cells[dayIdx][pairIdx];
              const isToday = cell.date === todayISO;
              return (
                <div
                  key={dayIdx}
                  className={`p-1 border-l border-neutral-200 dark:border-neutral-700 ${
                    isToday ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''
                  }`}
                >
                  <WeekGridCell
                    cell={cell}
                    subjectIds={subjectIds}
                    onClick={handleCellClick}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Slot popover */}
      {selectedCell && (
        <SlotPopover
          cell={selectedCell}
          subjects={gridData.subjects}
          teachers={gridData.teachers}
          onClose={() => setSelectedCell(null)}
          onEditEntry={onEditEntry}
          onDeleteEntry={onDeleteEntry}
          onDeleteOverride={onDeleteOverride}
          onDeleteEvent={onDeleteEvent}
          onQuickCancel={onQuickCancel}
          onQuickReplace={onQuickReplace}
          onQuickAdd={onQuickAdd}
        />
      )}
    </div>
  );
}
