import type { ScheduleEntryDoc, WeekParity } from '../../../database/types';

// ============================================================
// Types
// ============================================================

export interface Conflict {
  /** The existing entry that conflicts */
  existingEntry: ScheduleEntryDoc;
  /** Human-readable reason */
  reason: string;
}

/**
 * The "new entry" candidate — all fields needed for conflict checking.
 * Can be a partial ScheduleEntryDoc (during wizard) or a full one.
 */
export interface EntryCandidate {
  day_of_week: number;
  pair_number: number;
  date_from: string;
  date_to: string;
  week_parity: WeekParity;
  target_language: string;
  target_eng_subgroup: string;
  target_oit_subgroup: string;
  /** If editing an existing entry, exclude it from conflict checks */
  excludeId?: string;
}

// ============================================================
// Core
// ============================================================

/**
 * Находит все конфликты новой записи расписания с существующими.
 *
 * Конфликт — это когда два курса:
 * 1. На одном дне недели
 * 2. На одном номере пары
 * 3. Date-ranges пересекаются
 * 4. Чётности не исключают друг друга
 * 5. Подгруппы не исключают друг друга
 */
export function findConflicts(
  existingEntries: ScheduleEntryDoc[],
  candidate: EntryCandidate,
): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const entry of existingEntries) {
    // Skip self when editing
    if (candidate.excludeId && entry.id === candidate.excludeId) continue;

    // Skip deleted entries
    if (entry.is_deleted) continue;

    // 1. Same day
    if (entry.day_of_week !== candidate.day_of_week) continue;

    // 2. Same pair slot
    if (entry.pair_number !== candidate.pair_number) continue;

    // 3. Date range overlap
    if (!dateRangesOverlap(entry.date_from, entry.date_to, candidate.date_from, candidate.date_to)) {
      continue;
    }

    // 4. Week parity compatibility
    if (!paritiesOverlap(entry.week_parity, candidate.week_parity)) continue;

    // 5. Subgroup overlap
    if (!subgroupsOverlap(entry, candidate)) continue;

    conflicts.push({
      existingEntry: entry,
      reason: buildReason(entry),
    });
  }

  return conflicts;
}

// ============================================================
// Helpers
// ============================================================

function dateRangesOverlap(
  aFrom: string,
  aTo: string,
  bFrom: string,
  bTo: string,
): boolean {
  return aFrom <= bTo && bFrom <= aTo;
}

function paritiesOverlap(a: WeekParity, b: WeekParity): boolean {
  if (a === 'all' || b === 'all') return true;
  return a === b;
}

function subgroupsOverlap(
  a: { target_language: string; target_eng_subgroup: string; target_oit_subgroup: string },
  b: { target_language: string; target_eng_subgroup: string; target_oit_subgroup: string },
): boolean {
  // Language check
  if (a.target_language !== 'all' && b.target_language !== 'all' && a.target_language !== b.target_language) {
    return false;
  }

  // English subgroup check (only relevant when both target English or one targets 'all')
  const bothEnglishRelevant =
    (a.target_language === 'all' || a.target_language === 'en') &&
    (b.target_language === 'all' || b.target_language === 'en');

  if (
    bothEnglishRelevant &&
    a.target_eng_subgroup !== 'all' &&
    b.target_eng_subgroup !== 'all' &&
    a.target_eng_subgroup !== b.target_eng_subgroup
  ) {
    return false;
  }

  // OIT subgroup check
  if (
    a.target_oit_subgroup !== 'all' &&
    b.target_oit_subgroup !== 'all' &&
    a.target_oit_subgroup !== b.target_oit_subgroup
  ) {
    return false;
  }

  return true;
}

const DAY_NAMES: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
};

function buildReason(existing: ScheduleEntryDoc): string {
  const day = DAY_NAMES[existing.day_of_week] ?? `День ${existing.day_of_week}`;
  return `Конфликт: ${day}, ${existing.pair_number} пара (${existing.date_from} — ${existing.date_to}, чётность: ${existing.week_parity})`;
}
