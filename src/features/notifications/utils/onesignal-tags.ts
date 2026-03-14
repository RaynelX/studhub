import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let latestTags: Record<string, string> | null = null;

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

async function flushTags(): Promise<void> {
  const tags = latestTags;
  latestTags = null;
  if (!tags) return;

  // Retry logic: OneSignal 409 means concurrent update
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[onesignal-tags] Sending tags (attempt ${attempt}):`, tags);
      await OneSignal.User.addTags(tags);
      console.log('[onesignal-tags] ✅ Tags synced successfully');
      return;
    } catch (err) {
      console.warn(`[onesignal-tags] Attempt ${attempt} failed:`, err);
      if (attempt < 3) {
        // Exponential backoff: 500ms, 1500ms
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  console.error('[onesignal-tags] ❌ Failed to sync tags after 3 attempts');
}

/**
 * Debounced tag sync.
 * Batches rapid changes (e.g. toggling multiple categories)
 * into a single API call after 600ms of inactivity.
 */
export function syncOnesignalTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
): void {
  latestTags = buildTags(settings, prefs);

  if (pendingTimeout) {
    clearTimeout(pendingTimeout);
  }

  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    void flushTags();
  }, 600);
}