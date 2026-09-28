import { Section } from '../../../shared/ui/Section';
import { DepartmentContacts } from './department-contacts';
import { DepartmentTeacherRow } from './department-teacher-row';
import type { DepartmentWithStaff } from '../hooks/use-primary-departments';

export function DepartmentView({ department, head, teachers }: DepartmentWithStaff) {
  return (
    <div className="space-y-6">
      {/* Шапка кафедры */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent px-4 py-3.5 text-center">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 text-balance">
          {department.name}
        </h2>
        {head && (
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            Заведующий кафедрой:{' '}
            <span className="text-neutral-600 dark:text-neutral-300">{head.full_name}</span>
          </p>
        )}
      </div>

      <DepartmentContacts department={department} />

      {teachers.length > 0 && (
        <Section title={`Преподаватели · ${teachers.length}`} noPadding>
          <div className="divide-y divide-gray-100 dark:divide-neutral-800">
            {teachers.map((teacher) => (
              <DepartmentTeacherRow key={teacher.id} teacher={teacher} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
