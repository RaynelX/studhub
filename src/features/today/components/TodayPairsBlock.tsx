import { useNavigate } from 'react-router-dom';
import type { TodayScheduleData } from '../hooks/use-today-schedule';
import type { DaySlot } from '../../schedule/utils/schedule-builder';
import { useCurrentMinutes } from '../hooks/use-current-time';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';
import { getBellSlot } from '../../../shared/constants/bell-schedule';
import { toISODate } from '../../schedule/utils/week-utils';

interface Props {
  data: TodayScheduleData;
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  lecture:   { label: 'Лек.',  className: 'bg-green-100 text-green-700 dark:bg-green-500/40 dark:text-green-300' },
  seminar:   { label: 'Сем.',  className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/40 dark:text-blue-300' },
  practice:  { label: 'Пр.',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/40 dark:text-orange-300' },
  other:     { label: 'Др.',   className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-300/40 dark:text-neutral-300' },
};

const EVENT_BADGE: Record<string, { label: string; className: string }> = {
  usr:           { label: 'УСР',    className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/40 dark:text-violet-300' },
  control_work:  { label: 'КР',     className: 'bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-300' },
  credit:        { label: 'Зачёт',  className: 'bg-teal-100 text-teal-700 dark:bg-teal-500/40 dark:text-teal-300' },
  exam:          { label: 'Экз.',   className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-300' },
  consultation:  { label: 'Конс.',  className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/40 dark:text-sky-300' },
  other:         { label: 'Соб.',   className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/40 dark:text-purple-300' },
};

type CurrentPairPhase = 'first-half' | 'inner-break' | 'second-half';

interface CurrentPairStatus {
  phase: CurrentPairPhase;
  progressPercent: number;
  remainingMinutes: number;
  remainingLabel: string;
  progressClassName: string;
}

interface BreakStatus {
  isInBreak: true;
  nextSlot: DaySlot;
  remainingMinutes: number;
  remainingLabel: string;
  progressPercent: number;
  progressClassName: string;
}

export function TodayPairsBlock({ data }: Props) {
  if (!data.hasPairsToday && !data.nextDay) {
    return (
      <Section title="Расписание">
        <EmptyCard text="Нет предстоящих пар" />
      </Section>
    );
  }

  if ((!data.hasPairsToday || data.allPairsFinished) && data.nextDay) {
    const nextDayTarget = `/schedule?date=${toISODate(data.nextDay.date)}`;

    return (
      <Section title={data.allPairsFinished ? 'Пары закончились · далее' : 'Сегодня пар нет · далее'}>
        <PairsCard
          pairs={data.nextDay.pairs}
          subtitle={`${data.nextDay.dayName}, ${formatDate(data.nextDay.date)}`}
          showCurrentPair={false}
          targetPath={nextDayTarget}
        />
      </Section>
    );
  }

  return (
    <Section title="Расписание">
      <PairsCard
        pairs={data.todayPairs}
        subtitle={`${data.todayPairs.length} ${pluralPairs(data.todayPairs.length)} сегодня`}
        showCurrentPair={true}
        targetPath="/schedule"
      />
    </Section>
  );
}

// ============================================================
// Основная карточка
// ============================================================

function PairsCard({
  pairs,
  subtitle,
  showCurrentPair,
  targetPath,
}: {
  pairs: DaySlot[];
  subtitle: string;
  showCurrentPair: boolean;
  targetPath: string;
}) {
  const navigate = useNavigate();
  const currentMinutes = useCurrentMinutes();
  const rippleRef = useTouchRipple();

  // Проверяем, находимся ли в перерыве
  const breakStatus = showCurrentPair ? getBreakStatus(pairs, currentMinutes) : null;

  // Определяем текущую пару
  let currentIndex = -1;
  if (showCurrentPair && !breakStatus) {
    currentIndex = pairs.findIndex((slot) => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      return currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em;
    });
  }

  const currentSlot = currentIndex >= 0 ? pairs[currentIndex] : null;
  const nextSlot = currentIndex >= 0 ? pairs[currentIndex + 1] ?? null : null;

  const currentStatus = currentSlot
    ? getCurrentPairStatus(currentSlot, currentMinutes)
    : null;

  let breakMinutes: number | null = null;

  if (currentSlot && nextSlot) {
    const [eh, em] = currentSlot.endTime.split(':').map(Number);
    const [nsh, nsm] = nextSlot.startTime.split(':').map(Number);
    breakMinutes = (nsh * 60 + nsm) - (eh * 60 + em);
  }

  const currentNextLabel = currentStatus
    ? getCurrentNextLabel(currentStatus.phase, currentSlot, nextSlot, breakMinutes)
    : null;

  return (
    <div
      ref={rippleRef}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden cursor-pointer
                 transform-gpu active:scale-[0.98] transition-transform duration-75"
      onClick={() => navigate(targetPath)}
    >
      {/* Отображаем либо текущую пару, либо перерыв */}
      {breakStatus ? (
        <BreakBlock breakStatus={breakStatus} />
      ) : (
        <>
          {/* Текущая пара — крупный блок */}
          {currentSlot?.pair && (
            <div className="p-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
              <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1">
                Сейчас · {currentSlot.pairNumber} пара
              </p>

              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {currentSlot.pair.subjectName}
              </p>

              <div className="flex items-center gap-2 mt-1">
                {currentSlot.pair.teacherName && (
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    {currentSlot.pair.teacherName}
                  </span>
                )}
                {currentSlot.pair.room && (
                  <span className="text-sm text-neutral-400 dark:text-neutral-500 ml-auto">
                    {currentSlot.pair.room === 'ДОТ' ? 'ДОТ' : `ауд. ${currentSlot.pair.room}`}
                  </span>
                )}
              </div>

              {/* Оставшееся время */}
              {currentStatus && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                  {currentStatus.remainingLabel}
                </p>
              )}

              {/* Прогресс-бар */}
              <div className="mt-2 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full anim-progress-bar ${currentStatus?.progressClassName ?? 'bg-blue-500 dark:bg-blue-400'}`}
                  style={{ width: `${currentStatus?.progressPercent ?? 0}%` }}
                />
              </div>

              {/* Следующая пара */}
              {currentNextLabel && (
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
                  {currentNextLabel}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Список пар */}
      <div className="px-4 py-2">
        {!currentSlot && !breakStatus && (
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1 pt-1">
            {subtitle}
          </p>
        )}

        {(() => {
          const nextSlotIndex = showCurrentPair && breakStatus
            ? pairs.indexOf(breakStatus.nextSlot)
            : -1;
          return pairs.map((slot, i) => {
            const isPast = (showCurrentPair && (currentIndex >= 0 ? i < currentIndex : false)) as boolean;
            const isCurrent = (showCurrentPair && i === currentIndex) as boolean;
            const isBeforeBreak = (nextSlotIndex >= 0 && i === nextSlotIndex - 1) as boolean;
            const isAfterBreak = (nextSlotIndex >= 0 && i === nextSlotIndex) as boolean;

            return (
              <CompactPairRow
                key={slot.pairNumber}
                slot={slot}
                isPast={isPast}
                isCurrent={isCurrent}
                isBeforeBreak={isBeforeBreak}
                isAfterBreak={isAfterBreak}
              />
            );
          });
        })()}
      </div>
    </div>
  );
}

// ============================================================
// Блок перерыва между парами
// ============================================================

function BreakBlock({ breakStatus }: { breakStatus: BreakStatus }) {
  const nextSlot = breakStatus.nextSlot;
  const nextPair = nextSlot.pair;

  if (!nextPair) return null;

  const isEvent = nextPair.status === 'event';
  const badge = isEvent && nextPair.eventType
    ? EVENT_BADGE[nextPair.eventType] ?? EVENT_BADGE.other
    : nextPair.entryType
      ? TYPE_BADGE[nextPair.entryType] ?? TYPE_BADGE.other
      : null;

  return (
    <div className="p-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
      <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-2">
        Перерыв · {nextSlot.pairNumber} пара начинается
      </p>

      <div className="flex items-center gap-2 mb-2">
        {badge && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${badge.className}`}>
            {badge.label}
          </span>
        )}
        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex-1">
          {nextPair.subjectName}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {nextPair.teacherName && (
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {nextPair.teacherName}
          </span>
        )}
        {nextPair.room && (
          <span className="text-sm text-neutral-400 dark:text-neutral-500 ml-auto">
            {nextPair.room === 'ДОТ' ? 'ДОТ' : `ауд. ${nextPair.room}`}
          </span>
        )}
      </div>

      {/* Оставшееся время до следующей пары */}
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
        {breakStatus.remainingLabel}
      </p>

      {/* Прогресс-бар перерыва */}
      <div className="mt-2 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full anim-progress-bar ${breakStatus.progressClassName}`}
          style={{ width: `${breakStatus.progressPercent}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Компактная строка пары
// ============================================================

function CompactPairRow({
  slot,
  isPast,
  isCurrent,
  isBeforeBreak,
  isAfterBreak,
}: {
  slot: DaySlot;
  isPast: boolean;
  isCurrent: boolean;
  isBeforeBreak?: boolean;
  isAfterBreak?: boolean;
}) {
  if (!slot.pair) return null;
  const pair = slot.pair;
  const isCancelled = pair.status === 'cancelled';
  const isEvent = pair.status === 'event';

  const badge = isEvent && pair.eventType
    ? EVENT_BADGE[pair.eventType] ?? EVENT_BADGE.other
    : pair.entryType
      ? TYPE_BADGE[pair.entryType] ?? TYPE_BADGE.other
      : null;

  return (
    <div
      className={`
        flex items-center gap-2 py-2
        ${isCancelled ? 'opacity-40' : ''}
        ${isPast ? 'opacity-30' : ''}
        ${isCurrent ? 'opacity-50' : ''}
        ${isBeforeBreak ? 'opacity-50' : ''}
        ${isAfterBreak ? 'opacity-50' : ''}
      `}
    >
      {/* Номер */}
      <span className="text-sm text-neutral-400 dark:text-neutral-500 w-5 shrink-0 tabular-nums">
        {slot.pairNumber}
      </span>

      {/* Бейдж */}
      {badge && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      )}

      {/* Название */}
      <span
        className={`text-sm flex-1 truncate ${
          isCancelled
            ? 'line-through text-neutral-400 dark:text-neutral-500'
            : 'text-neutral-800 dark:text-neutral-200'
        }`}
      >
        {pair.subjectName}
      </span>

      {/* Аудитория */}
      {!isCancelled && pair.room && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500 shrink-0">
          {pair.room === 'ДОТ' ? 'ДОТ' : pair.room}
        </span>
      )}

      {/* Отмена */}
      {isCancelled && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 shrink-0">
          Отм.
        </span>
      )}
    </div>
  );
}

// ============================================================
// Утилиты
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  const rippleRef = useTouchRipple();
  return (
    <div ref={rippleRef} className="relative p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function pluralPairs(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'пара';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'пары';
  return 'пар';
}

function getCurrentPairStatus(slot: DaySlot, currentMinutes: number): CurrentPairStatus | null {
  const bell = getBellSlot(slot.pairNumber);
  if (!bell) return null;

  const startMinutes = toMinutes(bell.startTime);
  const breakStartMinutes = toMinutes(bell.breakStart);
  const breakEndMinutes = toMinutes(bell.breakEnd);
  const endMinutes = toMinutes(bell.endTime);

  if (currentMinutes < breakStartMinutes) {
    return {
      phase: 'first-half',
      progressPercent: calculateProgress(currentMinutes, startMinutes, breakStartMinutes),
      remainingMinutes: breakStartMinutes - currentMinutes,
      remainingLabel: `Осталось ${breakStartMinutes - currentMinutes} мин · до ${bell.breakStart}`,
      progressClassName: 'bg-blue-500 dark:bg-blue-400',
    };
  }

  if (currentMinutes < breakEndMinutes) {
    return {
      phase: 'inner-break',
      progressPercent: calculateProgress(currentMinutes, breakStartMinutes, breakEndMinutes),
      remainingMinutes: breakEndMinutes - currentMinutes,
      remainingLabel: `Перерыв ${breakEndMinutes - currentMinutes} мин · до ${bell.breakEnd}`,
      progressClassName: 'bg-amber-500 dark:bg-amber-400',
    };
  }

  return {
    phase: 'second-half',
    progressPercent: calculateProgress(currentMinutes, breakEndMinutes, endMinutes),
    remainingMinutes: endMinutes - currentMinutes,
    remainingLabel: `Осталось ${endMinutes - currentMinutes} мин · до ${bell.endTime}`,
    progressClassName: 'bg-blue-500 dark:bg-blue-400',
  };
}

function getCurrentNextLabel(
  phase: CurrentPairPhase,
  currentSlot: DaySlot | null,
  nextSlot: DaySlot | null,
  breakMinutes: number | null,
): string | null {
  if (phase === 'first-half') {
    return 'Далее: перерыв 5 мин';
  }

  if (phase === 'inner-break') {
    return currentSlot?.pair ? `Далее: ${currentSlot.pair.subjectName}` : 'Далее: вторая половина пары';
  }

  if (nextSlot?.pair && breakMinutes !== null) {
    return `Далее: ${nextSlot.pair.subjectName} · перерыв ${breakMinutes} мин`;
  }

  return null;
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateProgress(currentMinutes: number, startMinutes: number, endMinutes: number): number {
  const total = endMinutes - startMinutes;
  if (total <= 0) return 0;

  const elapsed = Math.min(Math.max(currentMinutes - startMinutes, 0), total);
  return Math.round((elapsed / total) * 100);
}

function getBreakStatus(
  pairs: DaySlot[],
  currentMinutes: number,
): BreakStatus | null {
  for (let i = 0; i < pairs.length - 1; i++) {
    const currentSlot = pairs[i];
    const nextSlot = pairs[i + 1];

    if (!currentSlot || !nextSlot) continue;

    const [eh, em] = currentSlot.endTime.split(':').map(Number);
    const breakStartMinutes = eh * 60 + em;
    const breakEndMinutes = toMinutes(nextSlot.startTime);

    if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
      return {
        isInBreak: true,
        nextSlot,
        remainingMinutes: breakEndMinutes - currentMinutes,
        remainingLabel: `Перерыв ${breakEndMinutes - currentMinutes} мин · до ${nextSlot.startTime}`,
        progressPercent: calculateProgress(currentMinutes, breakStartMinutes, breakEndMinutes),
        progressClassName: 'bg-amber-500 dark:bg-amber-400',
      };
    }
  }

  return null;
}