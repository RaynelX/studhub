import { useRef, useCallback, useMemo } from 'react';

interface LongPressOptions {
  /** Delay in ms before triggering (default: 500) */
  delay?: number;
  /** If true, all handlers are no-op */
  disabled?: boolean;
  /** Movement threshold in px to cancel (default: 10) */
  moveThreshold?: number;
}

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const NOOP_HANDLERS: LongPressHandlers = {
  onTouchStart: () => {},
  onTouchEnd: () => {},
  onTouchMove: () => {},
  onContextMenu: () => {},
};

/**
 * Detects a long press (touch-and-hold) gesture.
 *
 * Returns touch event handlers to spread onto a target element.
 * Cancels if the finger moves beyond `moveThreshold` pixels.
 * Triggers haptic feedback via `navigator.vibrate` when supported.
 *
 * When `disabled` is `true` all returned handlers are no-ops,
 * so the host element behaves normally for regular users.
 */
export function useLongPress(
  callback: () => void,
  options: LongPressOptions = {},
): LongPressHandlers {
  const { delay = 500, disabled = false, moveThreshold = 10 } = options;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
    firedRef.current = false;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      firedRef.current = false;

      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        callback();
      }, delay);
    },
    [callback, delay],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startPosRef.current.x;
      const dy = touch.clientY - startPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
        clear();
      }
    },
    [clear, moveThreshold],
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    // Prevent native context menu when long-pressing on mobile
    e.preventDefault();
  }, []);

  return useMemo(() => {
    if (disabled) return NOOP_HANDLERS;
    return { onTouchStart, onTouchEnd, onTouchMove, onContextMenu };
  }, [disabled, onTouchStart, onTouchEnd, onTouchMove, onContextMenu]);
}
