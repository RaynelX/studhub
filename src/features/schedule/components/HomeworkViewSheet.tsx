import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API недоступен (не https / отказ в правах) — тихо игнорируем
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Домашнее задание" maxHeight="92dvh">
      {/* Context */}
      <div className="mb-4 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {subjectName}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {dateLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Скопировать текст задания"
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 active:bg-neutral-100 dark:active:bg-neutral-800 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>

      {/* Rendered content */}
      <div
        className="homework-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </BottomSheet>
  );
}
