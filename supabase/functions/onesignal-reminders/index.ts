/**
 * onesignal-reminders
 *
 * Daily cron job — runs at 17:00 UTC (20:00 Minsk / UTC+3).
 * Queries tomorrow's events and deadlines, sends reminder notifications
 * to subscribed users who match the target subgroup/language.
 *
 * Schedule in Supabase Dashboard → Database → pg_cron:
 *   0 17 * * *
 *
 * Required Supabase secrets:
 *   ONESIGNAL_APP_ID
 *   ONESIGNAL_REST_API_KEY
 *   CRON_SECRET  — sent in "x-cron-secret" header from pg_net / scheduler
 *
 * Environment variables injected by Supabase runtime:
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

const MONTH_NAMES: Record<number, string> = {
  1: 'января', 2: 'февраля', 3: 'марта', 4: 'апреля',
  5: 'мая', 6: 'июня', 7: 'июля', 8: 'августа',
  9: 'сентября', 10: 'октября', 11: 'ноября', 12: 'декабря',
};

/** "3 февраля" */
function formatDayMonth(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth() + 1]}`;
}

/** "2-я пара (10:05)" */
function pairWithTime(num: number | null | undefined): string {
  if (!num) return '';
  const time = BELL_TIMES[num];
  return time ? `${num}-я пара (${time})` : `${num}-я пара`;
}

function truncate(text: string, maxLen = 100): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen - 1) + '…';
}

// ============================================================
// Types
// ============================================================

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  date: string;
  pair_number: number | null;
  event_time: string | null;
  room: string | null;
  target_language: string;
  target_eng_subgroup: string;
  target_oit_subgroup: string;
}

interface DeadlineRow {
  id: string;
  subject_id: string | null;
  date: string;
  time: string | null;
  description: string | null;
  target_language: string;
  target_eng_subgroup: string;
  target_oit_subgroup: string;
}

interface SubjectRow {
  id: string;
  short_name: string | null;
  name: string;
}

// ============================================================
// Entry point
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Validate auth: accept either x-cron-secret or a service-role Bearer token.
  // This lets pg_net call the function using the standard Supabase Authorization
  // header (no separate CRON_SECRET needed), while still supporting the dedicated
  // secret for external callers.
  const cronSecret = Deno.env.get('CRON_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const incomingCronSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const validCronSecret = cronSecret && incomingCronSecret === cronSecret;
  const validServiceRole = serviceRoleKey && bearerToken === serviceRoleKey;

  if (!validCronSecret && !validServiceRole) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await sendTomorrowReminders();
  } catch (err) {
    console.error('[reminders] Fatal error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});

// ============================================================
// Core logic
// ============================================================

async function sendTomorrowReminders(): Promise<void> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Tomorrow's date in UTC (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  console.log(`[reminders] Sending reminders for ${tomorrowStr}`);

  // ── Events ────────────────────────────────────────────────
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, description, event_type, date, pair_number, event_time, room, target_language, target_eng_subgroup, target_oit_subgroup')
    .eq('date', tomorrowStr)
    .eq('is_deleted', false);

  if (eventsError) {
    console.error('[reminders] Error fetching events:', eventsError.message);
  } else if (events) {
    for (const event of events as EventRow[]) {
      await sendEventReminder(event);
    }
  }

  // ── Deadlines ─────────────────────────────────────────────
  const { data: deadlines, error: deadlinesError } = await supabase
    .from('deadlines')
    .select('id, subject_id, date, time, description, target_language, target_eng_subgroup, target_oit_subgroup')
    .eq('date', tomorrowStr)
    .eq('is_deleted', false);

  if (deadlinesError) {
    console.error('[reminders] Error fetching deadlines:', deadlinesError.message);
  } else if (deadlines) {
    // Fetch all referenced subjects in one query
    const subjectIds = [
      ...new Set(
        (deadlines as DeadlineRow[])
          .map((d) => d.subject_id)
          .filter(Boolean) as string[],
      ),
    ];

    let subjectMap: Record<string, string> = {};
    if (subjectIds.length > 0) {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, short_name, name')
        .in('id', subjectIds);

      if (subjects) {
        subjectMap = Object.fromEntries(
          (subjects as SubjectRow[]).map((s) => [
            s.id,
            s.short_name ?? s.name,
          ]),
        );
      }
    }

    for (const deadline of deadlines as DeadlineRow[]) {
      await sendDeadlineReminder(deadline, subjectMap);
    }
  }
}

// ============================================================
// Notification senders
// ============================================================

function makeTargeting(
  record: { target_language: string; target_eng_subgroup: string; target_oit_subgroup: string },
  notifPrefTag: string,
): Pick<SendNotificationPayload, 'filters' | 'included_segments'> {
  const { target_language: lang, target_eng_subgroup: eng, target_oit_subgroup: oit } = record;

  if (isAllTarget(lang, oit)) {
    const filters: FilterEntry[] = [
      { field: 'tag', key: notifPrefTag, relation: '!=', value: '0' },
    ];
    return { filters };
  }

  return { filters: buildTargetFilters(lang, eng, oit, notifPrefTag) };
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  control_work: 'контрольная',
  credit:       'зачёт',
  exam:         'экзамен',
  consultation: 'консультация',
  usr:          'событие',
  other:        'событие',
};

async function sendEventReminder(event: EventRow): Promise<void> {
  const typeLabel = EVENT_TYPE_LABEL[event.event_type] ?? 'событие';
  // Capitalize first letter for heading
  const typeLabelCap = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
  const title = event.title || event.description || '';

  const heading = title
    ? `🔔 Завтра ${typeLabel}: ${title}`
    : `🔔 Завтра ${typeLabelCap}`;

  // Body: pair + time, room, description
  const pairStr = pairWithTime(event.pair_number);
  const roomPart = event.room ? ` · ауд. ${event.room}` : '';
  const firstLine = pairStr ? `${pairStr}${roomPart}` : '';
  const description = event.description ?? '';

  const bodyParts: string[] = [];
  if (firstLine) bodyParts.push(firstLine);
  if (description && description !== title) bodyParts.push(description);

  const body = truncate(bodyParts.join('\n') || formatDayMonth(event.date));

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/more/calendar',
    ...makeTargeting(event, 'notif_reminders'),
  });
}

async function sendDeadlineReminder(
  deadline: DeadlineRow,
  subjectMap: Record<string, string>,
): Promise<void> {
  const subjectName = deadline.subject_id ? subjectMap[deadline.subject_id] : null;
  const timePart = deadline.time ? ` (${deadline.time.slice(0, 5)})` : '';
  const dayMonth = formatDayMonth(deadline.date);
  const description = deadline.description ?? '';

  const heading = subjectName
    ? `🔔 Дедлайн завтра: ${subjectName}`
    : '🔔 Дедлайн завтра';

  const dueLine = `До ${dayMonth}${timePart}`;
  const body = description
    ? truncate(`${dueLine} — ${description}`)
    : dueLine;

  await sendOnesignalNotification({
    headings: { en: heading },
    contents: { en: body },
    url: '/more/calendar',
    ...makeTargeting(deadline, 'notif_reminders'),
  });
}
