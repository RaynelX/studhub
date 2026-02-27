import { useEffect, useRef, useCallback, type RefObject } from 'react';

interface BottomSheetGestureOptions {
  /** Ref to the sheet panel element */
  sheetRef: RefObject<HTMLDivElement | null>;
  /** Whether the sheet is currently open */
  open: boolean;
  /** Called when the gesture decides to close the sheet */
  onClose: () => void;
  /** Minimum velocity (px/s) to trigger close. Default: 300 */
  velocityThreshold?: number;
  /** Fraction of sheet height to trigger close. Default: 0.4 */
  offsetThreshold?: number;
}

interface TouchPoint {
  y: number;
  t: number;
}

/**
 * Provides touch-based drag-to-close behaviour for BottomSheet.
 * - Tracks vertical touch movement on the sheet panel
 * - Applies `translateY` directly via DOM (no React re-renders)
 * - Closes if swipe velocity or drag offset exceeds thresholds
 * - Snaps back with CSS transition otherwise
 *
 * Architecture note: velocity tracking logic is isolated so it can
 * be reused for future swipe gestures (day switching, etc).
 */
export function useBottomSheetGesture({
  sheetRef,
  open,
  onClose,
  velocityThreshold = 300,
  offsetThreshold = 0.4,
}: BottomSheetGestureOptions) {
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const historyRef = useRef<TouchPoint[]>([]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      isDraggingRef.current = false;
      historyRef.current = [];
    }
  }, [open]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = sheetRef.current;
    if (!el) return;

    // Don't hijack scrollable content
    const target = e.target as HTMLElement;
    const scrollable = target.closest('[data-sheet-scroll]');
    if (scrollable && scrollable.scrollTop > 0) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    currentYRef.current = 0;
    isDraggingRef.current = true;
    historyRef.current = [{ y: touch.clientY, t: Date.now() }];

    // Disable CSS transition during drag for immediate response
    el.style.transition = 'none';
    el.style.willChange = 'transform';
  }, [sheetRef]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const el = sheetRef.current;
    if (!el) return;

    const touch = e.touches[0];
    let deltaY = touch.clientY - startYRef.current;

    // Prevent upward drag (negative), allow down with elasticity
    if (deltaY < 0) {
      deltaY = 0;
    }

    currentYRef.current = deltaY;

    // Apply transform directly to DOM — no React re-render
    el.style.transform = `translateY(${deltaY}px)`;

    // Track last few points for velocity calculation
    const now = Date.now();
    historyRef.current.push({ y: touch.clientY, t: now });
    // Keep only last 5 points
    if (historyRef.current.length > 5) {
      historyRef.current = historyRef.current.slice(-5);
    }
  }, [sheetRef]);

  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const el = sheetRef.current;
    if (!el) return;

    const sheetHeight = el.offsetHeight;
    const offsetY = currentYRef.current;

    // Calculate velocity from touch history
    const velocity = computeVelocity(historyRef.current);

    if (velocity > velocityThreshold || offsetY > sheetHeight * offsetThreshold) {
      // Close: animate sheet off-screen, then call onClose
      el.style.transition = `transform 250ms var(--spring-gentle)`;
      el.style.transform = `translateY(100%)`;
      // Wait for animation, then close
      const timeout = setTimeout(() => {
        onClose();
        // Reset transform after close
        el.style.transition = '';
        el.style.transform = '';
        el.style.willChange = '';
      }, 250);
      // Store timeout in case we need to clean up
      return () => clearTimeout(timeout);
    } else {
      // Snap back
      el.style.transition = `transform 250ms var(--spring-snappy)`;
      el.style.transform = 'translateY(0)';
      // Clean up after snap
      const onEnd = () => {
        el.style.transition = '';
        el.style.willChange = '';
        el.removeEventListener('transitionend', onEnd);
      };
      el.addEventListener('transitionend', onEnd, { once: true });
    }
  }, [sheetRef, onClose, velocityThreshold, offsetThreshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

/**
 * Compute vertical velocity (px/s) from recent touch points.
 * Exported for future reuse in swipe gesture hooks.
 */
export function computeVelocity(history: TouchPoint[]): number {
  if (history.length < 2) return 0;
  const first = history[0];
  const last = history[history.length - 1];
  const dt = (last.t - first.t) / 1000; // seconds
  if (dt === 0) return 0;
  return (last.y - first.y) / dt; // px/sec, positive = downward
}
