import { useState, useCallback, useMemo } from 'react';
import type { EntryType, TargetLanguage, TargetEngSubgroup, TargetOitSubgroup } from '../../../database/types';
import { useAdminWrite } from './use-admin-write';
import type { SourceTargets } from '../../schedule/utils/schedule-builder';

interface OverrideFormFields {
  subjectId: string;
  entryType: EntryType;
  teacherId: string;
  room: string;
  comment: string;
  targetLanguage: TargetLanguage;
  targetEngSubgroup: TargetEngSubgroup;
  targetOitSubgroup: TargetOitSubgroup;
}

interface UseOverrideFormOptions {
  mode: 'replace' | 'add';
  date: string;
  pairNumber: number;
  /** Defaults for targets, inherited from the base pair */
  sourceTargets?: SourceTargets;
  /** Defaults for fields (e.g. the original subject/teacher in replace mode) */
  defaults?: Partial<Pick<OverrideFormFields, 'subjectId' | 'entryType' | 'teacherId' | 'room'>>;
  onSuccess?: () => void;
}

interface UseOverrideFormResult {
  fields: OverrideFormFields;
  setField: <K extends keyof OverrideFormFields>(key: K, value: OverrideFormFields[K]) => void;
  submit: () => Promise<void>;
  isValid: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Manages the form state for creating a replace or add override.
 */
export function useOverrideForm({
  mode,
  date,
  pairNumber,
  sourceTargets,
  defaults,
  onSuccess,
}: UseOverrideFormOptions): UseOverrideFormResult {
  const { insert, loading, error } = useAdminWrite();

  const [fields, setFields] = useState<OverrideFormFields>({
    subjectId: defaults?.subjectId ?? '',
    entryType: defaults?.entryType ?? 'lecture',
    teacherId: defaults?.teacherId ?? '',
    room: defaults?.room ?? '',
    comment: '',
    targetLanguage: sourceTargets?.target_language ?? 'all',
    targetEngSubgroup: sourceTargets?.target_eng_subgroup ?? 'all',
    targetOitSubgroup: sourceTargets?.target_oit_subgroup ?? 'all',
  });

  const setField = useCallback(<K extends keyof OverrideFormFields>(
    key: K,
    value: OverrideFormFields[K],
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isValid = useMemo(
    () => fields.subjectId !== '' && fields.teacherId !== '',
    [fields.subjectId, fields.teacherId],
  );

  const submit = useCallback(async () => {
    if (!isValid) return;

    await insert('schedule_overrides', {
      date,
      pair_number: pairNumber,
      override_type: mode,
      subject_id: fields.subjectId,
      entry_type: fields.entryType,
      teacher_id: fields.teacherId,
      room: fields.room || undefined,
      comment: fields.comment || undefined,
      target_language: fields.targetLanguage,
      target_eng_subgroup: fields.targetEngSubgroup,
      target_oit_subgroup: fields.targetOitSubgroup,
      is_deleted: false,
    });

    onSuccess?.();
  }, [isValid, insert, date, pairNumber, mode, fields, onSuccess]);

  return { fields, setField, submit, isValid, loading, error };
}
