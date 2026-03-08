import { useMemo } from 'react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { renderMarkdown } from '../../../shared/utils/render-markdown';

interface HomeworkViewSheetProps {
  open: boolean;
  onClose: () => void;
  subjectName: string;
  dateLabel: string;
  content: string;
}

export function HomeworkViewSheet({
  open,
  onClose,
  subjectName,
  dateLabel,
  content,
}: HomeworkViewSheetProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Домашнее задание" maxHeight="92dvh">
      {/* Context */}
      <div className="mb-4">
        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {subjectName}
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          {dateLabel}
        </p>
      </div>

      {/* Rendered content */}
      <div
        className="homework-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </BottomSheet>
  );
}
