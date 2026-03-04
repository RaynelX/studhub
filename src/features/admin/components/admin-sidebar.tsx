import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { useAdmin } from '../AdminProvider';

// ============================================================
// Nav items
// ============================================================

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Обзор', end: true },
  { to: '/admin/schedule', icon: Calendar, label: 'Расписание', end: false },
  { to: '/admin/subjects', icon: BookOpen, label: 'Предметы', end: false },
  { to: '/admin/teachers', icon: Users, label: 'Преподаватели', end: false },
  { to: '/admin/students', icon: GraduationCap, label: 'Студенты', end: false },
  { to: '/admin/semester', icon: Settings, label: 'Семестр', end: false },
] as const;

// ============================================================
// Component
// ============================================================

export function AdminSidebar() {
  const { user, signOut } = useAdmin();

  return (
    <aside className="w-60 shrink-0 bg-neutral-900 text-neutral-300 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-neutral-800">
        <h1 className="text-lg font-bold text-white tracking-tight">StudHub</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Панель старосты</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {/* Search shortcut */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          className="w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-lg text-sm text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300 transition-colors"
        >
          <Search className="w-[18px] h-[18px] shrink-0" />
          <span className="flex-1 text-left">Поиск</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-500">
            Ctrl K
          </kbd>
        </button>

        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-neutral-800 space-y-2">
        {/* User info */}
        {user && (
          <p className="px-3 text-xs text-neutral-500 truncate" title={user.email ?? ''}>
            {user.email}
          </p>
        )}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти
        </button>

        {/* Back to app */}
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          В приложение
        </Link>
      </div>
    </aside>
  );
}
