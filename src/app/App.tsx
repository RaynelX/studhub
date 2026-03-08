import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { SyncProvider } from '../database/sync/SyncProvider';
import { SettingsProvider } from '../features/settings/SettingsProvider';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/admin-layout';
import { TodayPage } from './pages/TodayPage';
import { SchedulePage } from './pages/SchedulePage';
import { SubjectsPage } from './pages/SubjectsPage';
import { MorePage } from './pages/MorePage';
import { SettingsPage } from './pages/SettingsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SessionPage } from './pages/SessionPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminSchedulePage } from './pages/admin/AdminSchedulePage';
import { AdminSubjectsPage } from './pages/admin/AdminSubjectsPage';
import { AdminTeachersPage } from './pages/admin/AdminTeachersPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminSemesterPage } from './pages/admin/AdminSemesterPage';
import { ThemeProvider } from '../features/settings/ThemeProvider';
import { PageHeaderProvider } from './providers/PageHeaderProvider';
import { AdminProvider } from '../features/admin/AdminProvider';
import { AdminToastProvider } from '../features/admin/components/ui/admin-toast';
import { ProtectedRoute } from '../features/admin/components/protected-route';

export function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <SyncProvider>
          <AdminProvider>
            <AdminToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Admin routes — no SettingsProvider */}
                <Route path="admin/login" element={<AdminLoginPage />} />
                <Route path="admin" element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="schedule" element={<AdminSchedulePage />} />
                    <Route path="subjects" element={<AdminSubjectsPage />} />
                    <Route path="teachers" element={<AdminTeachersPage />} />
                    <Route path="students" element={<AdminStudentsPage />} />
                    <Route path="semester" element={<AdminSemesterPage />} />
                  </Route>
                </Route>

                {/* Student app routes — wrapped in SettingsProvider */}
                <Route
                  element={
                    <SettingsProvider>
                      <PageHeaderProvider>
                        <MainLayout />
                      </PageHeaderProvider>
                    </SettingsProvider>
                  }
                >
                  <Route index element={<TodayPage />} />
                  <Route path="schedule" element={<SchedulePage />} />
                  <Route path="subjects" element={<SubjectsPage />} />
                  <Route path="more/calendar" element={<CalendarPage />} />
                  <Route path="more/settings" element={<SettingsPage />} />
                  <Route path="more/session" element={<SessionPage />} />
                  <Route path="more" element={<MorePage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </AdminToastProvider>
          </AdminProvider>
        </SyncProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}