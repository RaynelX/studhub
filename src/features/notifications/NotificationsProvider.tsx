import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import OneSignal from 'react-onesignal';
import { useSettings } from '../settings/SettingsProvider';
import { syncOnesignalTags } from './utils/onesignal-tags';

// ============================================================
// Типы
// ============================================================

export interface NotificationPrefs {
  schedule: boolean;    // Изменения расписания и пар
  events: boolean;      // События (контрольные, зачёты, экзамены)
  deadlines: boolean;   // Дедлайны
  homework: boolean;    // Домашние задания
  reminders: boolean;   // Напоминания о предстоящих событиях/дедлайнах
}

interface NotificationsContextValue {
  /** true if the browser permission is 'granted' and PushSubscription is active */
  isSubscribed: boolean;
  /** true if OneSignal has finished initializing */
  isReady: boolean;
  /** Current per-category notification preferences */
  prefs: NotificationPrefs;
  /** Enable all notifications — requests browser permission if not yet granted */
  enable: () => Promise<void>;
  /** Disable all notifications (opt-out without revoking permission) */
  disable: () => Promise<void>;
  /** Update a single preference; syncs tags immediately */
  updatePref: (key: keyof NotificationPrefs, value: boolean) => void;
}

// ============================================================
// Константы
// ============================================================

const PREFS_STORAGE_KEY = 'student_hub_notif_prefs-01';

const DEFAULT_PREFS: NotificationPrefs = {
  schedule: true,
  events: true,
  deadlines: true,
  homework: true,
  reminders: true,
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// ============================================================
// Утилиты
// ============================================================

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) } as NotificationPrefs;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

// ============================================================
// Провайдер
// ============================================================

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();

  const [isReady, setIsReady] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);

  // Prevent re-init on StrictMode double-mount
  const initRef = useRef(false);

  // ── Initialization ────────────────────────────────────────

  useEffect(() => {
    const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
    const safariWebId = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID as string | undefined;
    if (!appId || initRef.current) return;
    initRef.current = true;

    OneSignal.init({
      appId,
      ...(safariWebId ? { safari_web_id: safariWebId } : {}),
      serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/push/onesignal/' },
      allowLocalhostAsSecureOrigin: true,
    })
      .then(async () => {
        setIsReady(true);

        const subscribed =
          OneSignal.Notifications.permission &&
          Boolean(OneSignal.User.PushSubscription.id);
        setIsSubscribed(subscribed);

        // Sync tags for existing subscribers on every app load
        if (subscribed) {
          await syncOnesignalTags(settings, prefs);
        }

        // Keep isSubscribed in sync when subscription state changes
        OneSignal.User.PushSubscription.addEventListener(
          'change',
          (event: { current: { optedIn: boolean } }) => {
            setIsSubscribed(event.current.optedIn);
          },
        );
      })
      .catch(() => {
        // OneSignal unavailable (localhost HTTP, unsupported browser, etc.)
        setIsReady(false);
      });
    // settings and prefs intentionally omitted: init runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tag sync when settings or prefs change ────────────────

  useEffect(() => {
    if (!isSubscribed) return;
    void syncOnesignalTags(settings, prefs);
  }, [settings, prefs, isSubscribed]);

  // ── Actions ───────────────────────────────────────────────

  const enable = useCallback(async () => {
    if (!isReady) return;

    const granted = await OneSignal.Notifications.requestPermission();
    if (granted) {
      await OneSignal.User.PushSubscription.optIn();
      setIsSubscribed(true);
      await syncOnesignalTags(settings, prefs);
    }
  }, [isReady, settings, prefs]);

  const disable = useCallback(async () => {
    if (!isReady) return;
    await OneSignal.User.PushSubscription.optOut();
    setIsSubscribed(false);
  }, [isReady]);

  const updatePref = useCallback((key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      savePrefs(next);
      return next;
    });
  }, []);

  return (
    <NotificationsContext.Provider
      value={{ isSubscribed, isReady, prefs, enable, disable, updatePref }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// ============================================================
// Хук
// ============================================================

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications() must be used within <NotificationsProvider>');
  }
  return ctx;
}
