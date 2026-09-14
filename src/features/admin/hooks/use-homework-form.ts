import { useState, useCallback, useMemo } from 'react';
import type { HomeworkDoc } from '../../../database/types';
import { useAdminWrite } from './use-admin-write';

interface HomeworkFormFields {
  content: string;
  targetSubgroupIds: string[];
}

interface UseHomeworkFormOptions {
  subjectId: string;
  date: string;
  pairNumber: number;
  existing?: HomeworkDoc | null;
  onSuccess?: () => void;
}

interface UseHomeworkFormResult {
  fields: HomeworkFormFields;
  setField: <K extends keyof HomeworkFormFields>(key: K, value: HomeworkFormFields[K]) => void;
  submit: () => Promise<void>;
  remove: () => Promise<void>;
  isValid: boolean;
  loading: boolean;
  isEditMode: boolean;
  /** Текст ошибки последней записи; null — ошибки не было */
  error: string | null;
}

export function useHomeworkForm({
  subjectId,
  date,
  pairNumber,
  existing,
  onSuccess,
}: UseHomeworkFormOptions): UseHomeworkFormResult {
  const { insert, update, remove: softDelete, loading } = useAdminWrite();
  const isEditMode = !!existing;

  const [fields, setFields] = useState<HomeworkFormFields>({
    content: existing?.content ?? '',
    targetSubgroupIds: existing?.target_subgroup_ids ?? [],
  });

  const [error, setError] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof HomeworkFormFields>(
    key: K,
    value: HomeworkFormFields[K],
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isValid = useMemo(
    () => fields.content.trim().length > 0,
    [fields.content],
  );

  const submit = useCallback(async () => {
    if (!isValid) return;

    const data = {
      subject_id: subjectId,
      date,
      pair_number: pairNumber,
      content: fields.content.trim(),
      target_subgroup_ids: fields.targetSubgroupIds,
      is_deleted: false,
    };

    // Без try/catch ошибка Supabase осталась бы необработанным промисом:
    // шит просто не закрывался бы, не объясняя, почему ничего не сохранилось.
    try {
      setError(null);
      if (isEditMode && existing) {
        await update('homeworks', existing.id, data);
      } else {
        await insert('homeworks', data);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      console.error('[Homework] Не удалось сохранить задание:', e);
      setError(`Не удалось сохранить: ${message}`);
      return;
    }

    onSuccess?.();
  }, [isValid, insert, update, fields, subjectId, date, pairNumber, isEditMode, existing, onSuccess]);

  const remove = useCallback(async () => {
    if (!existing) return;

    try {
      setError(null);
      await softDelete('homeworks', existing.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      console.error('[Homework] Не удалось удалить задание:', e);
      setError(`Не удалось удалить: ${message}`);
      return;
    }

    onSuccess?.();
  }, [existing, softDelete, onSuccess]);

  return { fields, setField, submit, remove, isValid, loading, isEditMode, error };
}
