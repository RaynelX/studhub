import { motion } from 'motion/react';
import type { DaySlot, FloatingEvent } from '../utils/schedule-builder';
import { PairCard, WindowCard, FloatingEventCard } from './PairCard';
import { STAGGER_CONTAINER, STAGGER_ITEM, SPRING_SNAPPY } from '../../../shared/constants/motion';

interface Props {
  slots: DaySlot[];
  floatingEvents: FloatingEvent[];
  date: Date;
}

export function DaySchedule({ slots, floatingEvents, date }: Props) {
    // Находим диапазон непустых слотов
  const firstIdx = slots.findIndex((s) => s.pair !== null);
  const lastIdx = findLastIndex(slots, (s) => s.pair !== null);

  // Нет пар
  if (firstIdx === -1) {
    return (
      <div>
        {floatingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500">
            <p className="text-lg">Нет пар</p>
            <p className="text-sm mt-1">Свободный день</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2.5">
              События дня
            </p>
            <div className="space-y-2.5">
              {floatingEvents.map((event, i) => (
                <FloatingEventCard key={i} {...event} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Показываем от первой до последней непустой пары
  const visibleSlots = slots.slice(firstIdx, lastIdx + 1);

  return (
    <motion.div
      className="space-y-2.5"
      variants={STAGGER_CONTAINER}
      initial="initial"
      animate="animate"
    >
      {visibleSlots.map((slot) =>
        slot.pair ? (
          <motion.div key={slot.pairNumber} variants={STAGGER_ITEM} transition={SPRING_SNAPPY}>
            <PairCard
              pair={slot.pair}
              startTime={slot.startTime}
              endTime={slot.endTime}
              date={date}
            />
          </motion.div>
        ) : (
          <motion.div key={slot.pairNumber} variants={STAGGER_ITEM} transition={SPRING_SNAPPY}>
            <WindowCard
              pairNumber={slot.pairNumber}
              startTime={slot.startTime}
              endTime={slot.endTime}
            />
          </motion.div>
        ),
      )}

      {floatingEvents.length > 0 && (
        <motion.div className="mt-6" variants={STAGGER_ITEM} transition={SPRING_SNAPPY}>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2.5">
            События дня
          </p>
          <div className="space-y-2.5">
            {floatingEvents.map((event, i) => (
              <FloatingEventCard key={i} {...event} />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Array.findLastIndex polyfill для максимальной совместимости.
 */
function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}