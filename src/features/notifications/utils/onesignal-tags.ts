import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string;
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string;
const MIGRATION_KEY = 'onesignal_tags_v3';

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let latestArgs: { settings: StudentSettings; prefs: NotificationPrefs } | null = null;

const debugLog: string[] = [];
export function getTagsDebugLog(): string[] {
  return [...debugLog];
}

function log(msg: string): void {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log('[onesignal-tags]', msg);
  debugLog.push(entry);
  if (debugLog.length > 30) debugLog.shift();
}

/**
 * Encode prefs as 5-char string: "11010"
 * Position: 0=schedule, 1=events, 2=deadlines, 3=homework, 4=reminders
 */
function encodePrefs(prefs: NotificationPrefs): string {
  return [
    prefs.schedule  ? '1' : '0',
    prefs.events    ? '1' : '0',
    prefs.deadlines ? '1' : '0',
    prefs.homework  ? '1' : '0',
    prefs.reminders ? '1' : '0',
  ].join('');
}

function buildTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
): Record<string, string> {
  return {
    t: `${settings.language}_${settings.eng_subgroup ?? 'x'}_${settings.oit_subgroup}`,
    n: encodePrefs(prefs),
  };
}

function getOnesignalId(): string | null | undefined {
  try {
    return OneSignal.User.onesignalId;
  } catch {
    return null;
  }
}

async function patchTags(
  onesignalId: string,
  tags: Record<string, string>,
): Promise<{ ok: boolean; status: number; body: string }> {
  const url = `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${onesignalId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({ properties: { tags } }),
  });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

async function deleteOldTags(onesignalId: string): Promise<boolean> {
  log('Deleting old tags...');
  const result = await patchTags(onesignalId, {
    language: '',
    eng_subgroup: '',
    oit_subgroup: '',
    notif_schedule: '',
    notif_events: '',
    notif_deadlines: '',
    notif_homework: '',
    notif_reminders: '',
    test_tag: '',
    target: '',
    ns: '',
    ne: '',
    nd: '',
    nh: '',
    nr: '',
    t0: '',
    t1: '',
    t2: '',
    t3: '',
    t4: '',
    t5: '',
  });
  log(`Delete: ${result.status}`);
  return result.ok || result.status === 202;
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

  const needsMigration = !localStorage.getItem(MIGRATION_KEY);

  if (needsMigration) {
    const deleted = await deleteOldTags(onesignalId);
    if (!deleted) {
      log('❌ Failed to delete old tags');
      return false;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const result = await patchTags(onesignalId, tags);
  log(`PATCH ${result.status}: ${result.body}`);

  if (result.ok || result.status === 202) {
    if (needsMigration) {
      localStorage.setItem(MIGRATION_KEY, '1');
      log('Migration complete');
    }
    return true;
  }

  return false;
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
      await new Promise((r) => setTimeout(r, 1000 * attempt));
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