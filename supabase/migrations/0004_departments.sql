-- ============================================================
-- 0004: кафедры факультета
-- ============================================================
-- Справочник кафедр + ссылка на кафедру у преподавателя.
-- Раньше кафедра социальной коммуникации была захардкожена в коде
-- (список из 13 UUID преподавателей и контакты прямо в JSX).
--
-- Таблица статична в течение семестра: клиент тянет её не чаще
-- раза в сутки (syncIntervalMs в src/database/sync/sync-engine.ts).
--
-- Файл идемпотентен — повторный прогон безопасен.
-- ============================================================

create table if not exists public.departments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  -- Заведующий кафедрой. on delete set null: удаление преподавателя
  -- не должно ронять запись кафедры.
  head_teacher_id uuid references public.teachers (id) on delete set null,
  room            text,
  phone           text,
  email           text,
  -- Кафедра своей группы: именно её студент видит на вкладке «Кафедра».
  -- Сейчас ровно одна — кафедра социальной коммуникации.
  is_primary      boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  is_deleted      boolean not null default false
);

create index if not exists departments_updated_at_idx
  on public.departments (updated_at);

alter table public.teachers
  add column if not exists department_id uuid references public.departments (id) on delete set null;

create index if not exists teachers_department_id_idx
  on public.teachers (department_id);

-- ============================================================
-- Кафедры факультета философии и социальных наук
-- ============================================================
-- Фиксированные id, чтобы скрипт можно было прогнать повторно
-- и чтобы на них можно было сослаться ниже.

insert into public.departments (id, name, room, phone, email, is_primary, sort_order)
values
  ('d0000000-0000-4000-8000-000000000001', 'Кафедра социальной коммуникации',
   '433', '+375 17 259 70 39', 'sociocom@bsu.by', true, 0),
  ('d0000000-0000-4000-8000-000000000002', 'Кафедра социологии',
   null, null, null, false, 1),
  ('d0000000-0000-4000-8000-000000000003', 'Кафедра философии и методологии науки',
   null, null, null, false, 2),
  ('d0000000-0000-4000-8000-000000000004', 'Кафедра философии культуры',
   null, null, null, false, 3),
  ('d0000000-0000-4000-8000-000000000005', 'Кафедра социальной и организационной психологии',
   null, null, null, false, 4),
  ('d0000000-0000-4000-8000-000000000006', 'Кафедра общей и медицинской психологии',
   null, null, null, false, 5)
on conflict (id) do nothing;

-- ============================================================
-- Перенос состава кафедры социальной коммуникации
-- ============================================================
-- Те самые 13 преподавателей, что были захардкожены в DepartmentSection.
-- updated_at двигаем намеренно: синхронизация инкрементальная, без этого
-- у уже установленных клиентов новая колонка не появилась бы.

update public.teachers
set department_id = 'd0000000-0000-4000-8000-000000000001',
    updated_at = now()
where department_id is null
  and id in (
    '0687bb06-2591-48d5-b275-53cb4ba7740c',
    '0c075306-437a-421d-a16b-41bc40cccef3',
    '17270609-48f8-4460-8790-9ce7fc278dba',
    '2c32af13-4d50-4821-9ffe-3e313ef336bc',
    '2c470e9d-1986-4a78-b424-49629eeec54d',
    '536b57c7-6777-4b83-ae4d-28fe07518d5f',
    '87f92d70-2ab1-4b35-80f0-7f742d43380b',
    'a7722f2a-6780-4ed3-96c5-c632c415b32d',
    'cc7e312c-d5e8-44f6-a084-06f43dd27b03',
    'e81c5b81-134b-41e8-878f-d41e644292ff',
    'f12a3a4f-8fc4-402a-8629-f51de03c34b4',
    'fe664717-59d8-44d0-8377-e51c9b6ec4f7',
    '37c31871-3c0f-493b-a7a8-4db75ecf551f'
  );

-- ============================================================
-- ЗАПОЛНИТЬ ВРУЧНУЮ: заведующий кафедрой
-- ============================================================
-- Пока поле пустое, строка «Заведующий кафедрой» в приложении не рендерится.
-- Подставьте ФИО ровно так, как оно записано в public.teachers.full_name,
-- раскомментируйте и выполните:
--
-- update public.departments
-- set head_teacher_id = (
--       select id from public.teachers
--       where full_name = 'Фамилия Имя Отчество' and is_deleted = false
--     ),
--     updated_at = now()
-- where id = 'd0000000-0000-4000-8000-000000000001';

-- ============================================================
-- RLS: читают все (anon), пишет любой аутентифицированный пользователь.
-- Та же модель доступа, что у остальных таблиц проекта (см. 0001).
-- ============================================================

alter table public.departments enable row level security;

drop policy if exists "departments_select_anon" on public.departments;
create policy "departments_select_anon"
  on public.departments for select
  to anon, authenticated
  using (true);

drop policy if exists "departments_write_auth" on public.departments;
create policy "departments_write_auth"
  on public.departments for all
  to authenticated
  using (true)
  with check (true);
