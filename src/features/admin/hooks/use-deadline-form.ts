import { useState, useCallback, useMemo } from 'react';
import { useAdminWrite } from './use-admin-write';

interface DeadlineFormFields {
  subjectId: string;
  date: string;
  time: string;
  description: string;
  targetSubgroupIds: string[];
}

interface UseDeadlineFormOptions {
  defaultDate: string;
  defaultSubjectId?: string;
  onSuccess?: () => void;
}

interface UseDeadlineFormResult {
  fields: DeadlineFormFields;
  setField: <K extends keyof DeadlineFormFields>(key: K, value: DeadlineFormFields[K]) => void;
  submit: () => Promise<void>;
  isValid: boolean;
  loading: boolean;
}

export function useDeadlineForm({
  defaultDate,
  defaultSubjectId,
  onSuccess,
}: UseDeadlineFormOptions): UseDeadlineFormResult {
  const { insert, loading } = useAdminWrite();

  const [fields, setFields] = useState<DeadlineFormFields>({
    subjectId: defaultSubjectId ?? '',
    date: defaultDate,
    time: '',
    description: '',
    targetSubgroupIds: [],
  });

  const setField = useCallback(<K extends keyof DeadlineFormFields>(
    key: K,
    value: DeadlineFormFields[K],
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isValid = useMemo(
    () => fields.date !== '',
    [fields.date],
  );

  const submit = useCallback(async () => {
    if (!isValid) return;

    await insert('deadlines', {
      subject_id: fields.subjectId || undefined,
      date: fields.date,
      time: fields.time || undefined,
      description: fields.description.trim() || undefined,
      target_subgroup_ids: fields.targetSubgroupIds,
    });

    onSuccess?.();
  }, [isValid, insert, fields, onSuccess]);

  return { fields, setField, submit, isValid, loading };
}
