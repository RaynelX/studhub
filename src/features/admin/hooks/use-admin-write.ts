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
  /** Bulk-purge all rows in the given Supabase tables. */
  purge: (tables: string[]) => Promise<void>;
  /** Whether a write operation is in progress */
  loading: boolean;
}

/** Tables that use is_deleted soft-delete. semester_config is hard-deleted. */
const SOFT_DELETE_TABLES = new Set([
  'subjects', 'teachers', 'schedule_entries',
  'schedule_overrides', 'events', 'deadlines', 'students',
  'homeworks', 'subgroup_categories', 'subgroups',
]);

/**
 * Update по `id` не считается ошибкой, если строки нет: Supabase вернёт пустой
 * результат и запись просто не изменится. В интерфейсе это выглядит как
 * «кнопка не работает», поэтому пустой ответ превращаем в явную ошибку.
 * Обычная причина — документ остался в локальном кэше RxDB после того, как
 * строку удалили в Supabase напрямую (hard delete не приходит через pull).
 */
function assertRowAffected(table: string, id: string, affected: unknown[] | null): void {
  if (affected && affected.length > 0) return;
  throw new Error(
    `Запись не найдена в «${table}» (id ${id}). Возможно, её удалили из базы напрямую, ` +
      'а локальная копия устарела — обновите страницу и синхронизацию.',
  );
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
        const { data: affected, error: supaError } = await supabase
          .from(table)
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('id');

        if (supaError) throw new Error(supaError.message);
        assertRowAffected(table, id, affected);

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
        const { data: affected, error: supaError } = await supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('id');

        if (supaError) throw new Error(supaError.message);
        assertRowAffected(table, id, affected);

        triggerSync();
      } finally {
        setLoading(false);
      }
    },
    [triggerSync],
  );

  const purge = useCallback(
    async (tables: string[]): Promise<void> => {
      setLoading(true);

      try {
        for (const table of tables) {
          if (SOFT_DELETE_TABLES.has(table)) {
            const { error } = await supabase
              .from(table)
              .update({ is_deleted: true, updated_at: new Date().toISOString() })
              .eq('is_deleted', false);
            if (error) throw new Error(`${table}: ${error.message}`);
          } else {
            // semester_config — no is_deleted, delete all rows
            const { error } = await supabase
              .from(table)
              .delete()
              .neq('id', '');
            if (error) throw new Error(`${table}: ${error.message}`);
          }
        }
        triggerSync();
      } finally {
        setLoading(false);
      }
    },
    [triggerSync],
  );

  return { insert, update, remove, purge, loading };
}
