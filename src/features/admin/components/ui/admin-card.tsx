import type { ReactNode } from 'react';

interface AdminCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  /** Remove internal padding (useful for tables that need full bleed) */
  noPadding?: boolean;
}

/**
 * Standard card wrapper for admin pages.
 * White background with subtle border and shadow.
 */
export function AdminCard({ title, children, className = '', actions, noPadding }: AdminCardProps) {
  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
