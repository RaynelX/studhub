import { useState } from 'react';
import type { ActiveHomework } from '../hooks/use-active-homework';
import { HomeworkViewSheet } from '../../schedule/components/HomeworkViewSheet';
import { useTouchRipple } from '../../../shared/hooks/use-touch-ripple';
import { AllHomeworksSheet } from './AllHomeworksSheet';

interface Props {
  homework: ActiveHomework[];
}

export function HomeworkBlock({ homework }: Props) {
  const rippleRef = useTouchRipple();
  const showAllButtonRef = useTouchRipple<HTMLButtonElement>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewed, setViewed] = useState<ActiveHomework | null>(null);

  if (homework.length === 0) return null;

  const handleTap = (hw: ActiveHomework) => {
    setViewed(hw);
    setViewOpen(true);
  };

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Домашние задания
        </h3>
        <button
          ref={showAllButtonRef}
          onClick={() => setSheetOpen(true)}
          className="text-sm text-indigo-600 dark:text-indigo-400 font-medium active:opacity-70 transition-opacity"
        >
          Показать все &rsaquo;
        </button>
      </div>

      {/* Карточка */}
      <div ref={rippleRef} className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent px-4 py-2 transform-gpu active:scale-[0.98] transition-transform duration-75">
        <div>
          {homework.slice(0, 5).map((hw) => (
            <HomeworkRow
              key={hw.id}
              hw={hw}
              onTap={() => handleTap(hw)}
            />
          ))}
        </div>
      </div>

      {/* AllHomeworksSheet */}
      <AllHomeworksSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

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
    </div>
  );
}

function HomeworkRow({
  hw,
  onTap,
}: {
  hw: ActiveHomework;
  onTap: () => void;
}) {
  const maxPreviewLength = 100;
  // Show only the first source line in preview, but indicate hidden text with ellipsis.
  const firstLine = hw.content.split('\n')[0];
  const hasHiddenLines = hw.content.includes('\n');
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
      onClick={onTap}
      className="w-full text-left flex gap-3 py-2 active:opacity-70 transition-opacity"
    >
      {/* Date */}
      <span className="text-xs text-neutral-400 dark:text-neutral-500 w-11 shrink-0 pt-0.5 tabular-nums">
        {hw.dateLabel}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm flex-1">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">
            {hw.subjectName}
          </span>
          {preview && (
            <>
              <span className="text-neutral-300 dark:text-neutral-600"> · </span>
              <span className="text-neutral-400 dark:text-neutral-500">
                {preview}
              </span>
            </>
          )}
        </p>
      </div>
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
