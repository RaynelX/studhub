/**
 * onesignal-content-change
 *
 * Supabase Database Webhook handler.
 * Triggered on INSERT / UPDATE events for content tables:
 *   schedule_entries, schedule_overrides, events, deadlines, homeworks
 *
 * Required Supabase secrets:
 *   ONESIGNAL_APP_ID
 *   ONESIGNAL_REST_API_KEY
 *   WEBHOOK_SECRET  — sent in the "x-webhook-secret" header by Supabase webhooks
 *
 * Environment variables injected automatically by Supabase Edge Functions runtime:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  sendOnesignalNotification,
  buildTargetFilters,
  isAllTarget,
  type FilterEntry,
  type SendNotificationPayload,
} from './onesignal-api.ts';

// ============================================================
// Types
// ============================================================

type WebhookType = 'INSERT' | 'UPDATE' | 'DELETE';

interface WebhookPayload {
  type: WebhookType;
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

// ============================================================
// Entry point
// ============================================================

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Validate webhook secret to prevent unauthorized calls
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (secret) {
    const incomingSecret = req.headers.get('x-webhook-secret');
    if (incomingSecret !== secret) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json() as WebhookPayload;
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const { type, table, record } = payload;

  // Ignore DELETE events and soft-deleted records
  if (type === 'DELETE' || !record) {
    return new Response('OK', { status: 200 });
  }
  if (record.is_deleted === true) {
    return new Response('OK', { status: 200 });
  }

  // Route by table
  try {
    await handleTableEvent(type, table, record);
  } catch (err) {
    console.error('[content-change] Error handling event:', err);
    // Return 200 so Supabase doesn't retry indefinitely
    return new Response('OK', { status: 200 });
  }

  return new Response('OK', { status: 200 });
});

// ============================================================
// Table routing
// ============================================================

async function handleTableEvent(
  type: WebhookType,
  table: string,
  record: Record<string, unknown>,
): Promise<void> {
  switch (table) {
    case 'schedule_entries':
      if (type === 'INSERT') await notifyScheduleEntry(record);
      break;
    case 'schedule_overrides':
      await notifyScheduleOverride(type, record);
      break;
    case 'events':
      await notifyEvent(type, record);
      break;
    case 'deadlines':
      await notifyDeadline(type, record);
      break;
    case 'homeworks':
      await notifyHomework(type, record);
      break;
    default:
      break;
  }
}

// ============================================================
// Helpers
// ============================================================

/** Fetch a subject's short_name (or name) from Supabase. */
async function getSubjectName(subjectId: string | null | undefined): Promise<string> {
  if (!subjectId) return '';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data } = await supabase
    .from('subjects')
    .select('short_name, name')
    .eq('id', subjectId)
    .single();

  if (!data) return '';
  return (data.short_name as string) || (data.name as string) || '';
}

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

/** Truncate text to maxLen characters with ellipsis. */
function truncate(text: string, maxLen = 80): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen - 1) + '…';
}

/** Format a date string (YYYY-MM-DD) to Russian locale. */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return iso;
  }
}

const PAIR_LABELS: Record<number, string> = {
  1: '1-я пара',
  2: '2-я пара',
  3: '3-я пара',
  4: '4-я пара',
  5: '5-я пара',
  6: '6-я пара',
};

function pairLabel(num: unknown): string {
  return PAIR_LABELS[num as number] ?? `Пара ${num}`;
}

/** Build targeting payload for a OneSignal notification. */
function makeTargeting(
  record: Record<string, unknown>,
  notifPrefTag: string,
): Pick<SendNotificationPayload, 'filters' | 'included_segments'> {
  const lang = str(record.target_language) || 'all';
  const eng = str(record.target_eng_subgroup) || 'all';
  const oit = str(record.target_oit_subgroup) || 'all';

  // Broadcast to all subscribed users when targeting is universal
  if (isAllTarget(lang, oit)) {
    // Still respect per-category opt-out via filters
    const filters: FilterEntry[] = [
      { field: 'tag', key: notifPrefTag, relation: '!=', value: '0' },
    ];
    return { filters };
  }

  return { filters: buildTargetFilters(lang, eng, oit, notifPrefTag) };
}

