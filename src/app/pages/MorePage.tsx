import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { SettingsSection } from '../../features/settings/SettingsSection';
import { ThemeSection } from '../../features/settings/ThemeSection';
import { DepartmentSection } from '../../features/department/DepartmentSection';
import { AboutSection } from '../../features/about/AboutSection';
import { ResetButton } from '../../features/settings/ResetButton';
import { useState } from 'react';
import { useAdmin} from '../../features/admin/AdminProvider';
import { AdminLoginSheet } from '../../features/admin/components/AdminLoginSheet';
import { Shield, LogOut } from 'lucide-react';
import { Section } from '../../shared/ui/Section';
import { useExitTransitionWait } from '../../shared/hooks/use-exit-transition';

export function MorePage() {
  useSetPageHeader({ title: 'Ещё' });

  const { isAdmin, user, signOut } = useAdmin();
  const [ loginOpen, setLoginOpen ] = useState(false);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-6">
      <SettingsSection />
      <ThemeSection />
      <DepartmentSection />
      <AboutSection />

      {/* Администрирование */}
      <AdminSection isAdmin={isAdmin} userEmail={user?.email} signOut={signOut} onLoginOpen={() => setLoginOpen(true)} />

      <AdminLoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />

      <ResetButton />
    </div>
  );
}

function AdminSection({ isAdmin, userEmail, signOut, onLoginOpen }: {
  isAdmin: boolean;
  userEmail?: string;
  signOut: () => void;
  onLoginOpen: () => void;
}) {
  const adminKey = isAdmin ? 'logged' : 'login';
  const { displayedKey, entering } = useExitTransitionWait(adminKey, 180);
  const showLoggedIn = displayedKey === 'logged';

  return (
    <div className={entering ? 'anim-fade-slide-enter' : 'anim-fade-slide-exit'}>
      {showLoggedIn ? (
        <Section title="Администрирование">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Shield size={16} />
              <span>Вы вошли как староста</span>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {userEmail}
            </p>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 active:opacity-70 transition-opacity"
            >
              <LogOut size={16} />
              <span>Выйти</span>
            </button>
          </div>
        </Section>
      ) : (
        <Section title="Администрирование">
          <button
            onClick={onLoginOpen}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
          >
            <Shield size={16} />
            <span>Войти как староста</span>
          </button>
        </Section>
      )}
    </div>
  );
}