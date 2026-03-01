import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../../features/admin/components/admin-sidebar';
import { AdminSearchDialog } from '../../features/admin/components/admin-search-dialog';

/**
 * Desktop admin layout: fixed sidebar + scrollable content area.
 */
export function AdminLayout() {
  return (
    <div className="flex h-dvh bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>

      <AdminSearchDialog />
    </div>
  );
}
