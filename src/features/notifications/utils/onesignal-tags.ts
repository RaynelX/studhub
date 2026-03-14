import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string;
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string;

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let latestArgs: { settings: StudentSettings; prefs: NotificationPrefs } | null = null;

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
    console.warn('[onesignal-tags] No onesignal_id available');
    return false;
  }

  const url = `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${onesignalId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({
      // ★ ИСПРАВЛЕНИЕ: tags должны быть внутри properties
      properties: {
        tags,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[onesignal-tags] REST API error ${response.status}: ${text}`);
    return false;
  }

  return true;
}

async function flushTags(): Promise<void> {
  const args = latestArgs;
  latestArgs = null;
  if (!args) return;

  const tags = buildTags(args.settings, args.prefs);
  console.log('[onesignal-tags] Syncing tags:', tags);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const success = await updateTagsViaApi(tags);
    if (success) {
      console.log('[onesignal-tags] ✅ Tags synced');
      return;
    }
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  console.error('[onesignal-tags] ❌ Failed after 3 attempts');
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