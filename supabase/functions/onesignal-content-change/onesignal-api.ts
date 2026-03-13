/**
 * Local OneSignal client copy for this function.
 * Kept local to avoid bundling issues with sibling _shared imports.
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
  url?: string;
  filters?: FilterEntry[];
  included_segments?: string[];
  chrome_web_icon?: string;
}

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
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[onesignal-api] HTTP ${response.status}: ${text}`);
    return false;
  }

  const json = (await response.json()) as { id?: string; recipients?: number };
  if (!json.id) {
    console.warn('[onesignal-api] No recipients matched the filter criteria');
    return false;
  }

  console.log(`[onesignal-api] Sent notification id=${json.id} to ${json.recipients ?? '?'} recipients`);
  return true;
}

export function buildTargetFilters(
  targetLanguage: string,
  targetEngSubgroup: string,
  targetOitSubgroup: string,
  notifPrefTag: string,
): FilterEntry[] {
  const filters: FilterEntry[] = [];

  if (targetLanguage !== 'all') {
    filters.push({ field: 'tag', key: 'language', relation: '=', value: targetLanguage });
  }

  if (targetLanguage === 'en' && targetEngSubgroup !== 'all') {
    filters.push({ field: 'tag', key: 'eng_subgroup', relation: '=', value: targetEngSubgroup });
  }

  if (targetOitSubgroup !== 'all') {
    filters.push({ field: 'tag', key: 'oit_subgroup', relation: '=', value: targetOitSubgroup });
  }

  filters.push({ field: 'tag', key: notifPrefTag, relation: '!=', value: '0' });
  return filters;
}

export function isAllTarget(targetLanguage: string, targetOitSubgroup: string): boolean {
  return targetLanguage === 'all' && targetOitSubgroup === 'all';
}
