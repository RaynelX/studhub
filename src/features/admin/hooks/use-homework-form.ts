import { useState, useCallback, useMemo } from 'react';
import type { TargetLanguage, TargetEngSubgroup, TargetOitSubgroup, HomeworkDoc } from '../../../database/types';
import { useAdminWrite } from './use-admin-write';

interface HomeworkFormFields {
  content: string;
  targetLanguage: TargetLanguage;
  targetEngSubgroup: TargetEngSubgroup;
  targetOitSubgroup: TargetOitSubgroup;
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
    targetLanguage: existing?.target_language ?? 'all',
    targetEngSubgroup: existing?.target_eng_subgroup ?? 'all',
    targetOitSubgroup: existing?.target_oit_subgroup ?? 'all',
  });

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
      target_language: fields.targetLanguage,
      target_eng_subgroup: fields.targetEngSubgroup,
      target_oit_subgroup: fields.targetOitSubgroup,
      is_deleted: false,
    };

    if (isEditMode && existing) {
      await update('homeworks', existing.id, data);
    } else {
      await insert('homeworks', data);
    }

    onSuccess?.();
  }, [isValid, insert, update, fields, subjectId, date, pairNumber, isEditMode, existing, onSuccess]);

  const remove = useCallback(async () => {
    if (!existing) return;
    await softDelete('homeworks', existing.id);
    onSuccess?.();
  }, [existing, softDelete, onSuccess]);

  return { fields, setField, submit, remove, isValid, loading, isEditMode };
}
