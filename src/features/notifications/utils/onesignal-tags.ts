import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string;
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string;

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let latestArgs: { settings: StudentSettings; prefs: NotificationPrefs } | null = null;

// ★ Диагностический лог — видимый на любом устройстве
const debugLog: string[] = [];

export function getTagsDebugLog(): string[] {
  return [...debugLog];
}

function log(msg: string): void {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log('[onesignal-tags]', msg);
  debugLog.push(entry);
  // Храним последние 20 записей
  if (debugLog.length > 20) debugLog.shift();
}

function buildTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
): Record<string, string> {
  return {
    language: settings.language,
    eng_subgroup: settings.eng_subgroup ?? 'none',
    oit_subgroup: settings.oit_subgroup,
    notif_schedule: prefs.schedule ? '1' : '0',
    notif_events: prefs.events ? '1' : '0',
    notif_deadlines: prefs.deadlines ? '1' : '0',
    notif_homework: prefs.homework ? '1' : '0',
    notif_reminders: prefs.reminders ? '1' : '0',
  };
}

function getOnesignalId(): string | null | undefined {
  try {
    return OneSignal.User.onesignalId;
  } catch {
    return null;
  }
}

async function updateTagsViaApi(tags: Record<string, string>): Promise<boolean> {
  const onesignalId = getOnesignalId();
  if (!onesignalId) {
    log(`❌ No onesignal_id available`);
    return false;
  }

  log(`onesignal_id: ${onesignalId}`);

  const url = `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${onesignalId}`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          tags,
        },
      }),
    });

    const text = await response.text();
    log(`PATCH ${response.status}: ${text}`);

    if (!response.ok) return false;

    // Верификация
    const checkResponse = await fetch(url, {
      headers: { 'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}` },
    });
    const checkData = await checkResponse.json();
    const serverTags = checkData?.properties?.tags;
    log(`Verify tags: ${JSON.stringify(serverTags)}`);

    return true;
  } catch (err) {
    log(`❌ Fetch error: ${err}`);
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

  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
  }

  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    void flushTags();
  }, 800);
}