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
// Types
// ============================================================

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  date: string;
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

  // Validate cron secret
  const secret = Deno.env.get('CRON_SECRET');
  if (secret) {
    const incoming = req.headers.get('x-cron-secret');
    if (incoming !== secret) {
      return new Response('Unauthorized', { status: 401 });
    }
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
    .select('id, title, description, event_type, date, event_time, room, target_language, target_eng_subgroup, target_oit_subgroup')
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

const EVENT_TYPE_PREFIX: Record<string, string> = {
  control_work: '📝 Контрольная',
  credit: '📋 Зачёт',
  exam: '🎓 Экзамен',
  consultation: '💬 Консультация',
  usr: '📌',
  other: '📌',
};

async function sendEventReminder(event: EventRow): Promise<void> {
  const typePrefix = EVENT_TYPE_PREFIX[event.event_type] ?? '📌';
  const title = event.title || event.description || 'Событие';
  const timePart = event.event_time
    ? ` в ${event.event_time.slice(0, 5)}`
    : '';
  const roomPart = event.room ? `, ауд. ${event.room}` : '';

  await sendOnesignalNotification({
    headings: { en: `${typePrefix} Напоминание на завтра` },
    contents: { en: `${title}${timePart}${roomPart}` },
    url: '/more/calendar',
    ...makeTargeting(event, 'notif_reminders'),
  });
}

async function sendDeadlineReminder(
  deadline: DeadlineRow,
  subjectMap: Record<string, string>,
): Promise<void> {
  const subjectName = deadline.subject_id ? subjectMap[deadline.subject_id] : null;
  const timePart = deadline.time ? ` до ${deadline.time.slice(0, 5)}` : '';
  const description = deadline.description ?? '';

  const contentsBase = subjectName
    ? `«${subjectName}»${timePart}${description ? ': ' + description : ''}`
    : `${description || 'Сдать работу'}${timePart}`;

  await sendOnesignalNotification({
    headings: { en: '⚠️ Дедлайн завтра' },
    contents: { en: contentsBase.length > 80 ? contentsBase.slice(0, 79) + '…' : contentsBase },
    url: '/more/calendar',
    ...makeTargeting(deadline, 'notif_reminders'),
  });
}
