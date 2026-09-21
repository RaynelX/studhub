import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { usePrimaryDepartments } from '../../features/departments/hooks/use-primary-departments';
import { DepartmentView } from '../../features/departments/components/department-view';

export function DepartmentsPage() {
  useSetPageHeader({ title: 'Кафедры', backTo: '/more' });

  const { data, loading } = usePrimaryDepartments();

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-6">
      {data.map((item) => (
        <DepartmentView key={item.department.id} {...item} />
      ))}

      {!loading && data.length === 0 && (
        <p className="pt-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          Информация о кафедре пока не заполнена
        </p>
      )}
    </div>
  );
}
