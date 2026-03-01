import type { ReactNode } from 'react';

// ============================================================
// Types
// ============================================================

export interface DataTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface AdminDataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

// ============================================================
// Component
// ============================================================

/**
 * Generic data table for admin pages.
 * Renders inside an AdminCard (use noPadding on the card).
 */
export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = 'Нет данных',
}: AdminDataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 dark:border-neutral-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide px-5 py-3"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-neutral-50 dark:border-neutral-800 last:border-0 ${
                onRowClick
                  ? 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors'
                  : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-5 py-3 text-neutral-700 dark:text-neutral-300 ${col.className ?? ''}`}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
