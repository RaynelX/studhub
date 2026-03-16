import { Bell, BellOff, Calendar, BookOpen, Clock, FileText, AlarmClock } from 'lucide-react';
import { useNotifications, type NotificationPrefs } from '../NotificationsProvider';
import { Section } from '../../../shared/ui/Section';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';
import { IosInstallPrompt } from './ios-install-prompt';

// ============================================================
// Категории уведомлений
// ============================================================

const CATEGORIES: {
  key: keyof NotificationPrefs;
  label: string;
  description: string;
  icon: typeof Bell;
}[] = [
  {
    key: 'schedule',
    label: 'Расписание',
    description: 'Изменения, замены и отмены пар',
    icon: Calendar,
  },
  {
    key: 'events',
    label: 'События',
    description: 'Контрольные, зачёты, экзамены',
    icon: BookOpen,
  },
  {
    key: 'deadlines',
    label: 'Дедлайны',
    description: 'Новые и изменённые дедлайны',
    icon: Clock,
  },
  {
    key: 'homework',
    label: 'Домашние задания',
    description: 'Новые и обновлённые ДЗ',
    icon: FileText,
  },
  {
    key: 'reminders',
    label: 'Напоминания',
    description: 'Предстоящие события и дедлайны',
    icon: AlarmClock,
  },
];

// ============================================================
// Основной компонент
// ============================================================

export function NotificationSettings() {
  const { isSubscribed, isReady, prefs, enable, disable, updatePref } =
    useNotifications();

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  const isConfigured = Boolean(appId);

  // OneSignal not configured for this environment
  if (!isConfigured) {
    return (
      <Section title="Уведомления">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Push-уведомления не настроены в данной среде.
        </p>
      </Section>
    );
  }

  return (
    <Section title="Уведомления">
      <div className="space-y-3">
        {/* iOS guide: shown when on iOS and not running as PWA */}
        <IosInstallPrompt />

        {/* Master toggle */}
        <MasterToggle
          isSubscribed={isSubscribed}
          isReady={isReady}
          onEnable={enable}
          onDisable={disable}
        />

        {/* Category toggles — only shown when subscribed */}
        {isSubscribed && (
          <div className="pt-1 space-y-0 divide-y divide-gray-100 dark:divide-neutral-800">
            {CATEGORIES.map(({ key, label, description, icon: Icon }) => (
              <CategoryRow
                key={key}
                icon={Icon}
                label={label}
                description={description}
                enabled={prefs[key]}
                onToggle={(val) => updatePref(key, val)}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ============================================================
// Главный переключатель
// ============================================================

function MasterToggle({
  isSubscribed,
  isReady,
  onEnable,
  onDisable,
}: {
  isSubscribed: boolean;
  isReady: boolean;
  onEnable: () => Promise<void>;
  onDisable: () => Promise<void>;
}) {
  const rippleRef = useTouchRipple<HTMLButtonElement>({ stopPropagation: true });

  const handleToggle = async () => {
    if (isSubscribed) {
      await onDisable();
    } else {
      await onEnable();
    }
  };

  return (
    <button
      ref={rippleRef}
      onClick={() => void handleToggle()}
      disabled={!isReady}
      aria-pressed={isSubscribed}
      className={`relative w-full flex items-center gap-3 py-1 rounded-xl text-left transition-opacity
        ${!isReady ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isSubscribed
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
            : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
          }`}
      >
        {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {isSubscribed ? 'Уведомления включены' : 'Уведомления выключены'}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          {isSubscribed
            ? 'Нажмите, чтобы отключить'
            : 'Нажмите, чтобы включить'}
        </p>
      </div>
      {/* Toggle switch */}
      <ToggleSwitch checked={isSubscribed} />
    </button>
  );
}

// ============================================================
// Строка категории
// ============================================================

function CategoryRow({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  const rippleRef = useTouchRipple<HTMLButtonElement>({ stopPropagation: true });

  return (
    <button
      ref={rippleRef}
      onClick={() => onToggle(!enabled)}
      className="relative w-full flex items-center gap-3 py-3 text-left"
      aria-pressed={enabled}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          ${enabled
            ? 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
          }`}
      >
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${
          enabled
            ? 'text-neutral-900 dark:text-neutral-100'
            : 'text-neutral-400 dark:text-neutral-500'
        }`}>
          {label}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
          {description}
        </p>
      </div>
      <ToggleSwitch checked={enabled} small />
    </button>
  );
}

// ============================================================
// Toggle switch UI primitive
// ============================================================

function ToggleSwitch({ checked, small = false }: { checked: boolean; small?: boolean }) {
  const trackW = small ? 'w-9' : 'w-11';
  const trackH = small ? 'h-5' : 'h-6';
  const thumbSize = small ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const thumbOff = small ? 'translate-x-0.5' : 'translate-x-1';
  const thumbOn = small ? 'translate-x-[18px]' : 'translate-x-[22px]';

  return (
    <div
      className={`flex-shrink-0 ${trackW} ${trackH} rounded-full transition-colors duration-200
        ${checked
          ? 'bg-blue-500 dark:bg-blue-600'
          : 'bg-neutral-300 dark:bg-neutral-600'
        }`}
    >
      <div
        className={`${thumbSize} bg-white rounded-full shadow mt-[3px] transform transition-transform duration-200
          ${checked ? thumbOn : thumbOff}`}
        style={{ marginTop: small ? '3px' : '4px' }}
      />
    </div>
  );
}
