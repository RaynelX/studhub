import { useRef, useCallback, useEffect } from 'react';

export type SwipeDirection = 'left' | 'right';
/** Reason passed to `onBlocked`. Currently only `'boundary'` is emitted. */
export type SwipeBlockedReason = 'boundary';

interface TouchPoint {
  x: number;
  t: number;
}

export interface HorizontalSwipeOptions {
  /** Called when a swipe is committed. `left` = forward, `right` = back */
  onSwipe: (direction: SwipeDirection) => void;
  /**
   * Called when a gesture is committed but the `blocked` flag is set, meaning
   * the swipe was recognized but intentionally suppressed (e.g. boundary reached).
   * Only called with reason `'boundary'`.
   */
  onBlocked?: (direction: SwipeDirection, reason: SwipeBlockedReason) => void;
  /** Set true to completely inhibit gesture tracking (e.g. sheet open, loading) */
  disabled?: boolean;
  /**
   * Minimum distance (px) the finger must travel horizontally before the
   * gesture is considered a swipe. Default: 40
   */
  distanceThreshold?: number;
  /**
   * Minimum velocity (px/s) required to commit a swipe even if distance
   * is below threshold. Default: 250
   */
  velocityThreshold?: number;
  /**
   * The horizontal movement must exceed the vertical movement by at least
   * this ratio before the gesture is locked to horizontal axis. Default: 1.5
   */
  axisLockRatio?: number;
  /**
   * After a successful swipe, ignore new gestures for this many ms.
   * Prevents accidental double-swipes. Default: 160
   */
  cooldownMs?: number;
  /**
   * When `true`, the swipe fires but the state machine calls `onBlocked`
   * instead of `onSwipe`. Use to implement boundary feedback without
   * preventing the caller from receiving the direction.
   * Default: false
   */
  blocked?: boolean;
}

/**
 * Detects horizontal swipe gestures on a touch surface.
 *
 * - Axis lock: horizontal intent must exceed vertical by `axisLockRatio`
 * - Vertical scroll priority: if the container was already scrolling
 *   vertically (scrollTop > 0) the gesture is ignored
 * - No DOM mutations or React re-renders during tracking
 * - Reuses the velocity history pattern from useBottomSheetGesture
 *
 * Returns `{ onTouchStart, onTouchMove, onTouchEnd }` to spread on a
 * React element.
 */
export function useHorizontalSwipe({
  onSwipe,
  onBlocked,
  disabled = false,
  distanceThreshold = 40,
  velocityThreshold = 250,
  axisLockRatio = 1.5,
  cooldownMs = 160,
  blocked = false,
}: HorizontalSwipeOptions) {
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const historyRef = useRef<TouchPoint[]>([]);
  const axisLockedRef = useRef<'horizontal' | 'vertical' | null>(null);
  const isDraggingRef = useRef(false);
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetGestureState = useCallback(() => {
    isDraggingRef.current = false;
    axisLockedRef.current = null;
    historyRef.current = [];
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || cooldownRef.current) return;

      const touch = e.touches[0];

      // Check vertical scroll context — give priority to the container's own scroll
      const target = e.target as HTMLElement;
      const scrollable =
        target.closest('[data-swipe-scroll]') ??
        // Also handle the case where the touch started on the scrollable root
        (target.hasAttribute('data-swipe-scroll') ? target : null);
      if (scrollable && (scrollable as HTMLElement).scrollTop > 0) return;

      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      isDraggingRef.current = true;
      axisLockedRef.current = null;
      historyRef.current = [{ x: touch.clientX, t: Date.now() }];
    },
    [disabled],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (disabled) {
        resetGestureState();
        return;
      }

      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      // Track history for velocity (keep last 5 points)
      const now = Date.now();
      historyRef.current.push({ x: touch.clientX, t: now });
      if (historyRef.current.length > 5) {
        historyRef.current = historyRef.current.slice(-5);
      }

      // Axis decision (once locked, stays locked for the lifetime of this touch)
      if (axisLockedRef.current === null) {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const moved = Math.sqrt(absDx * absDx + absDy * absDy);
        if (moved < 8) return; // wait until intent is clear
        if (absDx >= absDy * axisLockRatio) {
          axisLockedRef.current = 'horizontal';
        } else {
          axisLockedRef.current = 'vertical';
        }
      }

      // Prevent browser scroll only when we are handling horizontal movement
      if (axisLockedRef.current === 'horizontal') {
        e.preventDefault();
      }
    },
    [disabled, axisLockRatio, resetGestureState],
  );

  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (disabled) {
      resetGestureState();
      return;
    }

    const locked = axisLockedRef.current;
    axisLockedRef.current = null;

    if (locked !== 'horizontal') return;
    if (historyRef.current.length < 2) return;

    const history = historyRef.current;
    const first = history[0];
    const last = history[history.length - 1];
    const totalDx = last.x - startXRef.current;
    const dt = (last.t - first.t) / 1000;
    const velocity = dt > 0 ? Math.abs((last.x - first.x) / dt) : 0;

    const meetsDistance = Math.abs(totalDx) >= distanceThreshold;
    const meetsVelocity = velocity >= velocityThreshold;

    if (!meetsDistance && !meetsVelocity) return;

    const direction: SwipeDirection = totalDx < 0 ? 'left' : 'right';

    // Enter cooldown
    cooldownRef.current = true;
    if (cooldownTimerRef.current !== null) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false;
    }, cooldownMs);

    if (blocked) {
      onBlocked?.(direction, 'boundary');
      return;
    }

    onSwipe(direction);
  }, [
    disabled,
    resetGestureState,
    distanceThreshold,
    velocityThreshold,
    cooldownMs,
    blocked,
    onSwipe,
    onBlocked,
  ]);

  // Reset in-progress gesture state when `disabled` turns on mid-gesture
  useEffect(() => {
    if (disabled) {
      resetGestureState();
    }
  }, [disabled, resetGestureState]);

  // Clear pending cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current !== null) {
        clearTimeout(cooldownTimerRef.current);
        cooldownRef.current = false;
      }
    };
  }, []);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
