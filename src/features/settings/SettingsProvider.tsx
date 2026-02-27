import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
  } from 'react';
  import { SettingsSetup } from './SettingsSetup';
  
  // ============================================================
  // Типы
  // ============================================================
  
  export interface StudentSettings {
    language: 'en' | 'de' | 'fr' | 'es';
    eng_subgroup: 'a' | 'b' | null;
    oit_subgroup: 'a' | 'b';
  }
  
  interface SettingsContextValue {
    settings: StudentSettings;
    updateSettings: (settings: StudentSettings) => void;
    resetSettings: () => void;
  }
  
  // ============================================================
  // Константы
  // ============================================================
  
  const STORAGE_KEY = 'student_hub_settings-01';
  const SettingsContext = createContext<SettingsContextValue | null>(null);
  
  // ============================================================
  // Утилиты
  // ============================================================
  
  function loadSettings(): StudentSettings | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
  
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'language' in parsed &&
        'oit_subgroup' in parsed &&
        ['en', 'de', 'fr', 'es'].includes((parsed as any).language) &&
        ['a', 'b'].includes((parsed as any).oit_subgroup)
      ) {
        return parsed as StudentSettings;
      }
      return null;
    } catch {
      return null;
    }
  }
  
  function saveSettings(settings: StudentSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
  
  // ============================================================
  // Провайдер
  // ============================================================
  
  export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<StudentSettings | null>(loadSettings);
  
    const updateSettings = useCallback((newSettings: StudentSettings) => {
      saveSettings(newSettings);
      setSettings(newSettings);
    }, []);
  
    const resetSettings = useCallback(() => {
      localStorage.removeItem(STORAGE_KEY);
      setSettings(null);
    }, []);
  
    if (!settings) {
      return (
        <div className="h-full">
          <SettingsSetup onComplete={updateSettings} />
        </div>
      );
    }
  
    return (
      <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
        <div className="h-full">
          {children}
        </div>
      </SettingsContext.Provider>
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