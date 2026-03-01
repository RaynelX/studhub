import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSync } from '../../../database/sync/SyncProvider';

interface AdminWriteResult {
  /** Insert a new row into a Supabase table. Returns the generated id. */
  insert: (table: string, data: Record<string, unknown>) => Promise<string>;
  /** Soft-delete a row (set is_deleted = true). */
  remove: (table: string, id: string) => Promise<void>;
  /** Whether a write operation is in progress */
  loading: boolean;
  /** Last error message, if any */
  error: string | null;
}

/**
 * Provides write access to Supabase for admin operations.
 *
 * After each write the sync engine is triggered so that RxDB
 * picks up the changes through the normal pull pipeline.
 */
export function useAdminWrite(): AdminWriteResult {
  const { triggerSync } = useSync();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(
    async (table: string, data: Record<string, unknown>): Promise<string> => {
      setError(null);
      setLoading(true);

      const now = new Date().toISOString();
      const id = (data.id as string) ?? crypto.randomUUID();

      const row = {
        ...data,
        id,
        created_at: data.created_at ?? now,
        updated_at: data.updated_at ?? now,
      };

      try {
        const { error: supaError } = await supabase
          .from(table)
          .insert(row);

        if (supaError) throw new Error(supaError.message);

        triggerSync();
        return id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [triggerSync],
  );

  const remove = useCallback(
    async (table: string, id: string): Promise<void> => {
      setError(null);
      setLoading(true);

      try {
        const { error: supaError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (supaError) throw new Error(supaError.message);

        triggerSync();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [triggerSync],
  );

  return { insert, remove, loading, error };
}
