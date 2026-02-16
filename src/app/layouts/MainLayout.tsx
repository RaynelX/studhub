import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Menu } from 'lucide-react';
import { useSync } from '../../database/sync/SyncProvider';
import { usePageHeader } from '../providers/PageHeaderProvider';
import { useSwUpdate } from '../hooks/use-sw-update';
import { UpdateBanner } from '../components/UpdateBanner';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Сегодня' },
  { to: '/schedule', icon: Calendar, label: 'Расписание' },
  { to: '/subjects', icon: BookOpen, label: 'Предметы' },
  { to: '/more', icon: Menu, label: 'Ещё' },
];

export function MainLayout() {
  const header = usePageHeader();
  const sw = useSwUpdate();

  return (
    <div className="layout-root">
      {/* Header */}
      <header className="layout-header flex items-center justify-between px-4 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {header.title}
          </h1>
          {header.subtitle && (
            <span className="text-sm text-neutral-400 dark:text-neutral-500">
              {header.subtitle}
            </span>
          )}
        </div>
        <SyncIndicator />
      </header>

      {/* Content */}
      <main className="layout-content">
        <Outlet />
      </main>

      {/* Баннер обновления */}
      <UpdateBanner sw={sw} />

      {/* Bottom Navigation */}
      {/*<nav className="layout-nav flex border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">*/}
      <nav className="layout-nav flex border-t-4 border-red-500 bg-red-200 dark:bg-red-900">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 active:text-gray-600'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ background: 'lime', height: '20px', flexShrink: 0 }}>BOTTOM EDGE</div> {/* <--- DEBUG */}
    </div>
  );
}

function SyncIndicator() {
  const { status, triggerSync } = useSync();

  const config = {
    idle:    { color: 'bg-gray-300',  text: 'Ожидание' },
    syncing: { color: 'bg-yellow-400', text: 'Обновление...' },
    success: { color: 'bg-green-400',  text: formatLastSync(status.lastSyncAt) },
    error:   { color: 'bg-red-400',    text: 'Ошибка синхронизации' },
    offline: { color: 'bg-gray-400',   text: formatOffline(status.lastSyncAt) },
  }[status.state];

  return (
    <button
      onClick={triggerSync}
      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 active:text-gray-700 transition-colors"
      title={status.error || 'Нажмите для синхронизации'}
    >
      <div className={`w-2 h-2 rounded-full ${config.color} ${
        status.state === 'syncing' ? 'animate-pulse' : ''
      }`} />
      <span>{config.text}</span>
    </button>
  );
}

function formatLastSync(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Актуально';

  const diff = Date.now() - new Date(lastSyncAt).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;

  return `Давно`;
}

function formatOffline(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Оффлайн';

  const date = new Date(lastSyncAt);
  const time = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `Оффлайн · ${time}`;
}