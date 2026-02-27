import { useState } from 'react';
import { ArrowDownAZ, Hash, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useSubjectDetails } from '../../features/subjects/hooks/use-subject-details';
import { SubjectCard } from '../../features/subjects/components/SubjectCard';
import { STAGGER_CONTAINER, STAGGER_ITEM, SPRING_SNAPPY, FADE_SLIDE_VARIANTS, TWEEN_FAST } from '../../shared/constants/motion';
import type { SubjectDetails } from '../../features/subjects/hooks/use-subject-details';

type SortMode = 'alpha' | 'count' | 'next';

const SORT_OPTIONS: { mode: SortMode; icon: typeof ArrowDownAZ; label: string }[] = [
  { mode: 'alpha', icon: ArrowDownAZ, label: 'А–Я' },
  { mode: 'count', icon: Hash, label: 'Кол-во' },
  { mode: 'next', icon: Clock, label: 'Ближайшая' },
];

export function SubjectsPage() {
  useSetPageHeader({ title: 'Предметы' });

  const { subjects, loading } = useSubjectDetails();
  const [sortMode, setSortMode] = useState<SortMode>('alpha');

  if (loading) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="loading"
          className="h-full flex items-center justify-center"
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

  if (subjects.length === 0) {
    return (
      <motion.div
        className="h-full flex items-center justify-center p-4"
        variants={FADE_SLIDE_VARIANTS}
        initial="initial"
        animate="animate"
        transition={TWEEN_FAST}
      >
        <p className="text-neutral-400 dark:text-neutral-500">Предметы не найдены</p>
      </motion.div>
    );
  }

  const sorted = sortSubjects(subjects, sortMode);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      {/* Сортировка */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {SORT_OPTIONS.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sortMode === mode
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 active:bg-neutral-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Список */}
      <motion.div
        className="px-4 pb-4 space-y-3"
        variants={STAGGER_CONTAINER}
        initial="initial"
        animate="animate"
        key={sortMode}
      >
        {sorted.map((data) => (
          <motion.div key={data.subject.id} variants={STAGGER_ITEM} transition={SPRING_SNAPPY}>
            <SubjectCard data={data} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function sortSubjects(subjects: SubjectDetails[], mode: SortMode): SubjectDetails[] {
  const copy = [...subjects];

  switch (mode) {
    case 'alpha':
      return copy.sort((a, b) => a.subject.name.localeCompare(b.subject.name, 'ru'));

    case 'count':
      return copy.sort((a, b) => b.progress.total - a.progress.total);

    case 'next':
      // По количеству оставшихся пар (меньше осталось → ближе к концу → ниже)
      return copy.sort((a, b) => {
        const remainA = a.progress.total - a.progress.passed;
        const remainB = b.progress.total - b.progress.passed;
        return remainB - remainA;
      });

    default:
      return copy;
  }
}