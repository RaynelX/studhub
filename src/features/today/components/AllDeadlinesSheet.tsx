import { useMemo } from 'react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useAllDeadlines } from '../hooks/use-all-deadlines';
import type { AllDeadline } from '../hooks/use-all-deadlines';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AllDeadlinesSheet({ open, onClose }: Props) {
  const { deadlines, loading } = useAllDeadlines();

  // Группировка по дате
  const grouped = useMemo(() => {
    const groups: { dateLabel: string; key: string; items: AllDeadline[] }[] = [];
    for (const dl of deadlines) {
      const last = groups[groups.length - 1];
      if (last && last.key === dl.date) {
        last.items.push(dl);
      } else {
        groups.push({ dateLabel: dl.dateLabel, key: dl.date, items: [dl] });
      }
    }
    return groups;
  }, [deadlines]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Все дедлайны" height="98dvh">
      {/* Контент */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-neutral-400">Загрузка...</p>
        </div>
      ) : deadlines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-neutral-400 dark:text-neutral-500">
            Нет предстоящих дедлайнов
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.key}>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2.5">
                {group.dateLabel}
              </p>
              <div className="space-y-2.5">
                {group.items.map((dl) => (
                  <DeadlineSheetCard key={dl.id} deadline={dl} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

function DeadlineSheetCard({ deadline }: { deadline: AllDeadline }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800/50 bg-amber-50 dark:bg-amber-950/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
          {deadline.subjectName ?? 'Без предмета'}
        </p>
        <span className="text-sm text-gray-400 dark:text-neutral-500 shrink-0 ml-3">
          {deadline.timeLabel}
        </span>
      </div>

      {deadline.description && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-neutral-400 leading-snug line-clamp-3">
          {deadline.description}
        </p>
      )}
    </div>
  );
}
