import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

interface PillStyle {
  left: number;
  width: number;
  ready: boolean;
}

/**
 * Tracks the position of the active day button inside a container
 * and returns `left` / `width` values for an absolutely-positioned pill.
 * The pill element uses CSS transition (`anim-day-pill` class) for smooth movement.
 *
 * @param containerRef  — ref to the parent element that holds all day buttons
 * @param activeIndex   — 0-based index of the currently selected button
 * @param selector      — CSS selector to find buttons inside container (default: 'button')
 */
export function useFlipPill(
  containerRef: RefObject<HTMLElement | null>,
  activeIndex: number,
  selector = 'button',
): PillStyle {
  const [style, setStyle] = useState<PillStyle>({ left: 0, width: 0, ready: false });
  const prevIndexRef = useRef(activeIndex);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const buttons = container.querySelectorAll(selector);
    const activeBtn = buttons[activeIndex] as HTMLElement | undefined;
    if (!activeBtn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    setStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
      ready: true,
    });

    prevIndexRef.current = activeIndex;
  }, [containerRef, activeIndex, selector]);

  return style;
}
