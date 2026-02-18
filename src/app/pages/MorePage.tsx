import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { SettingsSection } from '../../features/settings/SettingsSection';
import { ThemeSection } from '../../features/settings/ThemeSection';
import { DepartmentSection } from '../../features/department/DepartmentSection';
import { AboutSection } from '../../features/about/AboutSection';
import { ResetButton } from '../../features/settings/ResetButton';

export function MorePage() {
  useSetPageHeader({ title: 'Ещё' });

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-6">
      <SettingsSection />
      <ThemeSection />
      <DepartmentSection />
      <AboutSection />
      <ResetButton />
    </div>
  );
}