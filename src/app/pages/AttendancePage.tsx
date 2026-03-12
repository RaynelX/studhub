import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useAdmin } from '../../features/admin/AdminProvider';
import { StudentAttendanceView } from '../../features/attendance/components/StudentAttendanceView';
import { AdminAttendanceView } from '../../features/attendance/components/AdminAttendanceView';

export function AttendancePage() {
  useSetPageHeader({ title: 'Посещаемость', backTo: '/more' });

  const { isAdmin } = useAdmin();

  return isAdmin ? <AdminAttendanceView /> : <StudentAttendanceView />;
}
