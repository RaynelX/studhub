import type { Transition, Variants } from 'motion/react';

// ============================================================
// Transitions
// ============================================================

/** Быстрый spring для микро-интеракций (expand/collapse, tab switch) */
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

/** Мягкий spring для BottomSheet, page transitions */
export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
};

/** Быстрый tween для fade-переходов */
export const TWEEN_FAST: Transition = {
  type: 'tween',
  duration: 0.15,
  ease: 'easeOut',
};

// ============================================================
// Page transition variants
// ============================================================

export function pageVariants(direction: number): Variants {
  return {
    initial: { x: direction * 30, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: direction * -30, opacity: 0 },
  };
}

export const PAGE_TRANSITION: Transition = {
  type: 'tween',
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

// ============================================================
// Fade variants
// ============================================================

export const FADE_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const FADE_SLIDE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ============================================================
// BottomSheet variants
// ============================================================

export const BACKDROP_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const SHEET_VARIANTS: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

// ============================================================
// Stagger variants
// ============================================================

export const STAGGER_CONTAINER: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const STAGGER_ITEM: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// ============================================================
// Expand/collapse variants
// ============================================================

export const EXPAND_VARIANTS: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

// ============================================================
// Banner slide variants
// ============================================================

export const BANNER_VARIANTS: Variants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 50, opacity: 0 },
};
