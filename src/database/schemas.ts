import type { RxJsonSchema } from 'rxdb';
import type {
  SubjectDoc,
  TeacherDoc,
  SubgroupCategoryDoc,
  SubgroupDoc,
  ScheduleEntryDoc,
  ScheduleOverrideDoc,
  EventDoc,
  DeadlineDoc,
  StudentDoc,
  SemesterConfigDoc,
  HomeworkDoc,
} from './types';
import { MIN_PAIR_NUMBER, MAX_PAIR_NUMBER } from '../shared/constants/bell-schedule';

/**
 * Диапазон номера пары берётся из BELL_SCHEDULE, чтобы схема не отставала
 * от расписания звонков (раньше был захардкожен maximum: 5 и записи
 * с 6-й по 8-ю пару отбрасывались валидатором при синхронизации).
 */
const pairNumberField = {
  type: 'integer',
  minimum: MIN_PAIR_NUMBER,
  maximum: MAX_PAIR_NUMBER,
} as const;

/**
 * Набор подгрупп, которым адресована запись. Пустой массив — вся группа.
 * Конкретные подгруппы живут в коллекции subgroups, а не в enum схемы:
 * каждый семестр они заводятся заново.
 */
const subgroupIdsField = {
  type: 'array',
  items: { type: 'string', maxLength: 36 },
} as const;

// ============================================================
// SUBJECTS
// ============================================================

const subjectsSchema: RxJsonSchema<SubjectDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    short_name: { type: 'string' },
    sdo_url: { type: 'string' },
    additional_links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'name', 'created_at', 'updated_at', 'is_deleted'],
};

// ============================================================
// TEACHERS
// ============================================================

const teachersSchema: RxJsonSchema<TeacherDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    full_name: { type: 'string' },
    position: { type: 'string' },
    email: { type: 'string' },
    consultation_info: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'full_name', 'created_at', 'updated_at', 'is_deleted'],
};

// ============================================================
// SUBGROUP_CATEGORIES
// ============================================================

const subgroupCategoriesSchema: RxJsonSchema<SubgroupCategoryDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    code: { type: 'string' },
    name: { type: 'string' },
    short_name: { type: 'string' },
    description: { type: 'string' },
    sort_order: { type: 'integer' },
    is_required: { type: 'boolean' },
    is_archived: { type: 'boolean' },
    visible_if_subgroup_ids: subgroupIdsField,
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'code', 'name', 'sort_order', 'is_required', 'is_archived',
    'visible_if_subgroup_ids', 'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// SUBGROUPS
// ============================================================

const subgroupsSchema: RxJsonSchema<SubgroupDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    category_id: { type: 'string', maxLength: 36 },
    code: { type: 'string' },
    name: { type: 'string' },
    short_name: { type: 'string' },
    description: { type: 'string' },
    sort_order: { type: 'integer' },
    is_archived: { type: 'boolean' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'category_id', 'code', 'name', 'sort_order', 'is_archived',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// SCHEDULE (schedule_entries в Supabase)
// ============================================================

const scheduleSchema: RxJsonSchema<ScheduleEntryDoc> = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    day_of_week: { type: 'integer', minimum: 1, maximum: 6 },
    pair_number: pairNumberField,
    subject_id: { type: 'string' },
    entry_type: {
      type: 'string',
      enum: ['lecture', 'seminar', 'practice', 'other'],
    },
    teacher_id: { type: 'string' },
    room: { type: 'string' },
    target_subgroup_ids: subgroupIdsField,
    date_from: { type: 'string' },
    date_to: { type: 'string' },
    week_parity: {
      type: 'string',
      enum: ['all', 'odd', 'even'],
    },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'day_of_week', 'pair_number', 'subject_id', 'entry_type',
    'teacher_id', 'room', 'target_subgroup_ids',
    'date_from', 'date_to', 'week_parity',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// OVERRIDES (schedule_overrides в Supabase)
// ============================================================

const overridesSchema: RxJsonSchema<ScheduleOverrideDoc> = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    date: { type: 'string' },
    pair_number: pairNumberField,
    override_type: {
      type: 'string',
      enum: ['cancel', 'replace', 'add'],
    },
    target_subgroup_ids: subgroupIdsField,
    subject_id: { type: 'string' },
    entry_type: {
      type: 'string',
      enum: ['lecture', 'seminar', 'practice', 'other'],
    },
    teacher_id: { type: 'string' },
    room: { type: 'string' },
    comment: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'date', 'pair_number', 'override_type', 'target_subgroup_ids',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// EVENTS
// ============================================================

const eventsSchema: RxJsonSchema<EventDoc> = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    description: { type: 'string' },
    event_type: {
      type: 'string',
      enum: [
        'usr', 'control_work',
        'credit', 'exam', 'consultation', 'other',
      ],
    },
    subject_id: { type: 'string' },
    teacher_id: { type: 'string' },
    date: { type: 'string' },
    pair_number: pairNumberField,
    event_time: { type: 'string' },
    room: { type: 'string' },
    target_subgroup_ids: subgroupIdsField,
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'title', 'event_type', 'date', 'target_subgroup_ids',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// DEADLINES
// ============================================================

const deadlinesSchema: RxJsonSchema<DeadlineDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    subject_id: { type: 'string' },
    date: { type: 'string' },
    time: { type: 'string' },
    description: { type: 'string' },
    target_subgroup_ids: subgroupIdsField,
    is_deleted: { type: 'boolean' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
  required: [
    'id', 'date', 'target_subgroup_ids',
    'is_deleted', 'created_at', 'updated_at',
  ],
};

// ============================================================
// STUDENTS
// ============================================================

const studentsSchema: RxJsonSchema<StudentDoc> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    full_name: { type: 'string' },
    subgroup_ids: subgroupIdsField,
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'full_name', 'subgroup_ids', 'created_at', 'updated_at', 'is_deleted'],
};

// ============================================================
// SEMESTER (semester_config в Supabase)
// ============================================================

const semesterSchema: RxJsonSchema<SemesterConfigDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    start_date: { type: 'string' },
    end_date: { type: 'string' },
    odd_week_start: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
  required: ['id', 'name', 'start_date', 'end_date', 'odd_week_start', 'created_at', 'updated_at'],
};

// ============================================================
// HOMEWORKS
// ============================================================

const homeworksSchema: RxJsonSchema<HomeworkDoc> = {
  version: 2,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    subject_id: { type: 'string' },
    date: { type: 'string' },
    pair_number: pairNumberField,
    content: { type: 'string' },
    target_subgroup_ids: subgroupIdsField,
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'subject_id', 'date', 'pair_number', 'content', 'target_subgroup_ids',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// ЭКСПОРТ
// ============================================================

export const schemas = {
  subjects: subjectsSchema,
  teachers: teachersSchema,
  subgroup_categories: subgroupCategoriesSchema,
  subgroups: subgroupsSchema,
  schedule: scheduleSchema,
  overrides: overridesSchema,
  events: eventsSchema,
  deadlines: deadlinesSchema,
  students: studentsSchema,
  semester: semesterSchema,
  homeworks: homeworksSchema,
};