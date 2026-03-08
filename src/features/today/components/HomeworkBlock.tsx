import { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';
import type { ActiveHomework } from '../hooks/use-active-homework';
import { HomeworkViewSheet } from '../../schedule/components/HomeworkViewSheet';

interface Props {
  homework: ActiveHomework[];
}

export function HomeworkBlock({ homework }: Props) {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewed, setViewed] = useState<ActiveHomework | null>(null);

  if (homework.length === 0) return null;

  const handleTap = (hw: ActiveHomework) => {
    setViewed(hw);
    setViewOpen(true);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />
        Домашние задания
      </h3>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden">
        {homework.map((hw, i) => (
          <HomeworkRow
            key={hw.id}
            hw={hw}
            onTap={() => handleTap(hw)}
            showBorder={i < homework.length - 1}
          />
        ))}
      </div>

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
  showBorder,
}: {
  hw: ActiveHomework;
  onTap: () => void;
  showBorder: boolean;
}) {
  const preview = useMemo(() => getPlainPreview(hw.content, 100), [hw.content]);

  return (
    <button
      onClick={onTap}
      className={`w-full text-left px-4 py-3 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors ${
        showBorder ? 'border-b border-gray-100 dark:border-neutral-800' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {hw.subjectName}
        </span>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0 ml-2">
          {hw.dateLabel}
        </span>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
        {preview}
      </p>
    </button>
  );
}

/** Strip markdown syntax for a plain-text preview */
function getPlainPreview(content: string, maxLength: number): string {
  const plain = content
    .replace(/#{1,6}\s/g, '')        // headings
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // bold/italic
    .replace(/~~([^~]+)~~/g, '$1')   // strikethrough
    .replace(/`([^`]+)`/g, '$1')     // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*+]\s/gm, '')       // list markers
    .replace(/^\d+\.\s/gm, '')       // ordered list markers
    .replace(/\n+/g, ' ')            // newlines to spaces
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).trimEnd() + '…';
}
