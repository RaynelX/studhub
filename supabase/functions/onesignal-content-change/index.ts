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
// Bell schedule (mirrors src/shared/constants/bell-schedule.ts)
// ============================================================

const BELL_TIMES: Record<number, string> = {
  1: '08:30',
  2: '10:05',
  3: '11:50',
  4: '13:25',
  5: '15:10',
};

// ============================================================
// Russian locale helpers
// ============================================================

const DAY_NAMES_SHORT: Record<number, string> = {
  1: 'пн', 2: 'вт', 3: 'ср', 4: 'чт', 5: 'пт', 6: 'сб', 7: 'вс',
};

const MONTH_NAMES: Record<number, string> = {
  1: 'января', 2: 'февраля', 3: 'марта', 4: 'апреля',
  5: 'мая', 6: 'июня', 7: 'июля', 8: 'августа',
  9: 'сентября', 10: 'октября', 11: 'ноября', 12: 'декабря',
};

/** Day-of-week from ISO date string (1=Mon … 7=Sun), UTC-safe. */
function isoToDayOfWeek(isoDate: string): number {
  const d = new Date(isoDate + 'T00:00:00Z');
  const js = d.getUTCDay(); // 0=Sun
  return js === 0 ? 7 : js;
}

/** "3 февраля" */
function formatDayMonth(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth() + 1]}`;
}

/** "пн, 3 февраля" */
function formatDayShortDate(isoDate: string): string {
  const dow = isoToDayOfWeek(isoDate);
  return `${DAY_NAMES_SHORT[dow]}, ${formatDayMonth(isoDate)}`;
}

/** "2-я пара" */
function pairLabel(num: unknown): string {
  const n = Number(num);
  return isNaN(n) ? `Пара ${num}` : `${n}-я пара`;
}

/** "2-я пара (10:05)" */
function pairWithTime(num: unknown): string {
  const n = Number(num);
  const time = BELL_TIMES[n];
  return time ? `${n}-я пара (${time})` : pairLabel(num);
}

/** Truncate to maxLen chars with ellipsis. */
function truncate(text: string, maxLen = 100): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen - 1) + '…';
}

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
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

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

  if (type === 'DELETE' || !record) {
    return new Response('OK', { status: 200 });
  }
  if (record.is_deleted === true) {
    return new Response('OK', { status: 200 });
  }

  try {
    await handleTableEvent(type, table, record);
  } catch (err) {
    console.error('[content-change] Error handling event:', err);
    // Return 200 so Supabase doesn't retry indefinitely
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
// Supabase helpers
// ============================================================

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

async function getSubjectName(subjectId: string | null | undefined): Promise<string> {
  if (!subjectId) return '';
  const { data } = await getSupabase()
    .from('subjects')
    .select('short_name, name')
    .eq('id', subjectId)
    .single();
  if (!data) return '';
  return str(data.short_name) || str(data.name);
}

async function getTeacherName(teacherId: string | null | undefined): Promise<string> {
  if (!teacherId) return '';
  const { data } = await getSupabase()
    .from('teachers')
    .select('full_name')
    .eq('id', teacherId)
    .single();
  if (!data) return '';
  return str(data.full_name);
}

// ============================================================
// Targeting helper
// ============================================================

function makeTargeting(
  record: Record<string, unknown>,
  notifPrefTag: string,
): Pick<SendNotificationPayload, 'filters' | 'included_segments'> {
  const lang = str(record.target_language) || 'all';
  const eng = str(record.target_eng_subgroup) || 'all';
  const oit = str(record.target_oit_subgroup) || 'all';

  if (isAllTarget(lang, oit)) {
    const filters: FilterEntry[] = [
      { field: 'tag', key: notifPrefTag, relation: '!=', value: '0' },
    ];
    return { filters };
  }

  return { filters: buildTargetFilters(lang, eng, oit, notifPrefTag) };
}

// ============================================================
// schedule_entries — new recurring pair added
// ============================================================

async function notifyScheduleEntry(record: Record<string, unknown>): Promise<void> {
  const subjectName = await getSubjectName(str(record.subject_id));
  const heading = subjectName
    ? `📅 Новая пара: ${subjectName}`
    : '📅 Новая пара в расписании';
  const body = `${pairLabel(record.pair_number)} добавлена в расписание`;

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/schedule',
    ...makeTargeting(record, 'notif_schedule'),
  });
}

// ============================================================
// schedule_overrides
// ============================================================

async function notifyScheduleOverride(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const overrideType = str(record.override_type);
  const date = str(record.date);
  const pairNum = record.pair_number;
  const dayShortDate = formatDayShortDate(date);
  const pairTime = pairWithTime(pairNum);

  let heading = '';
  let body = '';

  switch (overrideType) {
    case 'cancel': {
      const subjectName = await getSubjectName(str(record.subject_id));
      heading = '🚫 Пара отменена';
      const subjectPart = subjectName ? `${subjectName} · ` : '';
      body = `${subjectPart}${dayShortDate} · ${pairTime}`;
      break;
    }
    case 'replace': {
      const subjectName = await getSubjectName(str(record.subject_id));
      const teacherName = await getTeacherName(str(record.teacher_id));
      const room = str(record.room);
      heading = `🔄 Замена пары: ${pairLabel(pairNum)}, ${dayShortDate}`;
      const details: string[] = [];
      if (subjectName) details.push(subjectName);
      if (teacherName) details.push(teacherName);
      if (room) details.push(`ауд. ${room}`);
      body = details.length > 0 ? `Замена: ${details.join(', ')}` : 'Замена пары';
      break;
    }
    case 'add': {
      const subjectName = await getSubjectName(str(record.subject_id));
      const teacherName = await getTeacherName(str(record.teacher_id));
      const room = str(record.room);
      heading = `📅 Добавлена пара: ${pairLabel(pairNum)}, ${dayShortDate}`;
      const details: string[] = [];
      if (subjectName) details.push(subjectName);
      if (teacherName) details.push(teacherName);
      if (room) details.push(`ауд. ${room}`);
      body = details.length > 0 ? details.join(', ') : 'Дополнительная пара';
      break;
    }
    default: {
      const comment = str(record.comment);
      heading = '📅 Изменение в расписании';
      body = comment
        ? truncate(`${pairLabel(pairNum)}, ${dayShortDate}: ${comment}`)
        : `${pairLabel(pairNum)}, ${dayShortDate}`;
    }
  }

  if (type === 'UPDATE') heading = `${heading} (обновлено)`;

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/schedule',
    ...makeTargeting(record, 'notif_schedule'),
  });
}

// ============================================================
// events
// ============================================================

const EVENT_TYPE_EMOJI: Record<string, string> = {
  control_work: '⚠️',
  credit:       '⚠️',
  exam:         '⚠️',
  consultation: '💬',
  usr:          '📌',
  other:        '📌',
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  control_work: 'Контрольная',
  credit:       'Зачёт',
  exam:         'Экзамен',
  consultation: 'Консультация',
  usr:          'Событие',
  other:        'Событие',
};

async function notifyEvent(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const eventType = str(record.event_type) || 'other';
  const emoji = EVENT_TYPE_EMOJI[eventType] ?? '📌';
  const typeLabel = EVENT_TYPE_LABEL[eventType] ?? 'Событие';

  const subjectName = await getSubjectName(str(record.subject_id));
  const date = str(record.date);
  const pairNum = record.pair_number;
  const room = str(record.room);
  const description = str(record.description);

  const subjectSuffix = subjectName ? `: ${subjectName}` : '';

  if (type === 'INSERT') {
    const heading = `${emoji} ${typeLabel}${subjectSuffix}`;
    const dayShortDate = formatDayShortDate(date);
    let firstLine = `${dayShortDate} · ${pairWithTime(pairNum)}`;
    if (room) firstLine += ` · ауд. ${room}`;
    const body = description
      ? truncate(`${firstLine}\n${description}`)
      : firstLine;

    await sendOnesignalNotification({
      headings: { en: heading },
      contents: { en: body },
      url: '/more/calendar',
      ...makeTargeting(record, 'notif_events'),
    });
  } else {
    // UPDATE = rescheduled
    const heading = `${emoji} ${typeLabel} перенесена${subjectSuffix}`;
    const body = `Новая дата: ${formatDayShortDate(date)} · ${pairWithTime(pairNum)}`;

    await sendOnesignalNotification({
      headings: { en: heading },
      contents: { en: body },
      url: '/more/calendar',
      ...makeTargeting(record, 'notif_events'),
    });
  }
}

// ============================================================
// deadlines
// ============================================================

async function notifyDeadline(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const subjectName = await getSubjectName(str(record.subject_id));
  const date = str(record.date);
  const time = str(record.time);
  const description = str(record.description);

  const subjectSuffix = subjectName ? `: ${subjectName}` : '';
  const dayMonth = formatDayMonth(date);
  const timePart = time ? ` (${time.slice(0, 5)})` : '';
  const dueLine = `До ${dayMonth}${timePart}`;

  if (type === 'INSERT') {
    const heading = `🔴 Новый дедлайн${subjectSuffix}`;
    const body = description
      ? truncate(`${dueLine} — ${description}`)
      : dueLine;

    await sendOnesignalNotification({
      headings: { en: heading },
      contents: { en: body },
      url: '/more/calendar',
      ...makeTargeting(record, 'notif_deadlines'),
    });
  } else {
    const heading = `🔴 Дедлайн изменён${subjectSuffix}`;
    const lines = [`Новый срок: ${dayMonth}${timePart}`];
    if (description) lines.push(description);

    await sendOnesignalNotification({
      headings: { en: heading },
      contents: { en: truncate(lines.join('\n')) },
      url: '/more/calendar',
      ...makeTargeting(record, 'notif_deadlines'),
    });
  }
}

// ============================================================
// homeworks
// ============================================================

async function notifyHomework(
  type: WebhookType,
  record: Record<string, unknown>,
): Promise<void> {
  const subjectName = await getSubjectName(str(record.subject_id));
  const content = str(record.content);
  const date = str(record.date);
  const pairNum = record.pair_number;

  const subjectSuffix = subjectName ? `: ${subjectName}` : '';
  const dueStr = date
    ? `К ${formatDayShortDate(date)} (${pairWithTime(pairNum)})`
    : pairWithTime(pairNum);

  if (type === 'INSERT') {
    const heading = `📝 Домашнее задание${subjectSuffix}`;
    const body = content
      ? truncate(`${dueStr} — ${content}`)
      : dueStr;

    await sendOnesignalNotification({
      headings: { en: heading },
      contents: { en: body },
      url: '/',
      ...makeTargeting(record, 'notif_homework'),
    });
  } else {
    const heading = `📝 Д/з обновлено${subjectSuffix}`;
    const body = `${dueStr} — задание изменено. Откройте приложение для деталей`;

    await sendOnesignalNotification({
      headings: { en: heading },
      contents: { en: body },
      url: '/',
      ...makeTargeting(record, 'notif_homework'),
    });
  }
}

