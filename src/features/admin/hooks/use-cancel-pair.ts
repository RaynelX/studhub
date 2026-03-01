import { useState, useCallback } from 'react';
import { useAdminWrite } from './use-admin-write';
import type { SourceTargets } from '../../schedule/utils/schedule-builder';

interface CancelPairResult {
  /** Cancel a pair — creates a 'cancel' override in Supabase */
  cancelPair: (
    date: string,
    pairNumber: number,
    targets: SourceTargets,
  ) => Promise<void>;
  /** Undo the last cancel — soft-deletes the override */
  undoCancel: () => Promise<void>;
  /** Whether the undo toast should be shown */
  toastOpen: boolean;
  /** Dismiss the toast without undoing */
  dismissToast: () => void;
  /** Whether a write operation is in progress */
  loading: boolean;
}

/**
 * Manages the cancel-pair flow:
 *   long press → «Отменить пару» → instant cancel → toast with Undo.
 *
 * On undo the override is soft-deleted and sync is triggered,
 * restoring the pair in the schedule.
 */
export function useCancelPair(): CancelPairResult {
  const { insert, remove, loading } = useAdminWrite();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);

  const cancelPair = useCallback(
    async (date: string, pairNumber: number, targets: SourceTargets) => {
      const id = crypto.randomUUID();

      await insert('schedule_overrides', {
        id,
        date,
        pair_number: pairNumber,
        override_type: 'cancel',
        target_language: targets.target_language,
        target_eng_subgroup: targets.target_eng_subgroup,
        target_oit_subgroup: targets.target_oit_subgroup,
        is_deleted: false,
      });

      setPendingId(id);
      setToastOpen(true);
    },
    [insert],
  );

  const undoCancel = useCallback(async () => {
    if (!pendingId) return;

    await remove('schedule_overrides', pendingId);

    setPendingId(null);
    setToastOpen(false);
  }, [pendingId, remove]);

  const dismissToast = useCallback(() => {
    setToastOpen(false);
    setPendingId(null);
  }, []);

  return { cancelPair, undoCancel, toastOpen, dismissToast, loading };
}
