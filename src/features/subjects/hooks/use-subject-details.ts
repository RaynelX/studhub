import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, getDayOfWeek, getWeekParity } from '../../schedule/utils/week-utils';
import type {
  ScheduleEntryDoc,
  SubjectDoc,
  SemesterConfigDoc,
  EntryType,
  TargetLanguage,
  TargetEngSubgroup,
  TargetOitSubgroup,
} from '../../../database/types';
import type { StudentSettings } from '../../settings/SettingsProvider';

export interface SubjectTeacher {
    entryTypes: EntryType[];
    teacherName: string;
}

export interface SubjectProgress {
  passed: number;
  total: number;
  percent: number;
}

export interface SubjectDetails {
  subject: SubjectDoc;
  teachers: SubjectTeacher[];
  progress: SubjectProgress;
}

export function useSubjectDetails(): {
  subjects: SubjectDetails[];
  loading: boolean;
} {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: subjects, loading: l1 } = useRxCollection(db.subjects);
  const { data: entries, loading: l2 } = useRxCollection(db.schedule);
  const { data: teachers, loading: l3 } = useRxCollection(db.teachers);
  const { data: semesterData, loading: l4 } = useRxCollection(db.semester);

  const loading = l1 || l2 || l3 || l4;

  return useMemo(() => {
    if (loading) return { subjects: [], loading: true };

    const teacherMap = new Map(teachers.map((t) => [t.id, t]));
    const semesterConfig = semesterData[0] ?? null;
    const todayStr = toISODate(new Date());

    const result: SubjectDetails[] = subjects.map((subject) => {
      // Все записи расписания для этого предмета, отфильтрованные по студенту
      const subjectEntries = entries.filter(
        (e) => e.subject_id === subject.id && isForStudent(e, settings),
      );

      // Преподаватели — уникальные по типу занятия
      // Преподаватели — собираем все типы занятий для каждого преподавателя
      const teacherTypes = new Map<string, { name: string; types: Set<EntryType> }>();
      for (const entry of subjectEntries) {
        const teacher = teacherMap.get(entry.teacher_id);
        if (!teacher) continue;

        const existing = teacherTypes.get(teacher.id);
        if (existing) {
          existing.types.add(entry.entry_type);
        } else {
          teacherTypes.set(teacher.id, {
            name: teacher.full_name,
            types: new Set([entry.entry_type]),
          });
        }
      }

      const subjectTeachers: SubjectTeacher[] = Array.from(teacherTypes.values()).map(
        ({ name, types }) => ({
          teacherName: name,
          entryTypes: Array.from(types),
        }),
      );

      // Прогресс
      const progress = calculateProgress(subjectEntries, todayStr, semesterConfig);

      return { subject, teachers: subjectTeachers, progress };
    });

    // Убрать предметы без пар (для данного студента)
    const filtered = result.filter((r) => r.progress.total > 0);

    return { subjects: filtered, loading: false };
  }, [loading, subjects, entries, teachers, semesterData, settings]);
}

function isForStudent(
  item: {
    target_language: TargetLanguage;
    target_eng_subgroup: TargetEngSubgroup;
    target_oit_subgroup: TargetOitSubgroup;
  },
  settings: StudentSettings,
): boolean {
  const languageOk =
    item.target_language === 'all' || item.target_language === settings.language;
  const engOk =
    item.target_eng_subgroup === 'all' ||
    settings.language !== 'en' ||
    item.target_eng_subgroup === settings.eng_subgroup;
  const oitOk =
    item.target_oit_subgroup === 'all' ||
    item.target_oit_subgroup === settings.oit_subgroup;
  return languageOk && engOk && oitOk;
}

function calculateProgress(
  entries: ScheduleEntryDoc[],
  todayStr: string,
  semesterConfig: SemesterConfigDoc | null,
): SubjectProgress {
  let passed = 0;
  let total = 0;

  for (const entry of entries) {
    const dates = generatePairDates(entry, semesterConfig);
    total += dates.length;
    passed += dates.filter((d) => d <= todayStr).length;
  }

  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;
  return { passed, total, percent };
}

function generatePairDates(
  entry: ScheduleEntryDoc,
  semesterConfig: SemesterConfigDoc | null,
): string[] {
  const dates: string[] = [];
  const current = new Date(entry.date_from);
  const end = new Date(entry.date_to);

  while (current <= end) {
    if (getDayOfWeek(current) === entry.day_of_week) {
      // Проверить чётность недели
      if (entry.week_parity === 'all' || !semesterConfig) {
        dates.push(toISODate(current));
      } else {
        const parity = getWeekParity(current, semesterConfig.odd_week_start);
        if (parity === entry.week_parity) {
          dates.push(toISODate(current));
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}