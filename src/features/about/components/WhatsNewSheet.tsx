import { Sparkles } from 'lucide-react';
import { BottomSheet } from '../../../shared/ui/BottomSheet';
import { useWhatsNew } from '../hooks/use-whats-new';

export function WhatsNewSheet() {
  const { entry, open, dismiss } = useWhatsNew();

  if (!entry) return null;

  return (
    <BottomSheet
      open={open}
      onClose={dismiss}
      title="Что нового?"
      footer={
        <button
          onClick={dismiss}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white
                     active:opacity-70 transition-opacity"
        >
          Понятно
        </button>
      }
    >
      <div className="space-y-4">
        {/* Версия и дата */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
            v{entry.version}
          </span>
          <span className="text-xs text-neutral-400 dark:text-neutral-500">
            {entry.date}
          </span>
        </div>

        {/* Список изменений */}
        <ul className="space-y-2.5">
          {entry.changes.map((change) => (
            <li key={change} className="flex items-start gap-2.5">
              <Sparkles
                size={16}
                className="mt-0.5 shrink-0 text-blue-500 dark:text-blue-400"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                {change}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </BottomSheet>
  );
}
