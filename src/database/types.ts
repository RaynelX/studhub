import type { RxCollection, RxDatabase } from 'rxdb';
import type { TargetCategory, TargetSubgroup } from '../shared/targeting/types';

// ============================================================
// Перечисления
// ============================================================

export type EntryType = 'lecture' | 'seminar' | 'practice' | 'other';
export type WeekParity = 'all' | 'odd' | 'even';
export type OverrideType = 'cancel' | 'replace' | 'add';
export type EventType =
  | 'usr'
  | 'control_work'
  | 'credit'
  | 'exam'
  | 'consultation'
  | 'other';

// ============================================================
// Документы (типы записей в RxDB)
// ============================================================

export interface SubjectDoc {
  id: string;
  name: string;
  short_name?: string;
  sdo_url?: string;
  additional_links?: AdditionalLink[];
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface AdditionalLink {
  label: string;
  url: string;
}

export interface TeacherDoc {
  id: string;
  full_name: string;
  position?: string;
  email?: string;
  consultation_info?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

/**
 * Категория деления группы («Иностранный язык», «ОИТ»).
 * Набор категорий и подгрупп — данные, а не код: староста заводит их заново
 * каждый семестр из админки.
 */
export interface SubgroupCategoryDoc extends TargetCategory {
  /** Стабильный слаг: OneSignal-теги вида sg_<code>, отладка */
  code: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

/** Вариант внутри категории («Английский», «Подгруппа А»). */
export interface SubgroupDoc extends TargetSubgroup {
  code: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface ScheduleEntryDoc {
  id: string;
  day_of_week: number;
  pair_number: number;
  subject_id: string;
  entry_type: EntryType;
  teacher_id: string;
  room: string;
  /** Подгруппы, которым адресована запись. Пусто — вся группа. */
  target_subgroup_ids: string[];
  date_from: string;
  date_to: string;
  week_parity: WeekParity;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface ScheduleOverrideDoc {
  id: string;
  date: string;
  pair_number: number;
  override_type: OverrideType;
  target_subgroup_ids: string[];
  subject_id?: string;
  entry_type?: EntryType;
  teacher_id?: string;
  room?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface EventDoc {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  subject_id?: string;
  teacher_id?: string;
  date: string;
  pair_number?: number;
  event_time?: string;
  room?: string;
  target_subgroup_ids: string[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface DeadlineDoc {
  id: string;
  subject_id?: string;
  date: string;
  time?: string;
  description?: string;
  target_subgroup_ids: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentDoc {
  id: string;
  full_name: string;
  /** Подгруппы студента — по одной на каждую видимую ему категорию */
  subgroup_ids: string[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface HomeworkDoc {
  id: string;
  subject_id: string;
  date: string;
  pair_number: number;
  content: string;
  target_subgroup_ids: string[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SemesterConfigDoc {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  odd_week_start: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Типы базы данных
// ============================================================

export type DatabaseCollections = {
  subjects: RxCollection<SubjectDoc>;
  teachers: RxCollection<TeacherDoc>;
  subgroup_categories: RxCollection<SubgroupCategoryDoc>;
  subgroups: RxCollection<SubgroupDoc>;
  schedule: RxCollection<ScheduleEntryDoc>;
  overrides: RxCollection<ScheduleOverrideDoc>;
  events: RxCollection<EventDoc>;
  deadlines: RxCollection<DeadlineDoc>;
  students: RxCollection<StudentDoc>;
  semester: RxCollection<SemesterConfigDoc>;
  homeworks: RxCollection<HomeworkDoc>;
};

export type AppDatabase = RxDatabase<DatabaseCollections>;