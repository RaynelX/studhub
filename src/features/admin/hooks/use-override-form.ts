import { useState, useCallback, useMemo } from 'react';
import type { EntryType } from '../../../database/types';
import { useAdminWrite } from './use-admin-write';

interface OverrideFormFields {
  subjectId: string;
  entryType: EntryType;
  teacherId: string;
  room: string;
  comment: string;
  targetSubgroupIds: string[];
}

interface UseOverrideFormOptions {
  mode: 'replace' | 'add';
  date: string;
  pairNumber: number;
  /** Defaults for targets, inherited from the base pair */
  sourceTargetIds?: string[];
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
}

/**
 * Manages the form state for creating a replace or add override.
 */
export function useOverrideForm({
  mode,
  date,
  pairNumber,
  sourceTargetIds,
  defaults,
  onSuccess,
}: UseOverrideFormOptions): UseOverrideFormResult {
  const { insert, loading } = useAdminWrite();

  const [fields, setFields] = useState<OverrideFormFields>({
    subjectId: defaults?.subjectId ?? '',
    entryType: defaults?.entryType ?? 'lecture',
    teacherId: defaults?.teacherId ?? '',
    room: defaults?.room ?? '',
    comment: '',
    targetSubgroupIds: sourceTargetIds ?? [],
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
      target_subgroup_ids: fields.targetSubgroupIds,
      is_deleted: false,
    });

    onSuccess?.();
  }, [isValid, insert, date, pairNumber, mode, fields, onSuccess]);

  return { fields, setField, submit, isValid, loading };
}
