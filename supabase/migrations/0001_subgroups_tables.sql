-- ============================================================
-- 0001: гибкая система подгрупп — категории и подгруппы
-- ============================================================
-- Категория — «измерение» деления группы (Иностранный язык, ОИТ, Элективный курс).
-- Подгруппа — вариант внутри категории (Английский, Подгруппа А).
-- Студент состоит ровно в одной подгруппе каждой видимой категории.
-- ============================================================

create table if not exists public.subgroup_categories (
  id          uuid primary key default gen_random_uuid(),
  -- Стабильный слаг: используется в OneSignal-тегах (sg_<code>) и при отладке.
  code        text not null,
  name        text not null,
  short_name  text,
  description text,
  sort_order  integer not null default 0,
  -- Обязана ли быть выбрана подгруппа этой категории.
  is_required boolean not null default true,
  -- Архивная категория не предлагается студенту и не появляется в формах,
  -- но старые записи, нацеленные на её подгруппы, продолжают резолвиться.
  is_archived boolean not null default false,
  -- Категория спрашивается, только если студент уже выбрал одну из этих подгрупп.
  -- Пустой массив = спрашивать всегда.
  visible_if_subgroup_ids uuid[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  is_deleted  boolean not null default false
);

create unique index if not exists subgroup_categories_code_key
  on public.subgroup_categories (code)
  where is_deleted = false;

create index if not exists subgroup_categories_updated_at_idx
  on public.subgroup_categories (updated_at);

create table if not exists public.subgroups (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.subgroup_categories (id) on delete restrict,
  code        text not null,
  name        text not null,
  short_name  text,
  -- Подсказка для студента: фамилия преподавателя, аудитория и т.п.
  description text,
  sort_order  integer not null default 0,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  is_deleted  boolean not null default false
);

create unique index if not exists subgroups_category_code_key
  on public.subgroups (category_id, code)
  where is_deleted = false;

create index if not exists subgroups_category_id_idx
  on public.subgroups (category_id);

create index if not exists subgroups_updated_at_idx
  on public.subgroups (updated_at);

-- ============================================================
-- RLS: читают все (anon), пишет любой аутентифицированный пользователь.
--
-- ВНИМАНИЕ: это ровно та же модель доступа, что у остальных таблиц проекта
-- (subjects, teachers, schedule_entries…) и у ProtectedRoute в приложении:
-- «аутентифицирован» = «староста». Отдельной роли администратора нет.
-- Поэтому любой, кто сможет зарегистрироваться в этом проекте Supabase,
-- получит право менять подгруппы и, через них, видимость расписания.
--
-- Если это не устраивает — закрывать надо не только эти две таблицы,
-- а все сразу, одним из способов:
--   * отключить самостоятельную регистрацию (Auth → Providers → Email →
--     «Allow new users to sign up» = off) — самое простое и обычно достаточное;
--   * либо завести роль в app_metadata и заменить `using (true)` на
--     `using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')` во всех
--     write-политиках проекта.
-- Здесь сознательно оставлена та же политика, что у соседних таблиц:
-- ужесточать только подгруппы бессмысленно.
-- ============================================================

alter table public.subgroup_categories enable row level security;
alter table public.subgroups enable row level security;

drop policy if exists "subgroup_categories_select_anon" on public.subgroup_categories;
create policy "subgroup_categories_select_anon"
  on public.subgroup_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "subgroup_categories_write_auth" on public.subgroup_categories;
create policy "subgroup_categories_write_auth"
  on public.subgroup_categories for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "subgroups_select_anon" on public.subgroups;
create policy "subgroups_select_anon"
  on public.subgroups for select
  to anon, authenticated
  using (true);

drop policy if exists "subgroups_write_auth" on public.subgroups;
create policy "subgroups_write_auth"
  on public.subgroups for all
  to authenticated
  using (true)
  with check (true);
