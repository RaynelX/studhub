import type { Transition, Variants } from 'motion/react';

// ============================================================
// Transitions
// ============================================================

/** Быстрый spring для микро-интеракций (expand/collapse, tab switch) */
export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 35,
  mass: 0.8,
};

/** Мягкий spring для BottomSheet, progress bars */
export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
  mass: 1,
};

/** Быстрый tween для fade-переходов */
export const TWEEN_FAST: Transition = {
  type: 'tween',
  duration: 0.18,
  ease: 'easeOut',
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
      staggerChildren: 0.04,
    },
  },
};

export const STAGGER_ITEM: Variants = {
  initial: { opacity: 0, y: 10 },
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
