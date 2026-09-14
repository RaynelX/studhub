-- ============================================================
-- 0003: удаление захардкоженной тройки таргетинга
-- ============================================================
-- ВНИМАНИЕ: запускать только после того, как выкачено приложение
-- с новой системой подгрупп. Клиенты со старой закешированной
-- версией PWA после этой миграции увидят пустое расписание,
-- пока не нажмут «Обновить».
-- ============================================================

alter table public.schedule_entries
  drop column if exists target_language,
  drop column if exists target_eng_subgroup,
  drop column if exists target_oit_subgroup;

alter table public.schedule_overrides
  drop column if exists target_language,
  drop column if exists target_eng_subgroup,
  drop column if exists target_oit_subgroup;

alter table public.events
  drop column if exists target_language,
  drop column if exists target_eng_subgroup,
  drop column if exists target_oit_subgroup;

alter table public.deadlines
  drop column if exists target_language,
  drop column if exists target_eng_subgroup,
  drop column if exists target_oit_subgroup;

alter table public.homeworks
  drop column if exists target_language,
  drop column if exists target_eng_subgroup,
  drop column if exists target_oit_subgroup;

alter table public.students
  drop column if exists language,
  drop column if exists eng_subgroup,
  drop column if exists oit_subgroup;
