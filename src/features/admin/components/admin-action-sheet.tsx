import { X, RefreshCw, Plus, CalendarPlus } from 'lucide-react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import type { ResolvedPair } from '../../schedule/utils/schedule-builder';

export type AdminAction = 'cancel' | 'replace' | 'add' | 'event';

interface AdminActionSheetProps {
  open: boolean;
  onClose: () => void;
  /** The pair in the tapped slot (null for empty slots) */
  pair: ResolvedPair | null;
  date: Date;
  pairNumber: number;
  onAction: (action: AdminAction) => void;
}

const DAY_NAMES: Record<number, string> = {
  0: 'вс', 1: 'пн', 2: 'вт', 3: 'ср', 4: 'чт', 5: 'пт', 6: 'сб',
};

function formatDateLabel(date: Date): string {
  const day = DAY_NAMES[date.getDay()] ?? '';
  return `${day}, ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`;
}

/**
 * Context-menu BottomSheet shown after a long press on a pair card.
 *
 * If a pair exists: Cancel / Replace / Add event.
 * If the slot is empty: Add pair / Add event.
 */
export function AdminActionSheet({
  open,
  onClose,
  pair,
  date,
  pairNumber,
  onAction,
}: AdminActionSheetProps) {
  function handle(action: AdminAction) {
    onAction(action);
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Действия">
      {/* Context info */}
      <div className="mb-4">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {formatDateLabel(date)} · {pairNumber} пара
        </p>
        {pair && (
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {pair.subjectName}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {pair && pair.status !== 'cancelled' ? (
          <>
            {/* Cancel */}
            <ActionButton
              icon={<X className="w-5 h-5 text-red-500" />}
              label="Отменить пару"
              sublabel="Пара не состоится"
              onClick={() => handle('cancel')}
            />
            {/* Replace */}
            <ActionButton
              icon={<RefreshCw className="w-5 h-5 text-amber-500" />}
              label="Заменить пару"
              sublabel="Другой предмет / преподаватель"
              onClick={() => handle('replace')}
            />
            {/* Event */}
            <ActionButton
              icon={<CalendarPlus className="w-5 h-5 text-blue-500" />}
              label="Добавить событие"
              sublabel="УСР, контрольная, дедлайн…"
              onClick={() => handle('event')}
            />
          </>
        ) : (
          <>
            {/* Add pair */}
            <ActionButton
              icon={<Plus className="w-5 h-5 text-emerald-500" />}
              label="Дополнительная пара"
              sublabel="Добавить занятие в этот слот"
              onClick={() => handle('add')}
            />
            {/* Event */}
            <ActionButton
              icon={<CalendarPlus className="w-5 h-5 text-blue-500" />}
              label="Добавить событие"
              sublabel="УСР, контрольная, дедлайн…"
              onClick={() => handle('event')}
            />
          </>
        )}
      </div>
    </BottomSheet>
  );
}

// ============================================================
// Internal: action row button
// ============================================================

function ActionButton({
  icon,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-left active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors"
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {label}
        </p>
        {sublabel && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
    </button>
  );
}
