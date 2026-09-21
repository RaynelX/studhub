import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import type { DepartmentDoc, TeacherDoc } from '../../../database/types';

export interface DepartmentWithStaff {
  department: DepartmentDoc;
  /** Заведующий кафедрой, если указан и ещё существует */
  head: TeacherDoc | null;
  /** Преподаватели кафедры, по алфавиту */
  teachers: TeacherDoc[];
}

/**
 * Кафедры, которые видит студент: те, у кого is_primary.
 * Сейчас это ровно одна кафедра — социальной коммуникации, — но выбор
 * лежит в данных, а не в коде: староста переключает флаг в Supabase.
 */
export function usePrimaryDepartments(): { data: DepartmentWithStaff[]; loading: boolean } {
  const db = useDatabase();
  const { data: departments, loading: departmentsLoading } = useRxCollection(db.departments);
  const { data: teachers, loading: teachersLoading } = useRxCollection(db.teachers);

  const data = useMemo(() => {
    const activeTeachers = teachers.filter((t) => !t.is_deleted);

    return departments
      .filter((d) => d.is_primary && !d.is_deleted)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((department) => ({
        department,
        head: department.head_teacher_id
          ? activeTeachers.find((t) => t.id === department.head_teacher_id) ?? null
          : null,
        teachers: activeTeachers
          .filter((t) => t.department_id === department.id)
          .sort((a, b) => a.full_name.localeCompare(b.full_name, 'ru')),
      }));
  }, [departments, teachers]);

  return { data, loading: departmentsLoading || teachersLoading };
}
