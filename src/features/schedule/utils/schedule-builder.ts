import type {
    ScheduleEntryDoc,
    ScheduleOverrideDoc,
    EventDoc,
    SubjectDoc,
    TeacherDoc,
    SemesterConfigDoc,
    EntryType,
    EventType,
    WeekParity,
  } from '../../../database/types';
  import type { StudentPredicate } from '../../../shared/targeting/types';
  import { BELL_SCHEDULE } from '../../../shared/constants/bell-schedule';
  import { getDayOfWeek, toISODate, getWeekParity } from './week-utils';

  // ============================================================
  // Типы результата
  // ============================================================

  export interface ResolvedPair {
    pairNumber: number;
    subjectName: string;
    subjectShortName?: string;
    subjectId?: string;
    entryType?: EntryType;
    teacherName: string;
    teacherId?: string;
    room: string;
    status: 'normal' | 'replaced' | 'added' | 'cancelled' | 'event';
    comment?: string;
    eventType?: EventType;
    description?: string;
    /** ID of the base schedule entry, if any */
    sourceEntryId?: string;
    /** ID of the override, if any */
    sourceOverrideId?: string;
    /** Подгруппы, которым адресована исходная запись — наследуются заменой/отменой */
    sourceTargetIds?: string[];
  }
  
  export interface DaySlot {
    pairNumber: number;
    startTime: string;
    endTime: string;
    pair: ResolvedPair | null;
  }

  export interface DayEvents {
    slots: DaySlot[];
    floatingEvents: FloatingEvent[];
  }
  
  export interface FloatingEvent {
    description?: string;
    eventType: EventType;
    subjectName?: string;
    teacherName?: string;
    room?: string;
    eventTime?: string;
  }
  
  // ============================================================
  // Входные параметры
  // ============================================================
  
  interface BuildParams {
    date: Date;
    /** Фильтр подгрупп — см. useStudentTargeting() */
    isForStudent: StudentPredicate;
    entries: ScheduleEntryDoc[];
    overrides: ScheduleOverrideDoc[];
    events: EventDoc[];
    subjects: SubjectDoc[];
    teachers: TeacherDoc[];
    semesterConfig: SemesterConfigDoc | null;
  }
  
  // ============================================================
  // Фильтрация: чётность недели
  // ============================================================
  
  function matchesParity(
    entryParity: WeekParity,
    currentParity: 'odd' | 'even' | null,
  ): boolean {
    if (entryParity === 'all') return true;
    if (currentParity === null) return true;
    return entryParity === currentParity;
  }
  
  // ============================================================
  // Основной алгоритм
  // ============================================================
  
  export function buildDaySchedule(params: BuildParams): DayEvents {
    const {
      date,
      isForStudent,
      entries,
      overrides,
      events,
      subjects,
      teachers,
      semesterConfig,
    } = params;
  
    const dayOfWeek = getDayOfWeek(date);
    const dateStr = toISODate(date);
  
    // Чётность недели
    const weekParity = semesterConfig
      ? getWeekParity(date, semesterConfig.odd_week_start)
      : null;
  
    // Lookup maps
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  
    // Фильтруем данные для этого дня и студента
    const dayEntries = entries.filter(
      (e) =>
        e.day_of_week === dayOfWeek &&
        dateStr >= e.date_from &&
        dateStr <= e.date_to &&
        isForStudent(e) &&
        matchesParity(e.week_parity, weekParity),
    );

    const dayOverrides = overrides.filter(
      (o) => o.date === dateStr && isForStudent(o),
    );

    const allDayEvents = events.filter(
      (e) =>
        e.date === dateStr &&
        isForStudent(e),
    );
  
    const dayEvents = allDayEvents.filter(
      (e) => e.pair_number !== undefined && e.pair_number !== null,
    );
  
    // Строим слоты
    const slots = BELL_SCHEDULE.map((bell): DaySlot => {
      const entry = dayEntries.find((e) => e.pair_number === bell.pairNumber);
      const override = dayOverrides.find((o) => o.pair_number === bell.pairNumber);
      const event = dayEvents.find((e) => e.pair_number === bell.pairNumber);
  
      let pair: ResolvedPair | null = null;
  
      // Приоритет: событие > override > базовая запись
      if (event) {
        // Наследование: данные события → данные базовой пары → пусто
        const subject = event.subject_id
          ? subjectMap.get(event.subject_id)
          : entry?.subject_id
            ? subjectMap.get(entry.subject_id)
            : undefined;
  
        const teacher = event.teacher_id
          ? teacherMap.get(event.teacher_id)
          : entry?.teacher_id
            ? teacherMap.get(entry.teacher_id)
            : undefined;
  
        const room = event.room ?? entry?.room ?? '';
  
        // Если есть предмет — показываем как пару с бейджем события
        // Если нет — показываем как абстрактное событие
        pair = {
          pairNumber: bell.pairNumber,
          subjectName: subject?.name ?? event.title,
          subjectShortName: subject?.short_name,
          subjectId: event.subject_id ?? entry?.subject_id,
          entryType: undefined,
          teacherName: teacher?.full_name ?? '',
          teacherId: event.teacher_id ?? entry?.teacher_id,
          room,
          status: 'event',
          eventType: event.event_type,
          description: event.description,
          sourceEntryId: entry?.id,
          sourceTargetIds: event.target_subgroup_ids,
        };
      } else if (override) {
        pair = resolveOverride(override, entry, subjectMap, teacherMap, bell.pairNumber);
      } else if (entry) {
        const subject = subjectMap.get(entry.subject_id);
        const teacher = teacherMap.get(entry.teacher_id);
  
        pair = {
          pairNumber: bell.pairNumber,
          subjectName: subject?.name ?? 'Неизвестный предмет',
          subjectShortName: subject?.short_name,
          subjectId: entry.subject_id,
          entryType: entry.entry_type,
          teacherName: teacher?.full_name ?? '',
          teacherId: entry.teacher_id,
          room: entry.room,
          status: 'normal',
          sourceEntryId: entry.id,
          sourceTargetIds: entry.target_subgroup_ids,
        };
      }
  
      return {
        pairNumber: bell.pairNumber,
        startTime: bell.startTime,
        endTime: bell.endTime,
        pair,
      };
    });

    // Плавающие события (без pair_number)
    const floatingEvents: FloatingEvent[] = allDayEvents
      .filter(
        (e) => e.pair_number === undefined || e.pair_number === null,
      )
      .map((e) => {
        const subject = e.subject_id ? subjectMap.get(e.subject_id) : undefined;
        const teacher = e.teacher_id ? teacherMap.get(e.teacher_id) : undefined;
        return {
          description: e.description,
          eventType: e.event_type,
          subjectName: subject?.name,
          teacherName: teacher?.full_name,
          room: e.room ?? undefined,
          eventTime: e.event_time?.slice(0, 5) ?? undefined,
        };
      });

    return { slots, floatingEvents };
  }
  
  // ============================================================
  // Обработка override
  // ============================================================
  
  function resolveOverride(
    override: ScheduleOverrideDoc,
    baseEntry: ScheduleEntryDoc | undefined,
    subjectMap: Map<string, SubjectDoc>,
    teacherMap: Map<string, TeacherDoc>,
    pairNumber: number,
  ): ResolvedPair | null {
    if (override.override_type === 'cancel') {
      // Отмена — показываем только если была базовая пара
      if (!baseEntry) return null;
  
      const subject = subjectMap.get(baseEntry.subject_id);
      return {
        pairNumber,
        subjectName: subject?.name ?? '',
        subjectShortName: subject?.short_name,
        subjectId: baseEntry.subject_id,
        entryType: baseEntry.entry_type,
        teacherName: '',
        teacherId: baseEntry.teacher_id,
        room: '',
        status: 'cancelled',
        comment: override.comment,
        sourceEntryId: baseEntry.id,
        sourceOverrideId: override.id,
        sourceTargetIds: override.target_subgroup_ids,
      };
    }
  
    // replace или add
    const subject = override.subject_id
      ? subjectMap.get(override.subject_id)
      : undefined;
    const teacher = override.teacher_id
      ? teacherMap.get(override.teacher_id)
      : undefined;
  
    return {
      pairNumber,
      subjectName: subject?.name ?? '',
      subjectShortName: subject?.short_name,
      subjectId: override.subject_id,
      entryType: override.entry_type,
      teacherName: teacher?.full_name ?? '',
      teacherId: override.teacher_id,
      room: override.room ?? '',
      status: override.override_type === 'replace' ? 'replaced' : 'added',
      comment: override.comment,
      sourceEntryId: baseEntry?.id,
      sourceOverrideId: override.id,
      sourceTargetIds: override.target_subgroup_ids,
    };
  }