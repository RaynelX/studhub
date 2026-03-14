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
  schedule: boolean;
  events: boolean;
  deadlines: boolean;
  homework: boolean;
  reminders: boolean;
}

interface NotificationsContextValue {
  isSubscribed: boolean;
  isReady: boolean;
  prefs: NotificationPrefs;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
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

  const initRef = useRef(false);

  // Храним актуальные значения в ref, чтобы не пересоздавать коллбэки
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

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
        console.log('[notifications] OneSignal initialized');

        // Проверяем подписку
        const permission = OneSignal.Notifications.permission;
        const optedIn = OneSignal.User.PushSubscription.optedIn;
        const subscribed = permission === true && optedIn === true;

        console.log('[notifications] Permission:', permission, 'OptedIn:', optedIn);
        setIsSubscribed(subscribed);

        if (subscribed) {
          await syncOnesignalTags(settingsRef.current, prefsRef.current);
        }

        OneSignal.User.PushSubscription.addEventListener(
          'change',
          (event: { current: { optedIn: boolean } }) => {
            const nowSubscribed = event.current.optedIn;
            console.log('[notifications] Subscription changed:', nowSubscribed);
            setIsSubscribed(nowSubscribed);

            // При повторной подписке — синхронизируем теги
            if (nowSubscribed) {
              void syncOnesignalTags(settingsRef.current, prefsRef.current);
            }
          },
        );
      })
      .catch((err) => {
        console.error('[notifications] OneSignal init failed:', err);
        setIsReady(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tag sync when settings or prefs change ────────────────

  useEffect(() => {
    if (!isSubscribed || !isReady) return;

    console.log('[notifications] Settings or prefs changed, syncing tags...');
    void syncOnesignalTags(settings, prefs);
  }, [settings, prefs, isSubscribed, isReady]);

  // ── Actions ───────────────────────────────────────────────

  const enable = useCallback(async () => {
    if (!isReady) return;

    try {
      const granted = await OneSignal.Notifications.requestPermission();
      console.log('[notifications] Permission result:', granted);

      if (granted) {
        await OneSignal.User.PushSubscription.optIn();
        setIsSubscribed(true);
        await syncOnesignalTags(settingsRef.current, prefsRef.current);
      }
    } catch (err) {
      console.error('[notifications] Enable failed:', err);
    }
  }, [isReady]);

  const disable = useCallback(async () => {
    if (!isReady) return;

    try {
      await OneSignal.User.PushSubscription.optOut();
      setIsSubscribed(false);
    } catch (err) {
      console.error('[notifications] Disable failed:', err);
    }
  }, [isReady]);

  const updatePref = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        savePrefs(next);
        console.log(`[notifications] Pref "${key}" → ${value}`);
        return next;
      });
      // useEffect [prefs] выше подхватит изменение и вызовет syncOnesignalTags
    },
    [],
  );

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