import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useSync } from '../../../database/sync/SyncProvider';

interface AdminWriteResult {
  /** Insert a new row into a Supabase table. Returns the generated id. */
  insert: (table: string, data: Record<string, unknown>) => Promise<string>;
  /** Update an existing row in a Supabase table. */
  update: (table: string, id: string, data: Record<string, unknown>) => Promise<void>;
  /** Soft-delete a row (set is_deleted = true). */
  remove: (table: string, id: string) => Promise<void>;
  /** Whether a write operation is in progress */
  loading: boolean;
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

  const insert = useCallback(
    async (table: string, data: Record<string, unknown>): Promise<string> => {
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
      } finally {
        setLoading(false);
      }
    },
    [triggerSync],
  );

  const remove = useCallback(
    async (table: string, id: string): Promise<void> => {
      setLoading(true);

      try {
        const { error: supaError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (supaError) throw new Error(supaError.message);

        triggerSync();
      } finally {
        setLoading(false);
      }
    },
    [triggerSync],
  );

  const update = useCallback(
    async (table: string, id: string, data: Record<string, unknown>): Promise<void> => {
      setLoading(true);

      try {
        const { error: supaError } = await supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (supaError) throw new Error(supaError.message);

        triggerSync();
      } finally {
        setLoading(false);
      }
    },
    [triggerSync],
  );

  return { insert, update, remove, loading };
}
