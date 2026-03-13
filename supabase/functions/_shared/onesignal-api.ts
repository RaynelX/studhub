/**
 * Shared OneSignal REST API client for Supabase Edge Functions.
 * Uses OneSignal's Create Notification endpoint with filter-based targeting.
 */

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

export interface OnesignalFilter {
  field: 'tag';
  key: string;
  relation: '=' | '!=' | '>' | '<';
  value: string;
}

export interface OnesignalOperator {
  operator: 'OR' | 'AND';
}

export type FilterEntry = OnesignalFilter | OnesignalOperator;

export interface SendNotificationPayload {
  headings: { en: string };
  contents: { en: string };
  /** Deep link URL opened when notification is tapped */
  url?: string;
  /** Filters for targeting (AND logic by default between consecutive entries) */
  filters?: FilterEntry[];
  /** Alternative: send to all subscribed users */
  included_segments?: string[];
  /** Web icon URL */
  chrome_web_icon?: string;
}

/**
 * Sends a push notification via OneSignal REST API.
 * Returns true on success, false if no recipients were found.
 */
export async function sendOnesignalNotification(
  payload: SendNotificationPayload,
): Promise<boolean> {
  const appId = Deno.env.get('ONESIGNAL_APP_ID');
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

  if (!appId || !apiKey) {
    console.error('[onesignal-api] Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY');
    return false;
  }

  const body = {
    app_id: appId,
    target_channel: 'push',
    ...payload,
  };

  const response = await fetch(ONESIGNAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[onesignal-api] HTTP ${response.status}: ${text}`);
    return false;
  }

  const json = await response.json() as { id?: string; recipients?: number };

  // OneSignal returns id='' and recipients=0 when no subscribers match
  if (!json.id) {
    console.warn('[onesignal-api] No recipients matched the filter criteria');
    return false;
  }

  console.log(`[onesignal-api] Sent notification id=${json.id} to ${json.recipients ?? '?'} recipients`);
  return true;
}

// ============================================================
// Targeting helpers
// ============================================================

/**
 * Builds an array of OneSignal filters to target the correct audience
 * based on the record's target_* fields and the notification preference tag.
 *
 * OneSignal tag absence semantics:
 *   tag != '0'  matches users WITHOUT the tag (opt-in by default) ✓
 *   tag != '0'  matches users with tag = '1' ✓
 *   tag != '0'  does NOT match users with tag = '0' ✓
 */
export function buildTargetFilters(
  targetLanguage: string,
  targetEngSubgroup: string,
  targetOitSubgroup: string,
  notifPrefTag: string,
): FilterEntry[] {
  const filters: FilterEntry[] = [];

  // Language filter — skip when targeting all languages
  if (targetLanguage !== 'all') {
    filters.push({ field: 'tag', key: 'language', relation: '=', value: targetLanguage });
  }

  // English subgroup — only relevant for English-language targets
  if (targetLanguage === 'en' && targetEngSubgroup !== 'all') {
    filters.push({ field: 'tag', key: 'eng_subgroup', relation: '=', value: targetEngSubgroup });
  }

  // OIT subgroup
  if (targetOitSubgroup !== 'all') {
    filters.push({ field: 'tag', key: 'oit_subgroup', relation: '=', value: targetOitSubgroup });
  }

  // Per-category opt-out filter (users with tag='0' are excluded)
  filters.push({ field: 'tag', key: notifPrefTag, relation: '!=', value: '0' });

  return filters;
}

/**
 * When targeting ALL users (all languages + all subgroups), use a segment
 * instead of filters for broader reach (includes users without tags set).
 */
export function isAllTarget(
  targetLanguage: string,
  targetOitSubgroup: string,
): boolean {
  return targetLanguage === 'all' && targetOitSubgroup === 'all';
}