// ============================================================
// Per-table notification builders
// ============================================================

async function notifyScheduleEntry(record: Record<string, unknown>): Promise<void> {
  const subjectName = await getSubjectName(str(record.subject_id));
  const label = subjectName ? `«${subjectName}»` : 'Новая пара';

  await sendOnesignalNotification({
    headings: { en: '📅 Добавлена новая пара' },
    contents: { en: truncate(`${label} добавлена в расписание`) },
    url: '/',
    ...makeTargeting(record, 'notif_schedule'),
  });
}

async function notifyScheduleOverride(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const overrideType = str(record.override_type);
  const date = str(record.date);
  const pair = record.pair_number;
  const formattedDate = formatDate(date);
  const pairStr = pairLabel(pair);

  let heading = '📅 Изменение в расписании';
  let body = '';

  switch (overrideType) {
    case 'cancel':
      heading = '📅 Пара отменена';
      body = `${pairStr}, ${formattedDate} — занятие отменено`;
      break;
    case 'replace': {
      const subjectName = await getSubjectName(str(record.subject_id));
      heading = '📅 Замена пары';
      body = subjectName
        ? `${pairStr}, ${formattedDate} — замена на «${subjectName}»`
        : `${pairStr}, ${formattedDate} — замена пары`;
      break;
    }
    case 'add': {
      const subjectName = await getSubjectName(str(record.subject_id));
      heading = '📅 Добавлена пара';
      body = subjectName
        ? `${pairStr}, ${formattedDate} — добавлена «${subjectName}»`
        : `${pairStr}, ${formattedDate} — добавлена пара`;
      break;
    }
    default: {
      const comment = str(record.comment);
      body = comment
        ? truncate(`${pairStr}, ${formattedDate}: ${comment}`)
        : `${pairStr}, ${formattedDate}`;
    }
  }

  if (type === 'UPDATE') {
    heading = `${heading} (обновлено)`;
  }

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/schedule',
    ...makeTargeting(record, 'notif_schedule'),
  });
}

async function notifyEvent(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const title = str(record.title) || str(record.description) || 'Событие';
  const date = str(record.date);
  const formattedDate = formatDate(date);

  const eventTypeLabels: Record<string, string> = {
    control_work: '📝 Контрольная работа',
    credit: '📋 Зачёт',
    exam: '🎓 Экзамен',
    consultation: '💬 Консультация',
    usr: '📌 Событие',
    other: '📌 Событие',
  };

  const eventType = str(record.event_type) || 'other';
  const heading = type === 'INSERT'
    ? (eventTypeLabels[eventType] ?? '📌 Событие')
    : '📌 Событие обновлено';

  const body = truncate(`${title} — ${formattedDate}`);

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/more/calendar',
    ...makeTargeting(record, 'notif_events'),
  });
}

async function notifyDeadline(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const subjectName = await getSubjectName(str(record.subject_id));
  const description = str(record.description);
  const date = str(record.date);
  const formattedDate = formatDate(date);

  const heading = type === 'INSERT' ? '⏰ Новый дедлайн' : '⏰ Дедлайн изменён';
  const subjectPart = subjectName ? `«${subjectName}»` : 'Дедлайн';
  const body = description
    ? truncate(`${subjectPart}: ${description} — ${formattedDate}`)
    : truncate(`${subjectPart} — ${formattedDate}`);

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/more/calendar',
    ...makeTargeting(record, 'notif_deadlines'),
  });
}

async function notifyHomework(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const subjectName = await getSubjectName(str(record.subject_id));
  const content = str(record.content);

  const heading = type === 'INSERT' ? '📝 Домашнее задание' : '📝 ДЗ обновлено';
  const subjectPart = subjectName ? `«${subjectName}»` : '';
  const body = subjectPart
    ? truncate(`${subjectPart}: ${content}`)
    : truncate(content);

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/',
    ...makeTargeting(record, 'notif_homework'),
  });
}
