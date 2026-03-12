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

const ENTRY_TYPE_LABELS: Record<string, string> = {
  lecture: 'Лекция',
  seminar: 'Семинар',
  practice: 'Практика',
  other: 'Другое',
};

const ENTRY_TYPE_BADGE: Record<string, string> = {
  lecture: 'bg-blue-100 text-blue-700 dark:bg-blue-500/30 dark:text-blue-300',
  seminar: 'bg-purple-100 text-purple-700 dark:bg-purple-500/30 dark:text-purple-300',
  practice: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-300',
  other: 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300',
};

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
  const entryType = pair.entryType ?? 'other';
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
          {pair.entryType && (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                ENTRY_TYPE_BADGE[entryType] ?? ENTRY_TYPE_BADGE.other
              }`}
            >
              {ENTRY_TYPE_LABELS[entryType] ?? entryType}
            </span>
          )}
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
