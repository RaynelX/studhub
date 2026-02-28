import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from './providers/DatabaseProvider';
import { SyncProvider } from '../database/sync/SyncProvider';
import { SettingsProvider } from '../features/settings/SettingsProvider';
import { MainLayout } from './layouts/MainLayout';
import { TodayPage } from './pages/TodayPage';
import { SchedulePage } from './pages/SchedulePage';
import { SubjectsPage } from './pages/SubjectsPage';
import { MorePage } from './pages/MorePage';
import { SettingsPage } from './pages/SettingsPage';
import { ThemeProvider } from '../features/settings/ThemeProvider';
import { PageHeaderProvider } from './providers/PageHeaderProvider';
import { AdminProvider } from '../features/admin/AdminProvider';

export function App() {
  return (
    <ThemeProvider>
      <DatabaseProvider>
        <SyncProvider>
          <SettingsProvider>
            <AdminProvider>
              <PageHeaderProvider>
                <BrowserRouter>
                  <Routes>
                    <Route element={<MainLayout />}>
                      <Route index element={<TodayPage />} />
                      <Route path="schedule" element={<SchedulePage />} />
                      <Route path="subjects" element={<SubjectsPage />} />
                      <Route path="more/settings" element={<SettingsPage />} />
                      <Route path="more" element={<MorePage />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
              </PageHeaderProvider>
            </AdminProvider>
          </SettingsProvider>
        </SyncProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}