import { useState, useCallback } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { AdminModal } from './admin-modal';

interface PurgeCategory {
  key: string;
  table: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}

const PURGE_CATEGORIES: PurgeCategory[] = [
  {
    key: 'schedule',
    table: 'schedule_entries',
    label: 'Расписание',
    description: 'Пары, время, аудитории',
    defaultChecked: true,
  },
  {
    key: 'overrides',
    table: 'schedule_overrides',
    label: 'Замены и отмены',
    description: 'Разовые изменения расписания',
    defaultChecked: true,
  },
  {
    key: 'subjects',
    table: 'subjects',
    label: 'Дисциплины',
    description: 'Предметы, ссылки на СДО',
    defaultChecked: true,
  },
  {
    key: 'events',
    table: 'events',
    label: 'События',
    description: 'Контрольные, дедлайны, экзамены',
    defaultChecked: true,
  },
  {
    key: 'semester',
    table: 'semester_config',
    label: 'Настройки семестра',
    description: 'Название, даты, чётность',
    defaultChecked: true,
  },
  {
    key: 'teachers',
    table: 'teachers',
    label: 'Преподаватели',
    description: 'ФИО, контакты, консультации',
    defaultChecked: false,
  },
  {
    key: 'students',
    table: 'students',
    label: 'Студенты',
    description: 'Список группы, подгруппы',
    defaultChecked: false,
  },
];

interface PurgeDataDialogProps {
  open: boolean;
  onClose: () => void;
  onPurge: (tables: string[]) => Promise<void>;
}

export function PurgeDataDialog({ open, onClose, onPurge }: PurgeDataDialogProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PURGE_CATEGORIES.map((c) => [c.key, c.defaultChecked])),
  );
  const [loading, setLoading] = useState(false);

  function resetDefaults() {
    setSelected(Object.fromEntries(PURGE_CATEGORIES.map((c) => [c.key, c.defaultChecked])));
  }

  function toggle(key: string) {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const selectedTables = PURGE_CATEGORIES.filter((c) => selected[c.key]).map((c) => c.table);
  const selectedCount = selectedTables.length;

  const handlePurge = useCallback(async () => {
    if (selectedCount === 0) return;
    setLoading(true);
    try {
      await onPurge(selectedTables);
      resetDefaults();
      onClose();
    } catch {
      // error is handled by the caller via toast
    } finally {
      setLoading(false);
    }
  }, [selectedTables, selectedCount, onPurge, onClose]);

  // Reset state when dialog opens
  function handleClose() {
    if (loading) return;
    resetDefaults();
    onClose();
  }

  return (
    <AdminModal open={open} onClose={handleClose} title="Удалить данные" width="sm" footer={
      <>
        <button
          onClick={handleClose}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          onClick={handlePurge}
          disabled={selectedCount === 0 || loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          {loading ? 'Удаление…' : 'Удалить'}
        </button>
      </>
    }>
      {/* Warning */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 mb-5">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Выбранные данные будут удалены безвозвратно. Информация о расписании звонков не удаляется.
        </p>
      </div>

      {/* Checkboxes */}
      <div className="space-y-1">
        {PURGE_CATEGORIES.map((cat) => (
          <label
            key={cat.key}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selected[cat.key]}
              onChange={() => toggle(cat.key)}
              disabled={loading}
              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-red-500 focus:ring-red-500 accent-red-500"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{cat.label}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{cat.description}</p>
            </div>
          </label>
        ))}
      </div>
    </AdminModal>
  );
}
