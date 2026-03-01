import { useEffect, useRef } from 'react';
import { useExitTransition } from '../../../shared/hooks/use-exit-transition';

interface UndoToastProps {
  message: string;
  open: boolean;
  onUndo: () => void;
  onDismiss: () => void;
  /** Auto-hide duration in ms (default: 5000) */
  duration?: number;
}

/**
 * A snackbar-style toast that slides up from the bottom with an «Отменить» button.
 *
 * Positioned above the bottom navigation bar.
 * Auto-dismisses after `duration` ms unless the user taps «Отменить».
 */
export function UndoToast({
  message,
  open,
  onUndo,
  onDismiss,
  duration = 5000,
}: UndoToastProps) {
  const { mounted, entering } = useExitTransition(open, 250);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss timer
  useEffect(() => {
    if (!open) return;

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, duration, onDismiss]);

  if (!mounted) return null;

  function handleUndo() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onUndo();
  }

  return (
    <div
      className={`fixed left-4 right-4 z-50 ${entering ? 'anim-toast-enter' : 'anim-toast-exit'}`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-neutral-800 dark:bg-neutral-700 shadow-lg">
        <span className="text-sm text-white flex-1 min-w-0 truncate">
          {message}
        </span>
        <button
          onClick={handleUndo}
          className="text-sm font-semibold text-blue-400 shrink-0 active:opacity-70 transition-opacity"
        >
          Отменить
        </button>
      </div>
    </div>
  );
}
