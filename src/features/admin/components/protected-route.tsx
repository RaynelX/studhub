import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../AdminProvider';

/**
 * Route guard for admin pages.
 *
 * While the auth state is loading, shows a centered spinner.
 * If the user is not authenticated, redirects to /admin/login.
 * Otherwise renders the child routes via <Outlet />.
 */
export function ProtectedRoute() {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
