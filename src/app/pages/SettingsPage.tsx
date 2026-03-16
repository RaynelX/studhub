import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { SettingsSection } from '../../features/settings/SettingsSection';
import { ThemeSection } from '../../features/settings/ThemeSection';
import { ResetButton } from '../../features/settings/ResetButton';
import { NotificationSettings } from '../../features/notifications/components/notification-settings';

export function SettingsPage() {
  useSetPageHeader({ title: 'Настройки', backTo: '/more' });

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-6">
      <SettingsSection />
      <NotificationSettings />
      <ThemeSection />
      <ResetButton />
    </div>
  );
}
