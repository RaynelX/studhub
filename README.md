# StudHub

<p align="center">
	<img src="./public/icons/icon.svg" alt="StudHub icon" width="110" height="110" />
</p>

<p align="center">
	<strong>Offline-first PWA для студентов 81-й группы Социальных коммуникаций</strong><br/>
	Расписание, пары, дедлайны, события, посещаемость и учебные материалы в одном месте.
</p>

<p align="center">
	<img alt="React 19" src="https://img.shields.io/badge/React-19-111827?logo=react&logoColor=61DAFB" />
	<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-111827?logo=typescript&logoColor=3178C6" />
	<img alt="Vite" src="https://img.shields.io/badge/Vite-7-111827?logo=vite&logoColor=646CFF" />
	<img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-111827?logo=supabase&logoColor=3ECF8E" />
	<img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-111827?logo=vercel&logoColor=white" />
</p>

---

## О проекте

**StudHub** - это SPA/PWA приложение для студентов группы, где можно быстро получить актуальную информацию по учебному процессу:

- расписание на день и неделю;
- замены и отмены пар;
- события, контрольные, зачеты, экзамены;
- дедлайны и домашние задания;
- посещаемость;
- ссылки на материалы;
- push-уведомления.

## Основные возможности

- **Offline-first режим**: данные кэшируются локально (RxDB + Dexie), приложение остается полезным даже без интернета.
- **Односторонняя синхронизация**: данные подтягиваются из Supabase в локальную базу на клиенте.
- **PWA-установка**: можно установить на телефон как обычное приложение.
- **Push-уведомления**: интеграция с OneSignal + пользовательские настройки уведомлений.
- **Админ-панель**: отдельные маршруты и экран логина для административных задач.
- **Мобильный UX**: touch-friendly интерфейс и ориентация на использование с телефона.

## Технологический стек

- **Frontend**: React 19, TypeScript, React Router 7
- **Build**: Vite 7
- **Styling**: Tailwind CSS v4
- **Client DB**: RxDB + Dexie storage
- **Backend/Data source**: Supabase (read-only pull)
- **Notifications**: OneSignal (`react-onesignal`)
- **PWA**: `vite-plugin-pwa`

## Архитектура проекта

```text
src/
	app/        # Shell: страницы, layout, router, провайдеры
	features/   # Функциональные модули (schedule, settings, notifications, ...)
	database/   # RxDB: схемы, типы, hooks, sync engine
	shared/     # Переиспользуемые UI-компоненты и константы
	lib/        # Клиенты внешних сервисов (Supabase)
```

### Коллекции локальной базы

- `subjects`
- `teachers`
- `schedule`
- `overrides`
- `events`
- `deadlines`
- `students`
- `semester`
- `homeworks`

## PWA и offline

- Включен `registerType: 'prompt'` для контролируемых обновлений Service Worker.
- Манифест и иконки лежат в `public/icons`.
- После первой синхронизации данные доступны локально через RxDB.

## Статус

Проект находится в активной разработке.

> Written by Claude.
> Checked, reviewed and tested by me.