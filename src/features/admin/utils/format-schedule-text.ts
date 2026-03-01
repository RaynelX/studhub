import type { GridCell } from '../hooks/use-week-grid';
import { ENTRY_TYPE_LABELS, OVERRIDE_TYPE_LABELS, formatSubgroupCompact } from '../../../shared/constants/admin-labels';
import { DAY_NAMES } from '../../../shared/constants/days';
import { BELL_SCHEDULE } from '../../../shared/constants/bell-schedule';

/**
 * Format a week's schedule grid into a plain-text string
 * suitable for pasting into Telegram/VK group chats.
 *
 * Format:
 *   📅 Расписание на 24.02 – 01.03
 *
 *   📌 Понедельник, 24.02
 *   1) 08:30–09:50 · Математика (Лекция) · ауд. 305
 *   2) 10:00–11:20 · Информатика (Практика) · ауд. 410
 *   ❌ 3 пара — ОТМЕНА
 *   🔄 4 пара — Замена: Физика → Химия · ауд. 201
 */
export function formatWeekScheduleText(
  cells: GridCell[][],
  mondayDate: Date,
): string {
  const lines: string[] = [];

  // Header
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(sundayDate.getDate() + 5); // Saturday
  lines.push(`📅 Расписание на ${fmtDate(mondayDate)} – ${fmtDate(sundayDate)}`);

  // Days (Mon-Sat, index 0-5)
  for (let dayIdx = 0; dayIdx < cells.length; dayIdx++) {
    const dayCells = cells[dayIdx];
    const dayNum = dayIdx + 1; // 1=Mon
    const dayDate = new Date(mondayDate);
    dayDate.setDate(dayDate.getDate() + dayIdx);

    // Check if this day has any content
    const hasContent = dayCells.some(
      (c) => c.entries.length > 0 || c.overrides.length > 0 || c.events.length > 0,
    );
    if (!hasContent) continue;

    lines.push('');
    lines.push(`📌 ${DAY_NAMES[dayNum]}, ${fmtDate(dayDate)}`);

    for (const cell of dayCells) {
      const bell = BELL_SCHEDULE.find((b) => b.pairNumber === cell.pairNumber);
      const timeStr = bell ? `${bell.startTime}–${bell.endTime}` : '';

      // Overrides for this slot
      for (const go of cell.overrides) {
        const o = go.override;
        if (o.override_type === 'cancel') {
          lines.push(`❌ ${cell.pairNumber} пара — ОТМЕНА${o.comment ? ` (${o.comment})` : ''}`);
        } else {
          const label = OVERRIDE_TYPE_LABELS[o.override_type] ?? o.override_type;
          const subj = go.subject?.short_name ?? go.subject?.name ?? '';
          const room = o.room ? ` · ауд. ${o.room}` : '';
          const teacher = go.teacher ? ` · ${go.teacher.full_name}` : '';
          lines.push(`🔄 ${cell.pairNumber} пара — ${label}: ${subj}${room}${teacher}`);
        }
      }

      // Events
      for (const ge of cell.events) {
        const subj = ge.subject?.short_name ?? ge.subject?.name ?? '';
        lines.push(`📣 ${cell.pairNumber} пара — ${ge.event.title}${subj ? ` (${subj})` : ''}`);
      }

      // Base entries (skip if cancelled by override)
      for (const ge of cell.entries) {
        const isCancelled = cell.overrides.some(
          (o) => o.override.override_type === 'cancel',
        );
        if (isCancelled) continue;

        const subj = ge.subject?.short_name ?? ge.subject?.name ?? '—';
        const type = ENTRY_TYPE_LABELS[ge.entry.entry_type] ?? '';
        const room = ge.entry.room ? ` · ауд. ${ge.entry.room}` : '';
        const teacher = ge.teacher ? ` · ${ge.teacher.full_name}` : '';
        const subgroups = formatSubgroupCompact(ge.entry);
        const sgStr = subgroups ? ` [${subgroups}]` : '';

        lines.push(
          `${cell.pairNumber}) ${timeStr} · ${subj}${type ? ` (${type})` : ''}${room}${teacher}${sgStr}`,
        );
      }
    }
  }

  return lines.join('\n');
}

function fmtDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${d}.${m}`;
}
