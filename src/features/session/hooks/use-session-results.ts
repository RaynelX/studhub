import { useState, useCallback, useMemo } from 'react';

// ============================================================
// Типы
// ============================================================

export type GradeValue = 'passed' | 'failed' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface SessionResults {
  [eventId: string]: GradeValue;
}

export interface SessionResultsSummary {
  totalExams: number;
  totalCredits: number;
  completedExams: number;
  completedCredits: number;
  failedCount: number;
  averageGrade: number | null;
}

// ============================================================
// Константы
// ============================================================

const STORAGE_KEY = 'student_hub_session_results-01';

// ============================================================
// Утилиты
// ============================================================

function loadResults(): SessionResults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as SessionResults;
    }
    return {};
  } catch {
    return {};
  }
}

function saveResults(results: SessionResults): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

// ============================================================
// Хук
// ============================================================

export function useSessionResults(sessionEventIds?: { id: string; eventType: string }[]) {
  const [results, setResults] = useState<SessionResults>(loadResults);

  const setResult = useCallback((eventId: string, value: GradeValue) => {
    setResults((prev) => {
      const next = { ...prev, [eventId]: value };
      saveResults(next);
      return next;
    });
  }, []);

  const clearResult = useCallback((eventId: string) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[eventId];
      saveResults(next);
      return next;
    });
  }, []);

  const summary = useMemo((): SessionResultsSummary => {
    if (!sessionEventIds) {
      return { totalExams: 0, totalCredits: 0, completedExams: 0, completedCredits: 0, failedCount: 0, averageGrade: null };
    }

    const exams = sessionEventIds.filter((e) => e.eventType === 'exam');
    const credits = sessionEventIds.filter((e) => e.eventType === 'credit');

    let completedExams = 0;
    let completedCredits = 0;
    let failedCount = 0;
    const numericGrades: number[] = [];

    for (const e of exams) {
      const r = results[e.id];
      if (r == null) continue;
      if (r === 'failed' || (typeof r === 'number' && r <= 3)) {
        failedCount++;
      } else {
        completedExams++;
      }
      if (typeof r === 'number') numericGrades.push(r);
    }

    for (const e of credits) {
      const r = results[e.id];
      if (r == null) continue;
      if (r === 'failed') {
        failedCount++;
      } else {
        completedCredits++;
      }
    }

    const averageGrade =
      numericGrades.length > 0
        ? Math.round((numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length) * 100) / 100
        : null;

    return {
      totalExams: exams.length,
      totalCredits: credits.length,
      completedExams,
      completedCredits,
      failedCount,
      averageGrade,
    };
  }, [results, sessionEventIds]);

  return { results, setResult, clearResult, summary };
}
