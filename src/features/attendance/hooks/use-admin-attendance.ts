import { useState, useCallback, useMemo } from 'react';
import { getMonday, addDays, toISODate } from '../../schedule/utils/week-utils';

// ============================================================
// Типы
// ============================================================

export type AbsenceType = 'excused' | 'unexcused';

interface AdminAttendanceRecords {
  [key: string]: AbsenceType; // key = "YYYY-MM-DD_pairNumber_studentId"
}

export interface StudentHoursSummary {
  studentId: string;
  weekExcused: number;
  weekUnexcused: number;
  monthExcused: number;
  monthUnexcused: number;
}

// ============================================================
// Константы
// ============================================================

const STORAGE_KEY = 'student_hub_attendance_admin-01';
const HOURS_PER_PAIR = 2;

// ============================================================
// Утилиты
// ============================================================

function makeKey(date: string, pairNumber: number, studentId: string): string {
  return `${date}_${pairNumber}_${studentId}`;
}

function parseKey(key: string): { date: string; studentId: string } | null {
  const parts = key.split('_');
  if (parts.length < 3) return null;
  return { date: parts[0], studentId: parts.slice(2).join('_') };
}

function loadRecords(): AdminAttendanceRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as AdminAttendanceRecords;
    }
    return {};
  } catch {
    return {};
  }
}

function saveRecords(records: AdminAttendanceRecords): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ============================================================
// Хук
// ============================================================

export function useAdminAttendance() {
  const [records, setRecords] = useState<AdminAttendanceRecords>(loadRecords);

  const setAbsence = useCallback(
    (date: string, pairNumber: number, studentId: string, type: AbsenceType) => {
      setRecords((prev) => {
        const next = { ...prev, [makeKey(date, pairNumber, studentId)]: type };
        saveRecords(next);
        return next;
      });
    },
    [],
  );

  const clearAbsence = useCallback(
    (date: string, pairNumber: number, studentId: string) => {
      setRecords((prev) => {
        const next = { ...prev };
        delete next[makeKey(date, pairNumber, studentId)];
        saveRecords(next);
        return next;
      });
    },
    [],
  );

  const getAbsence = useCallback(
    (date: string, pairNumber: number, studentId: string): AbsenceType | undefined => {
      return records[makeKey(date, pairNumber, studentId)];
    },
    [records],
  );

  const studentSummaries = useMemo((): Map<string, StudentHoursSummary> => {
    const today = new Date();
    const monday = getMonday(today);

    const weekDates = new Set<string>();
    for (let i = 0; i < 6; i++) {
      weekDates.add(toISODate(addDays(monday, i)));
    }

    const year = today.getFullYear();
    const month = today.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const map = new Map<string, StudentHoursSummary>();

    for (const [key, type] of Object.entries(records)) {
      const parsed = parseKey(key);
      if (!parsed) continue;
      const { date, studentId } = parsed;

      let entry = map.get(studentId);
      if (!entry) {
        entry = { studentId, weekExcused: 0, weekUnexcused: 0, monthExcused: 0, monthUnexcused: 0 };
        map.set(studentId, entry);
      }

      const isExcused = type === 'excused';

      if (weekDates.has(date)) {
        if (isExcused) entry.weekExcused += HOURS_PER_PAIR;
        else entry.weekUnexcused += HOURS_PER_PAIR;
      }

      if (date.startsWith(monthPrefix)) {
        if (isExcused) entry.monthExcused += HOURS_PER_PAIR;
        else entry.monthUnexcused += HOURS_PER_PAIR;
      }
    }

    return map;
  }, [records]);

  return { records, getAbsence, setAbsence, clearAbsence, studentSummaries };
}
