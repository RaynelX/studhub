import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string;
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string;

const MIGRATION_KEY = 'onesignal_tags_v2_migrated';

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let latestArgs: {
  settings: StudentSettings;
  prefs: NotificationPrefs;
} | null = null;

// Debug log
const debugLog: string[] = [];
export function getTagsDebugLog(): string[] {
  return [...debugLog];
}
function log(msg: string): void {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log('[onesignal-tags]', msg);
  debugLog.push(entry);
  if (debugLog.length > 20) debugLog.shift();
}

function buildTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
): Record<string, string> {
  return {
    target: `${settings.language}_${settings.eng_subgroup ?? 'x'}_${settings.oit_subgroup}`,
    ns: prefs.schedule ? '1' : '0',
    ne: prefs.events ? '1' : '0',
    nd: prefs.deadlines ? '1' : '0',
    nh: prefs.homework ? '1' : '0',
    nr: prefs.reminders ? '1' : '0',
  };
}

function getOnesignalId(): string | null | undefined {
  try {
    return OneSignal.User.onesignalId;
  } catch {
    return null;
  }
}

async function updateTagsViaApi(
  tags: Record<string, string>,
): Promise<boolean> {
  const onesignalId = getOnesignalId();
  if (!onesignalId) {
    log('❌ No onesignal_id');
    return false;
  }

  log(`onesignal_id: ${onesignalId}`);

  const url = `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${onesignalId}`;

  // Если ещё не мигрировали — удаляем старые теги
  const needsMigration = !localStorage.getItem(MIGRATION_KEY);
  const allTags: Record<string, string> = needsMigration
    ? {
        // Удаляем старые ключи
        language: '',
        eng_subgroup: '',
        oit_subgroup: '',
        notif_schedule: '',
        notif_events: '',
        notif_deadlines: '',
        notif_homework: '',
        notif_reminders: '',
        test_tag: '',
        // Устанавливаем новые
        ...tags,
      }
    : tags;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        properties: { tags: allTags },
      }),
    });

    const text = await response.text();
    log(`PATCH ${response.status}: ${text}`);

    if (!response.ok) return false;

    if (needsMigration) {
      localStorage.setItem(MIGRATION_KEY, '1');
      log('Migration complete — old tags removed');
    }

    return true;
  } catch (err) {
    log(`❌ Error: ${err}`);
    return false;
  }
}

async function flushTags(): Promise<void> {
  const args = latestArgs;
  latestArgs = null;
  if (!args) return;

  const tags = buildTags(args.settings, args.prefs);
  log(`Syncing: ${JSON.stringify(tags)}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const success = await updateTagsViaApi(tags);
    if (success) {
      log('✅ Done');
      return;
    }
    if (attempt < 3) {
      log(`Retry ${attempt + 1}...`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  log('❌ All attempts failed');
}

export function syncOnesignalTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
): void {
  latestArgs = { settings, prefs };
  if (pendingTimeout) clearTimeout(pendingTimeout);
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    void flushTags();
  }, 800);
}