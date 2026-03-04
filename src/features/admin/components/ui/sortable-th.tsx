import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableThProps {
  /** Column key – must match the key used in useSortState accessors */
  column: string;
  /** Current active sort column */
  activeColumn: string;
  /** Current sort direction */
  direction: 'asc' | 'desc';
  /** Click handler from useSortState.toggle */
  onToggle: (col: string) => void;
  /** Header label */
  children: React.ReactNode;
  className?: string;
}

/**
 * Sortable table header cell.
 * Shows an arrow indicator when this column is the active sort.
 */
export function SortableTh({
  column,
  activeColumn,
  direction,
  onToggle,
  children,
  className = '',
}: SortableThProps) {
  const isActive = column === activeColumn;

  return (
    <th
      className={`select-none cursor-pointer group ${className}`}
      onClick={() => onToggle(column)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-blue-500" />
          ) : (
            <ArrowDown className="w-3 h-3 text-blue-500" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </th>
  );
}
