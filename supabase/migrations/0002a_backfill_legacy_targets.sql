-- ============================================================
-- 0002a (ОПЦИОНАЛЬНО): перенос старой тройки таргетинга в подгруппы
-- ============================================================
-- Запускать ТОЛЬКО если нужно сохранить нацеленность прошлого семестра:
-- скрипт заводит категории «Иностранный язык», «Подгруппа по английскому»
-- и «ОИТ» с прежними вариантами и конвертирует в них
-- target_language / target_eng_subgroup / target_oit_subgroup,
-- а также language / eng_subgroup / oit_subgroup у студентов.
--
-- Если в новом семестре деление другое — этот файл НЕ запускать:
-- старые записи всё равно будут перенацелены или удалены вместе с семестром,
-- а студентов не нужно спрашивать про несуществующие подгруппы.
--
-- Скрипт идемпотентен: повторный запуск ничего не ломает.
-- Выбор студентов в localStorage не переносится в любом случае —
-- подгруппы они выбирают заново при первом открытии приложения.
-- ============================================================

do $$
declare
  -- Фиксированные id, чтобы скрипт можно было прогнать повторно
  cat_lang constant uuid := 'a0000000-0000-4000-8000-000000000001';
  cat_eng  constant uuid := 'a0000000-0000-4000-8000-000000000002';
  cat_oit  constant uuid := 'a0000000-0000-4000-8000-000000000003';

  sg_lang_en constant uuid := 'b0000000-0000-4000-8000-000000000011';
  sg_lang_de constant uuid := 'b0000000-0000-4000-8000-000000000012';
  sg_lang_fr constant uuid := 'b0000000-0000-4000-8000-000000000013';
  sg_lang_es constant uuid := 'b0000000-0000-4000-8000-000000000014';
  sg_eng_a   constant uuid := 'b0000000-0000-4000-8000-000000000021';
  sg_eng_b   constant uuid := 'b0000000-0000-4000-8000-000000000022';
  sg_oit_a   constant uuid := 'b0000000-0000-4000-8000-000000000031';
  sg_oit_b   constant uuid := 'b0000000-0000-4000-8000-000000000032';

  target_table text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'schedule_entries'
      and column_name = 'target_language'
  ) then
    raise notice 'Старые колонки target_* уже удалены — переносить нечего, пропускаю.';
    return;
  end if;

  -- ── Категории ───────────────────────────────────────────

  insert into public.subgroup_categories
    (id, code, name, short_name, description, sort_order, is_required, visible_if_subgroup_ids)
  values
    (cat_lang, 'lang', 'Иностранный язык', 'Яз', 'Выберите язык, который вы изучаете', 0, true, '{}'),
    (cat_eng,  'eng',  'Подгруппа по английскому', 'Англ', 'Выберите вашего преподавателя', 1, true, array[sg_lang_en]),
    (cat_oit,  'oit',  'ОИТ', 'ОИТ', 'Основы информационных технологий', 2, true, '{}')
  on conflict (id) do nothing;

  -- ── Подгруппы ───────────────────────────────────────────

  insert into public.subgroups (id, category_id, code, name, short_name, sort_order)
  values
    (sg_lang_en, cat_lang, 'en', 'Английский',   'EN', 0),
    (sg_lang_de, cat_lang, 'de', 'Немецкий',     'DE', 1),
    (sg_lang_fr, cat_lang, 'fr', 'Французский',  'FR', 2),
    (sg_lang_es, cat_lang, 'es', 'Испанский',    'ES', 3),
    (sg_eng_a,   cat_eng,  'a',  'Подгруппа А',  'А',  0),
    (sg_eng_b,   cat_eng,  'b',  'Подгруппа Б',  'Б',  1),
    (sg_oit_a,   cat_oit,  'a',  'Подгруппа А',  'А',  0),
    (sg_oit_b,   cat_oit,  'b',  'Подгруппа Б',  'Б',  1)
  on conflict (id) do nothing;

  -- ── Записи: тройка → массив ─────────────────────────────
  -- 'all' в старой колонке = «не ограничивает», поэтому просто не попадает
  -- в массив. Заполняем только те строки, где новое поле ещё пустое.

  foreach target_table in array array[
    'schedule_entries', 'schedule_overrides', 'events', 'deadlines', 'homeworks'
  ] loop
    execute format($f$
      update public.%I set target_subgroup_ids =
        (case target_language
           when 'en' then array[%L::uuid] when 'de' then array[%L::uuid]
           when 'fr' then array[%L::uuid] when 'es' then array[%L::uuid]
           else '{}'::uuid[] end)
        ||
        (case target_eng_subgroup
           when 'a' then array[%L::uuid] when 'b' then array[%L::uuid]
           else '{}'::uuid[] end)
        ||
        (case target_oit_subgroup
           when 'a' then array[%L::uuid] when 'b' then array[%L::uuid]
           else '{}'::uuid[] end)
      where target_subgroup_ids = '{}'::uuid[]
    $f$,
      target_table,
      sg_lang_en, sg_lang_de, sg_lang_fr, sg_lang_es,
      sg_eng_a, sg_eng_b,
      sg_oit_a, sg_oit_b
    );
  end loop;

  -- ── Студенты ────────────────────────────────────────────

  update public.students set subgroup_ids =
    (case language
       when 'en' then array[sg_lang_en] when 'de' then array[sg_lang_de]
       when 'fr' then array[sg_lang_fr] when 'es' then array[sg_lang_es]
       else '{}'::uuid[] end)
    ||
    (case when language = 'en' and eng_subgroup = 'a' then array[sg_eng_a]
          when language = 'en' and eng_subgroup = 'b' then array[sg_eng_b]
          else '{}'::uuid[] end)
    ||
    (case oit_subgroup
       when 'a' then array[sg_oit_a] when 'b' then array[sg_oit_b]
       else '{}'::uuid[] end)
  where subgroup_ids = '{}'::uuid[];

  -- Клиенты должны перекачать изменённые строки
  update public.schedule_entries   set updated_at = now() where target_subgroup_ids <> '{}'::uuid[];
  update public.schedule_overrides set updated_at = now() where target_subgroup_ids <> '{}'::uuid[];
  update public.events             set updated_at = now() where target_subgroup_ids <> '{}'::uuid[];
  update public.deadlines          set updated_at = now() where target_subgroup_ids <> '{}'::uuid[];
  update public.homeworks          set updated_at = now() where target_subgroup_ids <> '{}'::uuid[];
  update public.students           set updated_at = now() where subgroup_ids <> '{}'::uuid[];

  raise notice 'Перенос старой нацеленности завершён.';
end $$;
