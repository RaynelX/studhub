import { useState, useCallback, useMemo } from 'react';
import { addDays, toISODate, parseLocalDate } from '../../schedule/utils/week-utils';

// ============================================================
// Типы
// ============================================================

export type AttendanceStatus = 'present' | 'excused' | 'unexcused';

interface AttendanceRecords {
  [key: string]: AttendanceStatus; // key = "YYYY-MM-DD_pairNumber"
}

export interface AttendanceHoursSummary {
  weekExcused: number;
  weekUnexcused: number;
  monthExcused: number;
  monthUnexcused: number;
}

// ============================================================
// Константы
// ============================================================

const STORAGE_KEY = 'student_hub_attendance-01';
const HOURS_PER_PAIR = 2;

// ============================================================
// Утилиты
// ============================================================

function makeKey(date: string, pairNumber: number): string {
  return `${date}_${pairNumber}`;
}

function loadRecords(): AttendanceRecords {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as AttendanceRecords;
    }
    return {};
  } catch {
    return {};
  }
}

function saveRecords(records: AttendanceRecords): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ============================================================
// Хук
// ============================================================

export function useAttendance(viewedMonday: Date) {
  const [records, setRecords] = useState<AttendanceRecords>(loadRecords);

  const setStatus = useCallback(
    (date: string, pairNumber: number, status: AttendanceStatus) => {
      setRecords((prev) => {
        const next = { ...prev, [makeKey(date, pairNumber)]: status };
        saveRecords(next);
        return next;
      });
    },
    [],
  );

  const clearStatus = useCallback((date: string, pairNumber: number) => {
    setRecords((prev) => {
      const next = { ...prev };
      delete next[makeKey(date, pairNumber)];
      saveRecords(next);
      return next;
    });
  }, []);

  const getStatus = useCallback(
    (date: string, pairNumber: number): AttendanceStatus | undefined => {
      return records[makeKey(date, pairNumber)];
    },
    [records],
  );

  const viewedMondayStr = toISODate(viewedMonday);

  const summary = useMemo((): AttendanceHoursSummary => {
    const monday = parseLocalDate(viewedMondayStr);

    // Даты просматриваемой недели (Пн–Сб)
    const weekDates = new Set<string>();
    for (let i = 0; i < 6; i++) {
      weekDates.add(toISODate(addDays(monday, i)));
    }

    // Месяц, в который попадает просматриваемый понедельник
    const year = monday.getFullYear();
    const month = monday.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    let weekExcused = 0;
    let weekUnexcused = 0;
    let monthExcused = 0;
    let monthUnexcused = 0;

    for (const [key, status] of Object.entries(records)) {
      if (status === 'present') continue;
      const date = key.split('_')[0];

      const isExcused = status === 'excused';

      if (weekDates.has(date)) {
        if (isExcused) weekExcused += HOURS_PER_PAIR;
        else weekUnexcused += HOURS_PER_PAIR;
      }

      if (date.startsWith(monthPrefix)) {
        if (isExcused) monthExcused += HOURS_PER_PAIR;
        else monthUnexcused += HOURS_PER_PAIR;
      }
    }

    return { weekExcused, weekUnexcused, monthExcused, monthUnexcused };
  }, [records, viewedMondayStr]);

  return { records, getStatus, setStatus, clearStatus, summary };
}
