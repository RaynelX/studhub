import { useState } from 'react';
import { ChevronDown, Link, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EXPAND_VARIANTS, SPRING_SNAPPY, SPRING_GENTLE } from '../../../shared/constants/motion';
import type { SubjectDetails } from '../hooks/use-subject-details';

const TYPE_LABELS: Record<string, string> = {
  lecture: 'Лек.',
  seminar: 'Сем.',
  practice: 'Пр.',
  other: 'Др.',
};

interface Props {
  data: SubjectDetails;
}

export function SubjectCard({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { subject, teachers, progress } = data;

  const hasLinks = !!(subject.sdo_url || (subject.additional_links && subject.additional_links.length > 0));
  const hasNotes = !!subject.notes;
  const hasExpandedContent = hasLinks || hasNotes;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden">
      <button
        onClick={() => hasExpandedContent && setExpanded((v) => !v)}
        className="w-full text-left p-4 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors"
      >
        {/* Название */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {subject.name}
            </p>
            {subject.short_name && (
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
                {subject.short_name}
              </p>
            )}
          </div>

          {hasExpandedContent && (
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={SPRING_SNAPPY}
              className="mt-1 shrink-0"
            >
              <ChevronDown
                size={18}
                className="text-neutral-400 dark:text-neutral-500"
              />
            </motion.div>
          )}
        </div>

        {/* Преподаватели */}
        {teachers.length > 0 && (
          <div className="mt-3 space-y-1">
            {teachers.map((t) => (
              <div key={t.teacherName} className="flex items-center gap-2 text-sm">
                <span className="text-neutral-400 dark:text-neutral-500 shrink-0">
                  {t.entryTypes.map((et) => TYPE_LABELS[et] ?? et).join(', ')}
                </span>
                <span className="text-neutral-700 dark:text-neutral-300">
                  {t.teacherName}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Прогресс */}
        {progress.total > 0 && (
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percent}%` }}
                  transition={SPRING_GENTLE}
                />
              </div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums shrink-0">
                {progress.passed}/{progress.total}
              </span>
            </div>
          </div>
        )}
      </button>

      {/* Раскрывающийся контент */}
      <AnimatePresence initial={false}>
        {expanded && hasExpandedContent && (
          <motion.div
            variants={EXPAND_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={SPRING_SNAPPY}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-gray-100 dark:border-neutral-800 space-y-3">
          {/* Ссылки */}
          {subject.sdo_url && (
            <a
              href={subject.sdo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Link size={16} className="shrink-0" />
              <span className="truncate">СДО: {extractDomain(subject.sdo_url)}</span>
            </a>
          )}

          {subject.additional_links?.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-blue-600 dark:text-blue-400 active:opacity-70 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Link size={16} className="shrink-0" />
              <span className="truncate">{link.label}</span>
            </a>
          ))}

          {/* Заметки */}
          {subject.notes && (
            <div className="flex gap-2.5 text-sm">
              <StickyNote size={16} className="text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
              <p className="text-neutral-600 dark:text-neutral-300 leading-snug">
                {subject.notes}
              </p>
            </div>
          )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}