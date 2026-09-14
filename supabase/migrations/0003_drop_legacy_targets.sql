-- ============================================================
-- 0003: удаление захардкоженной тройки таргетинга
-- ============================================================
-- ВНИМАНИЕ: запускать только после того, как выкачено приложение
-- с новой системой подгрупп. Клиенты со старой закешированной
-- версией PWA после этой миграции увидят пустое расписание,
-- пока не нажмут «Обновить».
--
-- Операция необратима. Проверка ниже не даст удалить колонки, пока есть
-- строки со старой нацеленностью, не перенесённой в target_subgroup_ids:
-- иначе пара одной подгруппы молча стала бы парой всей группы, а состав
-- подгрупп у студентов пропал бы без следа.
--
-- Два способа пройти проверку:
--   1) перенести данные — запустить 0002a_backfill_legacy_targets.sql;
--   2) осознанно выбросить старую нацеленность (например, старый семестр
--      всё равно удаляется целиком) — выполнить в том же окне SQL Editor
--      перед этим файлом:
--
--          set studhub.discard_legacy_targets = 'yes';
-- ============================================================

do $$
declare
  stale_table text;
  stale_count bigint;
  total bigint := 0;
begin
  if current_setting('studhub.discard_legacy_targets', true) = 'yes' then
    raise notice 'Старая нацеленность выбрасывается осознанно — проверка пропущена.';
    return;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'schedule_entries'
      and column_name = 'target_language'
  ) then
    return; -- колонки уже удалены, миграция повторная
  end if;

  foreach stale_table in array array[
    'schedule_entries', 'schedule_overrides', 'events', 'deadlines', 'homeworks'
  ] loop
    execute format($f$
      select count(*) from public.%I
      where is_deleted = false
        and target_subgroup_ids = '{}'::uuid[]
        and (target_language <> 'all'
          or target_eng_subgroup <> 'all'
          or target_oit_subgroup <> 'all')
    $f$, stale_table) into stale_count;

    if stale_count > 0 then
      raise notice '  %: % строк(и) со старой нацеленностью', stale_table, stale_count;
      total := total + stale_count;
    end if;
  end loop;

  select count(*) into stale_count
  from public.students
  where is_deleted = false
    and subgroup_ids = '{}'::uuid[]
    and (language is not null or eng_subgroup is not null or oit_subgroup is not null);

  if stale_count > 0 then
    raise notice '  students: % строк(и) без подгрупп', stale_count;
    total := total + stale_count;
  end if;

  if total > 0 then
    raise exception
      'Нацеленность % строк(и) не перенесена в target_subgroup_ids. Запустите 0002a_backfill_legacy_targets.sql либо выполните "set studhub.discard_legacy_targets = ''yes'';", если старые данные не нужны.',
      total;
  end if;
end $$;

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
