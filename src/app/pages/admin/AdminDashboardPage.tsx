import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarClock, CalendarDays, GraduationCap, Plus, CalendarPlus } from 'lucide-react';
import { AdminPageHeader } from '../../../features/admin/components/ui/admin-page-header';
import { AdminStatCard } from '../../../features/admin/components/ui/admin-stat-card';
import { AdminCard } from '../../../features/admin/components/ui/admin-card';
import { useAdminStats } from '../../../features/admin/hooks/use-admin-stats';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useDatabase } from '../../providers/DatabaseProvider';
import { toISODate } from '../../../features/schedule/utils/week-utils';

// ============================================================
// Helpers
// ============================================================

const OVERRIDE_TYPE_LABELS: Record<string, string> = {
  cancel: 'Отмена',
  replace: 'Замена',
  add: 'Доп. пара',
};

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ============================================================
// Component
// ============================================================

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const stats = useAdminStats();
  const db = useDatabase();
  const { data: overrides } = useRxCollection(db.overrides);
  const { data: events } = useRxCollection(db.events);
  const { data: subjects } = useRxCollection(db.subjects);

  const todayISO = toISODate(new Date());

  // Recent/upcoming overrides and events, sorted by date, max 5
  const recentChanges = [...overrides, ...events]
    .filter((item) => item.date >= todayISO)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  function getChangeLabel(item: (typeof recentChanges)[number]): string {
    if ('override_type' in item) {
      const typeLabel = OVERRIDE_TYPE_LABELS[item.override_type] ?? item.override_type;
      const subj = item.subject_id
        ? subjects.find((s) => s.id === item.subject_id)?.short_name ?? subjects.find((s) => s.id === item.subject_id)?.name
        : undefined;
      return subj ? `${typeLabel}: ${subj}, ${item.pair_number} пара` : `${typeLabel}, ${item.pair_number} пара`;
    }
    // EventDoc
    return item.title;
  }

  return (
    <>
      <AdminPageHeader title="Обзор" description="Панель управления старосты" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          label="Предметов"
          value={stats.loading ? '—' : stats.subjectCount}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <AdminStatCard
          label="Изменений на неделе"
          value={stats.loading ? '—' : stats.overrideCountThisWeek}
          icon={<CalendarClock className="w-5 h-5" />}
        />
        <AdminStatCard
          label="Событий впереди"
          value={stats.loading ? '—' : stats.upcomingEventsCount}
          icon={<CalendarDays className="w-5 h-5" />}
        />
        <AdminStatCard
          label="Студентов"
          value={stats.loading ? '—' : stats.studentCount}
          icon={<GraduationCap className="w-5 h-5" />}
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/schedule')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить курс в расписание
        </button>
        <button
          onClick={() => navigate('/admin/schedule')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Создать событие
        </button>
      </div>

      {/* Recent changes */}
      <AdminCard title="Ближайшие изменения">
        {recentChanges.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">Нет предстоящих изменений</p>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-800">
            {recentChanges.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 w-16 shrink-0 tabular-nums">
                    {formatDate(item.date)}
                  </span>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {getChangeLabel(item)}
                  </span>
                </div>
                {'override_type' in item && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.override_type === 'cancel'
                        ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                        : item.override_type === 'replace'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}
                  >
                    {OVERRIDE_TYPE_LABELS[item.override_type]}
                  </span>
                )}
                {'event_type' in item && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    Событие
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </>
  );
}
