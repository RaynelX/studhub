import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';

/**
 * Syncs all OneSignal user tags based on current student settings and
 * notification preferences. Called after init and whenever settings change.
 *
 * Tags are used by Supabase Edge Functions to filter notifications by
 * language, subgroup and per-category preferences.
 */
export async function syncOnesignalTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
): Promise<void> {
  try {
    await OneSignal.User.addTags({
      // Targeting tags — must match Supabase record's target_* fields
      language: settings.language,
      eng_subgroup: settings.eng_subgroup ?? 'none',
      oit_subgroup: settings.oit_subgroup,
      // Per-category notification preference tags
      // '0' = opted out, '1' = opted in (absent = opted in by default)
      notif_schedule: prefs.schedule ? '1' : '0',
      notif_events: prefs.events ? '1' : '0',
      notif_deadlines: prefs.deadlines ? '1' : '0',
      notif_homework: prefs.homework ? '1' : '0',
      notif_reminders: prefs.reminders ? '1' : '0',
    });
  } catch {
    // Tag sync failures are non-critical; ignore silently
  }
}
