import { useState, useMemo } from 'react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useAllHomework } from '../hooks/use-all-homework';
import type { AllHomework } from '../hooks/use-all-homework';
import { HomeworkViewSheet } from '../../schedule/components/HomeworkViewSheet';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AllHomeworksSheet({ open, onClose }: Props) {
  const { homework, loading } = useAllHomework();
  const [viewOpen, setViewOpen] = useState(false);
  const [viewed, setViewed] = useState<AllHomework | null>(null);

  const handleTap = (hw: AllHomework) => {
    setViewed(hw);
    setViewOpen(true);
  };

  // Группировка по дате
  const grouped = useMemo(() => {
    const groups: { dateLabel: string; key: string; items: AllHomework[] }[] = [];
    for (const hw of homework) {
      const last = groups[groups.length - 1];
      if (last && last.key === hw.date) {
        last.items.push(hw);
      } else {
        groups.push({ dateLabel: hw.dateLabel, key: hw.date, items: [hw] });
      }
    }
    return groups;
  }, [homework]);

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Все домашние задания" height="98dvh">
        {/* Контент */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-neutral-400">Загрузка...</p>
          </div>
        ) : homework.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-neutral-400 dark:text-neutral-500">
              Нет предстоящих домашних заданий
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
                  {group.items.map((hw) => (
                    <HomeworkSheetCard key={hw.id} homework={hw} onTap={handleTap} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      {/* HomeworkViewSheet */}
      {viewed && (
        <HomeworkViewSheet
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          subjectName={viewed.subjectName}
          dateLabel={viewed.dateLabel}
          content={viewed.content}
        />
      )}
    </>
  );
}

function HomeworkSheetCard({ homework, onTap }: { homework: AllHomework; onTap: (hw: AllHomework) => void }) {
  const rippleRef = useTouchRipple<HTMLButtonElement>();
  const maxPreviewLength = 150;
  const firstLine = homework.content.split('\n')[0];
  const hasHiddenLines = homework.content.includes('\n');
  const plainFirstLine = stripMarkdown(firstLine);
  const isLengthTruncated = plainFirstLine.length > maxPreviewLength;
  const basePreview = isLengthTruncated
    ? plainFirstLine.slice(0, maxPreviewLength).trimEnd()
    : plainFirstLine;
  const preview = (hasHiddenLines || isLengthTruncated) && basePreview.length > 0
    ? `${basePreview}...`
    : basePreview;

  return (
    <button
      ref={rippleRef}
      onClick={() => onTap(homework)}
      className="w-full text-left rounded-xl border border-gray-200 dark:border-neutral-800/50 bg-blue-50 dark:bg-blue-950/40 p-4 transform-gpu active:scale-[0.98] transition-transform duration-75"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
          {homework.subjectName}
        </p>
        <span className="text-sm text-gray-400 dark:text-neutral-500 shrink-0 ml-3 tabular-nums">
          {homework.pairNumber} пара
        </span>
      </div>

      {preview && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-neutral-400 leading-snug line-clamp-2">
          {preview}
        </p>
      )}
    </button>
  );
}

/** Strip markdown syntax for a plain-text preview */
function stripMarkdown(content: string): string {
  const plain = content
    .replace(/#{1,6}\s/g, '')        // headings
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // bold/italic
    .replace(/~~([^~]+)~~/g, '$1')   // strikethrough
    .replace(/`([^`]+)`/g, '$1')     // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*+]\s/gm, '')       // list markers
    .replace(/^\d+\.\s/gm, '')       // ordered list markers
    .trim();

  return plain;
}
