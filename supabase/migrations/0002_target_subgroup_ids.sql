-- ============================================================
-- 0002: новое поле таргетинга вместо тройки target_language /
--       target_eng_subgroup / target_oit_subgroup
-- ============================================================
-- Пустой массив = запись для всей группы.
-- Непустой = запись видна тем, чей выбор совпадает по каждой
-- категории, упомянутой в массиве.
-- ============================================================

alter table public.schedule_entries
  add column if not exists target_subgroup_ids uuid[] not null default '{}';

alter table public.schedule_overrides
  add column if not exists target_subgroup_ids uuid[] not null default '{}';

alter table public.events
  add column if not exists target_subgroup_ids uuid[] not null default '{}';

alter table public.deadlines
  add column if not exists target_subgroup_ids uuid[] not null default '{}';

alter table public.homeworks
  add column if not exists target_subgroup_ids uuid[] not null default '{}';

-- Студент: его собственные подгруппы (по одной на категорию).
alter table public.students
  add column if not exists subgroup_ids uuid[] not null default '{}';
