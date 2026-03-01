import type { ReactNode } from 'react';

interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
}

/**
 * Stat card for the admin dashboard — shows a big number and a label.
 */
export function AdminStatCard({ label, value, icon }: AdminStatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm px-5 py-4 flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
