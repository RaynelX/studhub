import { useState, useEffect, useCallback } from 'react';
import { Save, CalendarRange, Info, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '../../../features/admin/components/ui/admin-page-header';
import { AdminCard } from '../../../features/admin/components/ui/admin-card';
import { useAdminToast } from '../../../features/admin/components/ui/admin-toast';
import { useDatabase } from '../../providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { useAdminWrite } from '../../../features/admin/hooks/use-admin-write';
import { PurgeDataDialog } from '../../../features/admin/components/ui/purge-data-dialog';

interface SemesterFormData {
  name: string;
  startDate: string;
  endDate: string;
  oddWeekStart: string;
}

export function AdminSemesterPage() {
  const db = useDatabase();
  const { data: semesters, loading: dataLoading } = useRxCollection(db.semester);
  const { update, insert, purge, loading: writeLoading } = useAdminWrite();
  const { showToast } = useAdminToast();
  const [purgeOpen, setPurgeOpen] = useState(false);

  const handlePurge = useCallback(async (tables: string[]) => {
    await purge(tables);
    showToast('success', 'Данные успешно удалены');
  }, [purge, showToast]);

  const semesterConfig = semesters[0] ?? null;

  const [form, setForm] = useState<SemesterFormData>({
    name: '',
    startDate: '',
    endDate: '',
    oddWeekStart: '',
  });
  const [dirty, setDirty] = useState(false);

  // Sync form with DB data — intentional setState to mirror DB → local form
  useEffect(() => {
    if (semesterConfig) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: semesterConfig.name,
        startDate: semesterConfig.start_date,
        endDate: semesterConfig.end_date,
        oddWeekStart: semesterConfig.odd_week_start,
      });
      setDirty(false);
    }
  }, [semesterConfig]);

  function handleChange<K extends keyof SemesterFormData>(key: K, value: SemesterFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      start_date: form.startDate,
      end_date: form.endDate,
      odd_week_start: form.oddWeekStart,
    };

    try {
      if (semesterConfig) {
        await update('semester_config', semesterConfig.id, payload);
      } else {
        await insert('semester_config', payload);
      }
      showToast('success', 'Настройки семестра сохранены');
      setDirty(false);
    } catch {
      showToast('error', 'Не удалось сохранить');
    }
  }

  const isValid = form.name.trim() !== '' && form.startDate !== '' && form.endDate !== '' && form.oddWeekStart !== '';

  // Compute semester duration
  const durationDays =
    form.startDate && form.endDate
      ? Math.ceil(
          (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000,
        ) + 1
      : null;
  const durationWeeks = durationDays ? Math.ceil(durationDays / 7) : null;

  const inputCls =
    'w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';

  if (dataLoading) {
    return (
      <>
        <AdminPageHeader title="Семестр" description="Настройки текущего учебного семестра" />
        <AdminCard>
          <div className="py-12 text-center text-neutral-400 text-sm">Загрузка…</div>
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <AdminPageHeader
        title="Семестр"
        description="Настройки текущего учебного семестра"
        actions={
          <button
            onClick={handleSave}
            disabled={!dirty || !isValid || writeLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {writeLoading ? 'Сохранение…' : 'Сохранить'}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main form */}
        <AdminCard className="lg:col-span-2">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className={labelCls}>Название семестра</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Весна 2025"
                className={inputCls}
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Начало семестра</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Конец семестра</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Odd week start */}
            <div>
              <label className={labelCls}>Дата начала нечётной недели</label>
              <input
                type="date"
                value={form.oddWeekStart}
                onChange={(e) => handleChange('oddWeekStart', e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
                Понедельник первой нечётной учебной недели. Используется для определения чётности.
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Info card */}
        <div className="space-y-4">
          <AdminCard>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shrink-0">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Длительность</p>
                {durationDays && durationWeeks ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {durationDays} дней · ~{durationWeeks} недель
                  </p>
                ) : (
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Укажите даты
                  </p>
                )}
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Подсказка</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  Изменение дат семестра повлияет на отображение расписания, подсчёт пар в курсах и прогресс-бар на главной странице.
                </p>
              </div>
            </div>
          </AdminCard>

          {/* Purge data */}
          <AdminCard>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Удалить данные</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  Очистка данных при смене семестра
                </p>
                <button
                  onClick={() => setPurgeOpen(true)}
                  className="mt-2.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  Удалить данные…
                </button>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      <PurgeDataDialog
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onPurge={handlePurge}
      />
    </>
  );
}
