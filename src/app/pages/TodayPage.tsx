import { AnimatePresence, motion } from 'motion/react';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useTodaySchedule } from '../../features/today/hooks/use-today-schedule';
import { useUpcomingEvents } from '../../features/today/hooks/use-upcoming-events';
import { useSemesterProgress } from '../../features/today/hooks/use-semester-progress';
import { TodayPairsBlock } from '../../features/today/components/TodayPairsBlock';
import { UpcomingEventsBlock } from '../../features/today/components/UpcomingEventsBlock';
import { SemesterBlock } from '../../features/today/components/SemesterBlock';
import { FADE_SLIDE_VARIANTS, TWEEN_FAST } from '../../shared/constants/motion';

export function TodayPage() {
  const todaySchedule = useTodaySchedule();
  const upcomingEvents = useUpcomingEvents();
  const semesterProgress = useSemesterProgress();

  const subtitle = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  useSetPageHeader({
    title: 'Сегодня',
    subtitle: subtitle.charAt(0).toUpperCase() + subtitle.slice(1),
  });

  if (todaySchedule.loading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="loading"
          className="flex items-center justify-center h-full"
          variants={FADE_SLIDE_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={TWEEN_FAST}
        >
          <p className="text-neutral-400">Загрузка...</p>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="content"
        className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-5"
        variants={FADE_SLIDE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={TWEEN_FAST}
      >
        <TodayPairsBlock data={todaySchedule} />
        <UpcomingEventsBlock events={upcomingEvents.events} />
        <SemesterBlock data={semesterProgress} />
      </motion.div>
    </AnimatePresence>
  );
}