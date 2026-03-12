import { Clock } from 'lucide-react';
import { AttendanceStatusInput } from './AttendanceStatusInput';
import { formatBellTime, getBellSlot } from '../../../shared/constants/bell-schedule';
import type { ResolvedPair } from '../../schedule/utils/schedule-builder';
import type { AttendanceStatus } from '../hooks/use-attendance';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';

// ============================================================
// Типы
// ============================================================

interface AttendancePairCardProps {
  pairNumber: number;
  pair: ResolvedPair;
  status: AttendanceStatus | undefined;
  onSetStatus: (status: AttendanceStatus) => void;
  onClearStatus: () => void;
}

// ============================================================
// Конфигурация
// ============================================================

function getStatusBg(status: AttendanceStatus | undefined): string {
  if (!status) return '';
  if (status === 'present') return 'bg-green-50/50 dark:bg-green-950/20';
  if (status === 'excused') return 'bg-amber-50/50 dark:bg-amber-950/20';
  return 'bg-red-50/50 dark:bg-red-950/20';
}

// ============================================================
// Компонент
// ============================================================

export function AttendancePairCard({
  pairNumber,
  pair,
  status,
  onSetStatus,
  onClearStatus,
}: AttendancePairCardProps) {
  const rippleRef = useTouchRipple();
  const bellSlot = getBellSlot(pairNumber);
  const timeLabel = bellSlot ? formatBellTime(bellSlot) : `${pairNumber} пара`;
  const statusBg = getStatusBg(status);

  return (
    <div
      ref={rippleRef}
      className={`relative bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden ${statusBg}`}
    >
      <div className="p-4 space-y-2.5">
        {/* Шапка: номер пары + время + тип */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300">
            {pairNumber}
          </span>
          <span className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Clock size={12} />
            {timeLabel}
          </span>
        </div>

        {/* Предмет */}
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
          {pair.subjectName}
        </h3>

        {/* Статус посещаемости */}
        <div className="pt-1">
          <AttendanceStatusInput
            value={status}
            onChange={onSetStatus}
            onClear={onClearStatus}
          />
        </div>
      </div>
    </div>
  );
}
