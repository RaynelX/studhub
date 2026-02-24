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
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-black">
      {/* Header */}
      <header
        className="sticky top-0 z-40 shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
      >
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
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Баннер обновления */}
      <UpdateBanner sw={sw} />

      {/* Invisible spacer — same height as nav, reserves space in document flow */}
      <div
        className="shrink-0"
        style={{ height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
        aria-hidden="true"
      />

      {/* Bottom Navigation — fixed to true screen bottom, floats over spacer */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
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