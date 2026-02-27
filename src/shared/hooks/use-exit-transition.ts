/* eslint-disable react-hooks/set-state-in-effect -- This hook orchestrates mount/unmount lifecycle via setState in effects. This is intentional and fundamental to its design. */
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Manages mount/unmount lifecycle with enter/exit CSS animations.
 * Replaces Motion's `AnimatePresence` — keeps the element mounted
 * during the exit animation, then unmounts after duration expires.
 *
 * @param open    — whether the element should be visible
 * @param duration — exit animation duration in ms (should match CSS)
 * @returns { mounted, entering, onExitEnd }
 *   - `mounted`  — render the element in DOM only while true
 *   - `entering` — apply enter class when true, exit class when false
 *   - `onExitEnd` — optional callback for onAnimationEnd to unmount precisely
 */
export function useExitTransition(open: boolean, duration = 180) {
  const [mounted, setMounted] = useState(open);
  const [entering, setEntering] = useState(open);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      // Mount and enter in one batch — CSS animation starts automatically
      // on mount via @keyframes, no rAF delay needed
      setMounted(true);
      setEntering(true);
    } else {
      // Start exit animation
      setEntering(false);
      // Unmount after animation completes
      timerRef.current = setTimeout(() => {
        setMounted(false);
      }, duration);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [open, duration]);

  const onExitEnd = useCallback(() => {
    if (!open) setMounted(false);
  }, [open]);

  return { mounted, entering, onExitEnd };
}

/**
 * Variant of `useExitTransition` for "wait" mode:
 * waits for exit animation to finish before mounting the new content.
 * Used to replace `AnimatePresence mode="wait"`.
 *
 * @param activeKey — current content key (like React key)
 * @param duration  — animation duration in ms
 * @returns { displayedKey, entering }
 *   - `displayedKey` — the key to actually render (delayed during exit)
 *   - `entering` — true when the displayed content should be visible
 */
export function useExitTransitionWait<T>(activeKey: T, duration = 180) {
  const [displayedKey, setDisplayedKey] = useState(activeKey);
  const [entering, setEntering] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeKey === displayedKey) return;

    // Phase 1: exit the old content
    setEntering(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Phase 2+3: swap key AND enter in one batch.
      // React 18+ batches these into a single render, so the new
      // element mounts with the enter animation class directly.
      // CSS @keyframes auto-start on mount — no rAF delay needed.
      setDisplayedKey(activeKey);
      setEntering(true);
    }, duration);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [activeKey, displayedKey, duration]);

  return { displayedKey, entering };
}
