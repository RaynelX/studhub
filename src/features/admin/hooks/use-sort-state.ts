import { useState, useMemo, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortState<K extends string> {
  column: K;
  direction: SortDirection;
}

interface UseSortStateReturn<T, K extends string> {
  /** Current sort column */
  column: K;
  /** Current sort direction */
  direction: SortDirection;
  /** Toggle sort on a column (click handler for header) */
  toggle: (col: string) => void;
  /** Sorted copy of the data array */
  sorted: T[];
}

/**
 * Generic hook for client-side table sorting.
 *
 * @param data        - the array to sort (should be stable / from state or useMemo)
 * @param accessors   - map from column key → accessor function (returns sortable value)
 * @param defaultCol  - initial sort column
 * @param defaultDir  - initial sort direction (default: 'asc')
 */
export function useSortState<T, K extends string>(
  data: readonly T[],
  accessors: Record<K, (item: T) => string | number | null | undefined>,
  defaultCol: K,
  defaultDir: SortDirection = 'asc',
): UseSortStateReturn<T, K> {
  const [state, setState] = useState<SortState<K>>({ column: defaultCol, direction: defaultDir });

  const toggle = useCallback(
    (col: string) => {
      setState((prev) => {
        if (prev.column === col) {
          return { column: col as K, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { column: col as K, direction: 'asc' };
      });
    },
    [],
  );

  const sorted = useMemo(() => {
    const accessor = accessors[state.column];
    if (!accessor) return [...data];

    const dir = state.direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);

      // Nullish values go to the end
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * dir;
      }

      return String(va).localeCompare(String(vb), 'ru') * dir;
    });
  }, [data, accessors, state.column, state.direction]);

  return { column: state.column, direction: state.direction, toggle, sorted };
}
