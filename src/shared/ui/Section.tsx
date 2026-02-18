import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </h3>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent p-4">
        {children}
      </div>
    </div>
  );
}