import { useState, useMemo } from 'react';
import type {
  EntryType,
  TargetLanguage,
  TargetEngSubgroup,
  TargetOitSubgroup,
  WeekParity,
  ScheduleEntryDoc,
  SemesterConfigDoc,
} from '../../../database/types';
import { calculateEndDate, countTotalPairs } from '../utils/schedule-calculator';
import { findConflicts } from '../utils/conflict-detector';
import type { Conflict } from '../utils/conflict-detector';

// ============================================================
// Types
// ============================================================

export interface WizardStep1 {
  subjectId: string;
  entryType: EntryType;
  teacherId: string;
  room: string;
  targetLanguage: TargetLanguage;
  targetEngSubgroup: TargetEngSubgroup;
  targetOitSubgroup: TargetOitSubgroup;
}

export interface WizardStep2 {
  dayOfWeek: number;          // 1-6
  pairNumber: number;         // 1-5
  weekParity: WeekParity;
  dateFrom: string;           // ISO date
  /** Either set dateTo directly or use pairCount to auto-compute */
  dateTo: string;             // ISO date
  pairCount: number;          // user-entered count of pairs
  useAutoEndDate: boolean;    // toggle: auto-compute dateTo from pairCount
}

export type WizardData = WizardStep1 & WizardStep2;

const EMPTY_STEP1: WizardStep1 = {
  subjectId: '',
  entryType: 'lecture',
  teacherId: '',
  room: '',
  targetLanguage: 'all',
  targetEngSubgroup: 'all',
  targetOitSubgroup: 'all',
};

const EMPTY_STEP2: WizardStep2 = {
  dayOfWeek: 1,
  pairNumber: 1,
  weekParity: 'all',
  dateFrom: '',
  dateTo: '',
  pairCount: 10,
  useAutoEndDate: true,
};

// ============================================================
// Hook
// ============================================================

export function useSchedulePlanner(
  existingEntries: ScheduleEntryDoc[],
  semesterConfig: SemesterConfigDoc | null,
) {
  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState<WizardStep1>(EMPTY_STEP1);
  const [step2, setStep2] = useState<WizardStep2>(EMPTY_STEP2);

  // Auto-compute end date
  const computedDateTo = useMemo(() => {
    if (
      !step2.useAutoEndDate ||
      !step2.dateFrom ||
      !semesterConfig
    ) {
      return step2.dateTo;
    }
    try {
      return calculateEndDate(
        step2.dateFrom,
        step2.dayOfWeek,
        step2.weekParity,
        step2.pairCount,
        semesterConfig.odd_week_start,
      );
    } catch {
      return step2.dateTo;
    }
  }, [step2.useAutoEndDate, step2.dateFrom, step2.dateTo, step2.dayOfWeek, step2.weekParity, step2.pairCount, semesterConfig]);

  // Resolved pair count (when manual dateTo is set)
  const computedPairCount = useMemo(() => {
    if (
      step2.useAutoEndDate ||
      !step2.dateFrom ||
      !step2.dateTo ||
      !semesterConfig
    ) {
      return step2.pairCount;
    }
    return countTotalPairs(
      step2.dateFrom,
      step2.dateTo,
      step2.dayOfWeek,
      step2.weekParity,
      semesterConfig.odd_week_start,
    );
  }, [step2.useAutoEndDate, step2.dateFrom, step2.dateTo, step2.dayOfWeek, step2.weekParity, step2.pairCount, semesterConfig]);

  const effectiveDateTo = step2.useAutoEndDate ? computedDateTo : step2.dateTo;
  const effectivePairCount = step2.useAutoEndDate ? step2.pairCount : computedPairCount;

  // Conflict detection
  const conflicts = useMemo<Conflict[]>(() => {
    if (!effectiveDateTo || !step2.dateFrom) return [];
    return findConflicts(existingEntries, {
      day_of_week: step2.dayOfWeek,
      pair_number: step2.pairNumber,
      date_from: step2.dateFrom,
      date_to: effectiveDateTo,
      week_parity: step2.weekParity,
      target_language: step1.targetLanguage,
      target_eng_subgroup: step1.targetEngSubgroup,
      target_oit_subgroup: step1.targetOitSubgroup,
    });
  }, [existingEntries, step1, step2, effectiveDateTo]);

  // Validity checks
  const isStep1Valid = step1.subjectId !== '' && step1.teacherId !== '';
  const isStep2Valid =
    step2.dateFrom !== '' &&
    (effectiveDateTo ?? '') !== '' &&
    step2.dayOfWeek >= 1 &&
    step2.dayOfWeek <= 6 &&
    step2.pairNumber >= 1 &&
    step2.pairNumber <= 5;

  function reset() {
    setStep(0);
    setStep1(EMPTY_STEP1);
    setStep2(EMPTY_STEP2);
  }

  function goNext() {
    if (step < 2) setStep(step + 1);
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  /** Build the data for submission */
  function getData(): WizardData {
    return {
      ...step1,
      ...step2,
      dateTo: effectiveDateTo,
      pairCount: effectivePairCount,
    };
  }

  return {
    step,
    setStep,
    step1,
    setStep1,
    step2,
    setStep2,
    computedDateTo,
    computedPairCount,
    effectiveDateTo,
    effectivePairCount,
    conflicts,
    isStep1Valid,
    isStep2Valid,
    goNext,
    goBack,
    reset,
    getData,
  };
}
