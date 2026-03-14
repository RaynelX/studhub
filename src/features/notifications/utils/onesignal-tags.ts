import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';

export async function syncOnesignalTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
): Promise<boolean> {
  const tags: Record<string, string> = {
    // Targeting
    language: settings.language,
    eng_subgroup: settings.eng_subgroup ?? 'none',
    oit_subgroup: settings.oit_subgroup,
    // Preferences
    notif_schedule: prefs.schedule ? '1' : '0',
    notif_events: prefs.events ? '1' : '0',
    notif_deadlines: prefs.deadlines ? '1' : '0',
    notif_homework: prefs.homework ? '1' : '0',
    notif_reminders: prefs.reminders ? '1' : '0',
  };

  try {
    console.log('[onesignal-tags] Syncing tags:', tags);
    await OneSignal.User.addTags(tags);
    console.log('[onesignal-tags] ✅ Tags synced successfully');
    return true;
  } catch (err) {
    console.error('[onesignal-tags] ❌ Failed to sync tags:', err);
    return false;
  }
}