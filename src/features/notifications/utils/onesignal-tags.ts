import OneSignal from 'react-onesignal';
import type { StudentSettings } from '../../settings/SettingsProvider';
import type { NotificationPrefs } from '../NotificationsProvider';
import type { SubgroupCategoryDoc, SubgroupDoc } from '../../../database/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
// v4: захардкоженная тройка (тег `t`) заменена на тег на каждую категорию подгрупп
const MIGRATION_KEY = 'onesignal_tags_v4';

let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
let latestArgs: {
  settings: StudentSettings;
  prefs: NotificationPrefs;
  categories: SubgroupCategoryDoc[];
  subgroups: SubgroupDoc[];
} | null = null;

function encodePrefs(prefs: NotificationPrefs): string {
  return [
    prefs.schedule  ? '1' : '0',
    prefs.events    ? '1' : '0',
    prefs.deadlines ? '1' : '0',
    prefs.homework  ? '1' : '0',
    prefs.reminders ? '1' : '0',
  ].join('');
}

/**
 * По тегу на каждую активную категорию: `sg_<код категории> = <код подгруппы>`.
 * Коды стабильны, поэтому сегменты в OneSignal не ломаются при переименованиях.
 * Невыбранная категория отправляется с пустым значением — так снимается
 * устаревший тег, если студент сменил подгруппу.
 */
function buildTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
  categories: SubgroupCategoryDoc[],
  subgroups: SubgroupDoc[],
): Record<string, string> {
  const codeById = new Map(subgroups.map((s) => [s.id, s.code]));
  const tags: Record<string, string> = { n: encodePrefs(prefs) };

  for (const category of categories) {
    if (category.is_archived) continue;
    const selected = settings.subgroups[category.id];
    tags[`sg_${category.code}`] = (selected && codeById.get(selected)) || '';
  }

  return tags;
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
): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      '[onesignal-tags] Missing Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY; skipping tag update.',
    );
    return false;
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/onesignal-update-tags`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ onesignal_id: onesignalId, tags }),
    },
  );

  if (!response.ok) {
    console.error(`[onesignal-tags] ${response.status}: ${await response.text()}`);
    return false;
  }

  return true;
}

async function deleteOldTags(onesignalId: string): Promise<boolean> {
  console.log('[onesignal-tags] Deleting old tags...');
  return patchTags(onesignalId, {
    t: '', language: '', eng_subgroup: '', oit_subgroup: '',
    notif_schedule: '', notif_events: '', notif_deadlines: '',
    notif_homework: '', notif_reminders: '', test_tag: '',
    target: '', ns: '', ne: '', nd: '', nh: '', nr: '',
  });
}

async function updateTags(tags: Record<string, string>): Promise<boolean> {
  const onesignalId = getOnesignalId();
  if (!onesignalId) {
    console.warn('[onesignal-tags] No onesignal_id');
    return false;
  }

  const needsMigration = !localStorage.getItem(MIGRATION_KEY);

  if (needsMigration) {
    const deleted = await deleteOldTags(onesignalId);
    if (!deleted) return false;
    await new Promise((r) => setTimeout(r, 500));
  }

  const success = await patchTags(onesignalId, tags);

  if (success && needsMigration) {
    localStorage.setItem(MIGRATION_KEY, '1');
    console.log('[onesignal-tags] Migration complete');
  }

  return success;
}

async function flushTags(): Promise<void> {
  const args = latestArgs;
  latestArgs = null;
  if (!args) return;

  const tags = buildTags(args.settings, args.prefs, args.categories, args.subgroups);
  console.log('[onesignal-tags] Syncing:', tags);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const success = await updateTags(tags);
    if (success) {
      console.log('[onesignal-tags] ✅ Done');
      return;
    }
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  console.error('[onesignal-tags] ❌ Failed');
}

export function syncOnesignalTags(
  settings: StudentSettings,
  prefs: NotificationPrefs,
  categories: SubgroupCategoryDoc[],
  subgroups: SubgroupDoc[],
): void {
  latestArgs = { settings, prefs, categories, subgroups };
  if (pendingTimeout) clearTimeout(pendingTimeout);
  pendingTimeout = setTimeout(() => {
    pendingTimeout = null;
    void flushTags();
  }, 800);
}