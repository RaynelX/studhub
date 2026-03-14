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

/**
 * Get the OneSignal subscription ID for the current browser.
 * This is the push subscription token that identifies this device.
 */
function getSubscriptionId(): string | null | undefined {
  try {
    return OneSignal.User.PushSubscription.id;
  } catch {
    return null;
  }
}

/**
 * Get the OneSignal onesignal_id (user-level ID).
 */
function getOnesignalId(): string | null | undefined {
  try {
    return OneSignal.User.onesignalId;
  } catch {
    return null;
  }
}

/**
 * Update tags via OneSignal REST API directly,
 * bypassing the broken SDK addTags method.
 */
async function updateTagsViaApi(tags: Record<string, string>): Promise<boolean> {
  const onesignalId = getOnesignalId();

  if (!onesignalId) {
    console.warn('[onesignal-tags] No onesignal_id available');
    return false;
  }

  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error('[onesignal-tags] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY env vars');
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
      tags,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[onesignal-tags] REST API error ${response.status}: ${text}`);
    return false;
  }

  console.log('[onesignal-tags] ✅ Tags updated via REST API');
  return true;
}

async function flushTags(): Promise<void> {
  const args = latestArgs;
  latestArgs = null;
  if (!args) return;

  const tags = buildTags(args.settings, args.prefs);

  // Стратегия: попробовать SDK, если 409 — использовать REST API
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt === 1) {
        // Попытка через SDK
        console.log('[onesignal-tags] Attempt 1: SDK addTags', tags);
        await OneSignal.User.addTags(tags);

        // Ждём немного и проверяем, не было ли 409
        // SDK не бросает ошибку на 409, поэтому ждём и проверяем
        await new Promise((r) => setTimeout(r, 1000));

        // Верификация: запрашиваем теги через API
        const verified = await verifyTags(tags);
        if (verified) {
          console.log('[onesignal-tags] ✅ SDK addTags verified');
          return;
        }

        console.warn('[onesignal-tags] SDK addTags not verified, falling back to REST API');
      }

      // Fallback: REST API
      console.log('[onesignal-tags] Attempt 2: REST API', tags);
      const success = await updateTagsViaApi(tags);
      if (success) return;

    } catch (err) {
      console.warn(`[onesignal-tags] Attempt ${attempt} error:`, err);
    }
  }

  console.error('[onesignal-tags] ❌ All attempts failed');
}

/**
 * Verify tags were actually saved by reading them back from OneSignal API.
 */
async function verifyTags(expectedTags: Record<string, string>): Promise<boolean> {
  const onesignalId = getOnesignalId();
  if (!onesignalId || !ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return false;

  try {
    const url = `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${onesignalId}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
    });

    if (!response.ok) return false;

    const data = await response.json();
    const serverTags = data?.properties?.tags ?? {};

    // Check if at least the notif_ tags match
    for (const [key, value] of Object.entries(expectedTags)) {
      if (key.startsWith('notif_') && serverTags[key] !== value) {
        console.log(`[onesignal-tags] Mismatch: ${key} expected="${value}" actual="${serverTags[key]}"`);
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Debounced tag sync.
 */
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