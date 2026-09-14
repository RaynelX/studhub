import {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
    type ReactNode,
  } from 'react';
  import { SettingsSetup } from './SettingsSetup';
  import { SETTINGS_STORAGE_KEY } from './storage';
  import { useSubgroups } from '../targeting/SubgroupsProvider';
  import { useSync } from '../../database/sync/SyncProvider';
  import { missingRequiredCategories, pruneSelection } from '../../shared/targeting/match';
  import type { SubgroupSelection } from '../../shared/targeting/types';

  // ============================================================
  // Типы
  // ============================================================

  export interface StudentSettings {
    /** id категории подгрупп → id выбранной студентом подгруппы */
    subgroups: SubgroupSelection;
  }

  interface SettingsContextValue {
    settings: StudentSettings;
    updateSettings: (settings: StudentSettings) => void;
    resetSettings: () => void;
  }

  // ============================================================
  // Константы
  // ============================================================

  /** Захардкоженная тройка язык/англ./ОИТ — подгруппы выбираются заново */
  const LEGACY_STORAGE_KEY = 'student_hub_settings-01';
  const SettingsContext = createContext<SettingsContextValue | null>(null);

  // ============================================================
  // Утилиты
  // ============================================================

  function loadSettings(): StudentSettings | null {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);

      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;

      const stored = (parsed as { subgroups?: unknown }).subgroups;
      if (typeof stored !== 'object' || stored === null) return null;

      const subgroups: SubgroupSelection = {};
      for (const [categoryId, subgroupId] of Object.entries(stored as Record<string, unknown>)) {
        if (typeof subgroupId === 'string' && subgroupId !== '') {
          subgroups[categoryId] = subgroupId;
        }
      }

      return { subgroups };
    } catch {
      return null;
    }
  }

  function saveSettings(settings: StudentSettings): void {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 2, subgroups: settings.subgroups }),
    );
  }

  // ============================================================
  // Провайдер
  // ============================================================

  export function SettingsProvider({ children }: { children: ReactNode }) {
    const { index, loading } = useSubgroups();
    const { status } = useSync();
    const [settings, setSettings] = useState<StudentSettings | null>(loadSettings);

    const updateSettings = useCallback(
      (newSettings: StudentSettings) => {
        // Приводим выбор в согласованное состояние: убираем ссылки на исчезнувшие
        // подгруппы и выборы в категориях, переставших быть видимыми.
        // Пока категории не приехали, прунить нечем — сохраняем как есть.
        const subgroups =
          index.categories.length > 0
            ? pruneSelection(index, newSettings.subgroups)
            : newSettings.subgroups;

        const value: StudentSettings = { subgroups };
        saveSettings(value);
        setSettings(value);
      },
      [index],
    );

    const resetSettings = useCallback(() => {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      setSettings(null);
    }, []);

    // Обязательные категории, в которых студент ещё не выбрал подгруппу.
    // Непустой список означает, что староста завёл новую категорию уже после
    // того, как студент прошёл настройку.
    const missing = useMemo(
      () => (settings ? missingRequiredCategories(index, settings.subgroups) : []),
      [index, settings],
    );

    const contextValue = useMemo(
      () =>
        settings ? { settings, updateSettings, resetSettings } : null,
      [settings, updateSettings, resetSettings],
    );

    if (!settings || missing.length > 0) {
      // Первый запуск: спрашивать нечего, пока не приехал список подгрупп.
      // Ждём не бесконечно — если синхронизация не удалась, пускаем дальше.
      const syncSettled =
        status.state === 'success' || status.state === 'error' || status.state === 'offline';

      if (loading || (index.categories.length === 0 && !syncSettled)) {
        return <SubgroupsLoading />;
      }

      return (
        <div className="h-full">
          <SettingsSetup
            mode={settings ? 'complete' : 'full'}
            index={index}
            initialSelection={settings?.subgroups ?? {}}
            onComplete={updateSettings}
          />
        </div>
      );
    }

    return (
      <SettingsContext.Provider value={contextValue}>
        <div className="h-full">
          {children}
        </div>
      </SettingsContext.Provider>
    );
  }

  function SubgroupsLoading() {
    return (
      <div
        className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <p className="text-neutral-400">Загружаем список подгрупп…</p>
      </div>
    );
  }

  // ============================================================
  // Хук
  // ============================================================

  export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) {
      throw new Error('useSettings() must be used within <SettingsProvider>');
    }
    return ctx;
  }
