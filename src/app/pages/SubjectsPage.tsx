import { useState } from 'react';
import { ArrowDownAZ, Hash, Clock, Percent } from 'lucide-react';
import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useSubjectDetails } from '../../features/subjects/hooks/use-subject-details';
import { SubjectCard } from '../../features/subjects/components/SubjectCard';
import type { SubjectDetails } from '../../features/subjects/hooks/use-subject-details';

type SortMode = 'alpha' | 'count' | 'next' | 'progress';

const SORT_OPTIONS: { mode: SortMode; icon: typeof ArrowDownAZ; label: string }[] = [
  { mode: 'alpha', icon: ArrowDownAZ, label: 'А–Я' },
  { mode: 'count', icon: Hash, label: 'Кол-во' },
  { mode: 'next', icon: Clock, label: 'Ближайшая' },
  { mode: 'progress', icon: Percent, label: 'Прогресс' },
];

export function SubjectsPage() {
  useSetPageHeader({ title: 'Предметы' });

  const { subjects, loading } = useSubjectDetails();
  const [sortMode, setSortMode] = useState<SortMode>('alpha');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-neutral-400 dark:text-neutral-500">Предметы не найдены</p>
      </div>
    );
  }

  const sorted = sortSubjects(subjects, sortMode);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      {/* Сортировка */}
      <div className="flex flex-wrap gap-2 px-4 pt-4 pb-2">
        {SORT_OPTIONS.map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              sortMode === mode
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 active:bg-neutral-200 dark:active:bg-neutral-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Список */}
      <div
        className="px-4 pb-4 space-y-3"
      >
        {sorted.map((data) => (
          <SubjectCard key={data.subject.id} data={data} />
        ))}
      </div>
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
      return copy.sort((a, b) => {
        if (!a.nextPairDate && !b.nextPairDate) return 0;
        if (!a.nextPairDate) return 1;
        if (!b.nextPairDate) return -1;
        return a.nextPairDate.localeCompare(b.nextPairDate);
      });

    case 'progress':
      return copy.sort((a, b) => b.progress.percent - a.progress.percent);

    default:
      return copy;
  }
}