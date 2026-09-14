/**
 * Shared label maps and utilities used across admin schedule components.
 * Centralised here to eliminate duplication.
 */

// ============================================================
// Entry / Override / Parity type labels
// ============================================================

/** Short labels for schedule entry types (grid cells) */
export const ENTRY_TYPE_LABELS_SHORT: Record<string, string> = {
  lecture: 'Лек',
  seminar: 'Сем',
  practice: 'Пр',
  other: 'Др',
};

/** Full labels for schedule entry types (tables, popovers) */
export const ENTRY_TYPE_LABELS: Record<string, string> = {
  lecture: 'Лекция',
  seminar: 'Семинар',
  practice: 'Практика',
  other: 'Другое',
};

/** Full labels for override types */
export const OVERRIDE_TYPE_LABELS: Record<string, string> = {
  cancel: 'Отмена',
  replace: 'Замена',
  add: 'Доп. пара',
};

/** Badge color classes for override types */
export const OVERRIDE_TYPE_COLORS: Record<string, string> = {
  cancel: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  replace: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  add: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

/** Labels for week parity */
export const PARITY_LABELS: Record<string, string> = {
  all: 'Кажд.',
  odd: 'Нечёт',
  even: 'Чёт',
};

// Подгруппы больше не захардкожены: их названия и бейджи строятся
// из данных — см. formatTargetLabels / formatTargetsCompact
// в shared/targeting/match.ts.
