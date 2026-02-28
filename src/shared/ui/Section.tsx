import type { ReactNode } from 'react';
import { useTouchRipple } from '../hooks/use-touch-ripple';

interface Props {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: Props) {
  const rippleRef = useTouchRipple();
  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </h3>
      <div ref={rippleRef} className="relative bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent p-4">
        {children}
      </div>
    </div>
  );
}