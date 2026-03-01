import { useState, useCallback, useMemo } from 'react';
import type { EventType, TargetLanguage, TargetEngSubgroup, TargetOitSubgroup } from '../../../database/types';
import { useAdminWrite } from './use-admin-write';

interface EventFormFields {
  eventType: EventType;
  description: string;
  subjectId: string;
  teacherId: string;
  date: string;
  pairNumber: number | null;
  eventTime: string;
  room: string;
  targetLanguage: TargetLanguage;
  targetEngSubgroup: TargetEngSubgroup;
  targetOitSubgroup: TargetOitSubgroup;
}

interface UseEventFormOptions {
  defaultDate: string;
  defaultPairNumber?: number;
  /** Auto-fill subject from the existing pair at this slot */
  defaultSubjectId?: string;
  /** Auto-fill room from the existing pair at this slot */
  defaultRoom?: string;
  onSuccess?: () => void;
}

interface UseEventFormResult {
  fields: EventFormFields;
  setField: <K extends keyof EventFormFields>(key: K, value: EventFormFields[K]) => void;
  submit: () => Promise<void>;
  isValid: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Manages the form state for creating an event.
 * Title is auto-generated from event type — not exposed in the form.
 */
export function useEventForm({
  defaultDate,
  defaultPairNumber,
  defaultSubjectId,
  defaultRoom,
  onSuccess,
}: UseEventFormOptions): UseEventFormResult {
  const { insert, loading, error } = useAdminWrite();

  const [fields, setFields] = useState<EventFormFields>({
    eventType: 'other',
    description: '',
    subjectId: defaultSubjectId ?? '',
    teacherId: '',
    date: defaultDate,
    pairNumber: defaultPairNumber ?? null,
    eventTime: '',
    room: defaultRoom ?? '',
    targetLanguage: 'all',
    targetEngSubgroup: 'all',
    targetOitSubgroup: 'all',
  });

  const setField = useCallback(<K extends keyof EventFormFields>(
    key: K,
    value: EventFormFields[K],
  ) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const isValid = useMemo(
    () => fields.date !== '',
    [fields.date],
  );

  const submit = useCallback(async () => {
    if (!isValid) return;

    // Auto-generate title from event type
    const EVENT_TYPE_LABELS: Record<EventType, string> = {
      usr: 'УСР',
      control_work: 'Контрольная',
      deadline: 'Дедлайн',
      credit: 'Зачёт',
      exam: 'Экзамен',
      consultation: 'Консультация',
      other: 'Событие',
    };
    const title = EVENT_TYPE_LABELS[fields.eventType] ?? 'Событие';

    await insert('events', {
      title,
      description: fields.description.trim() || undefined,
      event_type: fields.eventType,
      subject_id: fields.subjectId || undefined,
      teacher_id: fields.teacherId || undefined,
      date: fields.date,
      pair_number: fields.pairNumber ?? undefined,
      event_time: fields.eventTime || undefined,
      room: fields.room || undefined,
      target_language: fields.targetLanguage,
      target_eng_subgroup: fields.targetEngSubgroup,
      target_oit_subgroup: fields.targetOitSubgroup,
      is_deleted: false,
    });

    onSuccess?.();
  }, [isValid, insert, fields, onSuccess]);

  return { fields, setField, submit, isValid, loading, error };
}
