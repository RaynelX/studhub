import { useEffect, useRef } from 'react';

/**
 * Adds an instant radial-highlight at the touch point on any card element.
 *
 * Usage:
 *   const rippleRef = useTouchRipple();
 *   <div ref={rippleRef} className="...">…</div>
 *
 * The hook imperatively appends a lightweight overlay `<div class="touch-ripple">`
 * inside the referenced element and toggles `data-active` via pointer events.
 * CSS in index.css handles the radial-gradient and fade-out transition.
 *
 * Requirements for the host element:
 *  - Must accept a ref (any HTMLElement).
 *  - The hook sets `position: relative` if needed; no className changes required.
 */
export function useTouchRipple<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ensure the element is a positioning context for the overlay
    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }

    // Create persistent overlay (no DOM churn on every touch)
    const overlay = document.createElement('div');
    overlay.className = 'touch-ripple';
    overlay.setAttribute('aria-hidden', 'true');
    el.appendChild(overlay);

    function onDown(e: PointerEvent) {
      // Primary pointer only (left-click / single touch)
      if (e.button !== 0) return;
      const rect = el!.getBoundingClientRect();
      overlay.style.setProperty('--rx', `${e.clientX - rect.left}px`);
      overlay.style.setProperty('--ry', `${e.clientY - rect.top}px`);
      overlay.dataset.active = '';
    }

    function onUp() {
      delete overlay.dataset.active;
    }

    el.addEventListener('pointerdown', onDown, { passive: true });
    el.addEventListener('pointerup', onUp, { passive: true });
    el.addEventListener('pointerleave', onUp, { passive: true });
    el.addEventListener('pointercancel', onUp, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('pointercancel', onUp);
      overlay.remove();
    };
  }, []);

  return ref;
}
