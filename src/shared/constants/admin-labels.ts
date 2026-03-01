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

/** Short subgroup value → display label */
export const SUBGROUP_LABELS: Record<string, string> = {
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  a: 'A',
  b: 'B',
};

// ============================================================
// Subgroup formatting helpers
// ============================================================

interface SubgroupTarget {
  target_language: string;
  target_eng_subgroup: string;
  target_oit_subgroup: string;
}

/**
 * Compact text representation: "EN / EN-A / ОИТ-B"
 * Returns empty string if all subgroups are "all".
 */
export function formatSubgroupCompact(entry: SubgroupTarget, separator = ' / '): string {
  const parts: string[] = [];
  if (entry.target_language !== 'all') parts.push(entry.target_language.toUpperCase());
  if (entry.target_eng_subgroup !== 'all') parts.push(`EN-${entry.target_eng_subgroup.toUpperCase()}`);
  if (entry.target_oit_subgroup !== 'all') parts.push(`ОИТ-${entry.target_oit_subgroup.toUpperCase()}`);
  return parts.join(separator);
}

/**
 * Badge array: ["EN", "EN-A", "ОИТ-B"]
 * Uses SUBGROUP_LABELS for pretty display.
 */
export function formatSubgroupBadges(entry: SubgroupTarget): string[] {
  const badges: string[] = [];
  if (entry.target_language !== 'all') {
    badges.push(SUBGROUP_LABELS[entry.target_language] ?? entry.target_language);
  }
  if (entry.target_eng_subgroup !== 'all') {
    badges.push(`EN-${SUBGROUP_LABELS[entry.target_eng_subgroup] ?? entry.target_eng_subgroup}`);
  }
  if (entry.target_oit_subgroup !== 'all') {
    badges.push(`ОИТ-${SUBGROUP_LABELS[entry.target_oit_subgroup] ?? entry.target_oit_subgroup}`);
  }
  return badges;
}
