# Tracker Monorepo

[![CI](https://github.com/minkinad/tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/minkinad/tracker/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/minkinad/tracker)](https://github.com/minkinad/tracker/blob/main/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.11.1-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15.4-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

Профессиональный task tracker в монорепозитории: Next.js-фронтенд, NestJS API, PostgreSQL, Prisma, Redis, Socket.IO и Docker Compose. Проект ориентирован на рабочий UX современных трекеров: обзор, kanban-доска, список задач, аналитика, realtime-обновления и полноценная карточка задачи.

## Стек

- Монорепозиторий: `pnpm workspaces`
- Frontend: `Next.js App Router`, `React Query`, `Zustand`, `@dnd-kit`, `framer-motion`
- Backend: `NestJS`, REST API, WebSocket gateway
- Database: `PostgreSQL` + `Prisma`
- Cache: `Redis`
- Realtime: `Socket.IO`
- Shared packages: Prisma client, DTO/types, UI primitives
- Infra: Docker, Docker Compose, Nginx

## Что реализовано

- JWT-аутентификация с refresh-token rotation.
- Организации, проекты, пользователи и роли.
- CRUD задач: статус, приоритет, исполнитель, описание, комментарии, активность.
- Фильтрация задач по поиску, статусу, приоритету и исполнителю.
- Kanban-доска с drag-and-drop сменой статуса.
- Realtime-инвалидация задач через Socket.IO.
- Redis-кеш для списков задач.
- Docker-запуск всего окружения через Nginx.
- API-first фронтенд без старого localStorage/demo-store слоя.

## Структура

```text
.
├── apps
│   ├── api
│   │   ├── src
│   │   │   ├── common
│   │   │   │   ├── auth
│   │   │   │   ├── logging
│   │   │   │   ├── prisma
│   │   │   │   └── redis
│   │   │   ├── modules
│   │   │   │   ├── auth
│   │   │   │   ├── organizations
│   │   │   │   ├── projects
│   │   │   │   ├── realtime
│   │   │   │   ├── tasks
│   │   │   │   └── users
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   └── docker-entrypoint.sh
│   └── web
│       ├── src
│       │   ├── app
│       │   │   ├── analytics
│       │   │   ├── boards
│       │   │   └── tasks
│       │   ├── features
│       │   │   ├── auth
│       │   │   ├── board-filter
│       │   │   ├── project-create
│       │   │   ├── task-create
│       │   │   └── theme-toggle
│       │   ├── lib
│       │   ├── shared
│       │   ├── store
│       │   └── widgets
│       │       ├── analytics
│       │       ├── kanban-board
│       │       ├── overview
│       │       ├── task-detail
│       │       ├── tasks-table
│       │       └── workspace-shell
│       └── Dockerfile
├── packages
│   ├── db
│   │   ├── prisma
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/index.ts
│   ├── types
│   │   └── src/index.ts
│   └── ui
│       └── src/lib
├── nginx/default.conf
├── docker-compose.yml
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Ключевые файлы

- `apps/api/src/app.module.ts` — композиция NestJS-модулей и middleware.
- `apps/api/src/modules/auth/auth.service.ts` — login, refresh-token rotation и сессии.
- `apps/api/src/modules/tasks/tasks.service.ts` — бизнес-логика задач, кеш, активность и realtime.
- `apps/api/src/modules/realtime/realtime.gateway.ts` — Socket.IO namespace для задач.
- `packages/db/prisma/schema.prisma` — Prisma-схема пользователей, организаций, проектов, задач, комментариев и refresh tokens.
- `packages/db/prisma/seed.ts` — демо-данные для локального запуска.
- `packages/types/src/index.ts` — общие DTO и контракты API.
- `apps/web/src/widgets/workspace-shell/ui/workspace-shell.tsx` — тонкий layout рабочего пространства, иконный rail и контекстные панели.
- `apps/web/src/widgets/workspace-shell/model/use-workspace-data.ts` — загрузка workspace-данных, выбор организации/проекта, фильтры и realtime.
- `apps/web/src/widgets/workspace-shell/lib/task-utils.ts` — переиспользуемые вычисления по задачам без привязки к UI.
- `apps/web/src/widgets/overview/ui/overview-content.tsx` — главная страница без монолитного shell-компонента.
- `apps/web/src/widgets/tasks-table/ui/tasks-table.tsx` — список задач как отдельный масштабируемый виджет.
- `apps/web/src/widgets/analytics/ui/analytics-content.tsx` — аналитика проекта как отдельный виджет.
- `apps/web/src/widgets/kanban-board/ui/kanban-board.tsx` — kanban-доска и drag-and-drop.
- `apps/web/src/widgets/task-detail/ui/task-detail-page.tsx` — отдельная страница задачи: редактирование, комментарии, история, связанные задачи.
- `apps/web/src/lib/api-client.ts` — auth-aware API client с refresh-token retry.
- `apps/web/src/lib/use-task-realtime.ts` — realtime-подписка на изменения задач.

## Frontend UX

Новый фронтенд построен вокруг routed workspace `Tracker Pro`, а не single-page переключателя вкладок:

- `/` — главная: фокус очереди, статусы и последние изменения.
- `/boards` — отдельная kanban-доска с переносом задач между статусами.
- `/tasks` — отдельный список задач для поиска, фильтрации и triage.
- `/tasks/[taskId]` — полноценная страница задачи с редактированием, комментариями, историей активности и контекстом.
- `/analytics` — отдельная аналитика workflow и нагрузки команды.
- Левый сайдбар — фиксированный нескроллящийся rail только с иконками; тематическая информация открывается в соседней панели по клику.
- Проекты не занимают отдельный текстовый блок в rail: иконка проектов открывает список, выбор проекта переключает контекст и ведёт в задачи.
- `Quick create` — быстрое создание задачи прямо из рабочей области.
- Облегчённый UI — меньше тяжёлых контейнеров, карточек и теней; основные экраны строятся на сетке, разделителях и рабочей типографике.

Старый legacy-слой удалён: больше нет demo localStorage repository, старого sliced Zustand-store, undo-toast, локальных entity-моделей старого single-app прототипа, SPA `AppShell` и task modal. Единственный клиентский store сейчас отвечает за сессию, выбранную организацию/проект и фильтры.

## Frontend Architecture

Frontend следует простой масштабируемой схеме:

- `app` — только маршруты и композиция страниц.
- `features` — пользовательские действия: авторизация, фильтры, создание проекта/задачи.
- `widgets` — крупные независимые секции экрана: workspace shell, overview, доска, список, аналитика, task detail.
- `widgets/*/model` — data hooks и состояние конкретного виджета.
- `widgets/*/lib` — чистые функции и вычисления.
- `widgets/*/config` — навигация, статические настройки и декларативные списки.
- `shared` — общие UI-иконки, конфиги и утилиты.

## Backend

Backend разделён на понятные слои:

- Controllers отвечают за HTTP-контракты.
- Services держат бизнес-логику и проверки доступа.
- Repositories инкапсулируют Prisma-запросы.
- Common-инфраструктура держит auth guards, Prisma, Redis и logging middleware.

API по умолчанию живёт под префиксом `/api`, Swagger доступен по `/api/docs`.

## Локальный запуск без Docker

1. Установить зависимости:

```bash
pnpm install
```

2. Подготовить переменные окружения:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Рекомендуемые значения для локального режима:

- `apps/api/.env`: `DATABASE_URL=postgresql://tracker:tracker@localhost:5432/tracker?schema=public`
- `apps/api/.env`: `REDIS_URL=redis://localhost:6379`
- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- `apps/web/.env.local`: `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`

3. Запустить PostgreSQL и Redis:

```bash
docker compose up -d postgres redis
```

4. Подготовить базу:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

5. Запустить приложения:

```bash
pnpm dev
```

Локальные адреса:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api/docs`

Демо-доступ:

- Email: `owner@tracker.local`
- Password: `changeme123`

## Docker-запуск

```bash
docker compose up --build -d
```

Адреса в Docker-режиме:

- Nginx entrypoint: `http://localhost:8080`
- Web: `http://localhost:8080`
- API: `http://localhost:8080/api`
- Socket.IO: `http://localhost:8080/socket.io`

API-контейнер при старте применяет Prisma schema через `prisma db push` и засевает демо-данные. Для остановки и очистки volume:

```bash
docker compose down -v
```

## Проверки

```bash
pnpm typecheck
pnpm test
pnpm build
```

Отдельно для фронтенда:

```bash
pnpm --filter @tracker/web typecheck
pnpm --filter @tracker/web build
```

Smoke-check после Docker:

```bash
curl -i http://localhost:8080/
curl -i -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@tracker.local","password":"changeme123"}'
```

## Команды

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm test
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm docker:up
pnpm docker:down
```

## Правила проекта

- Комментарии в коде пишем на русском языке.
- Не возвращаем legacy localStorage/demo-store слой во фронтенд.
- Frontend должен работать через API-контракты из `packages/types`.
- Для задач с данными сначала обновляем backend/DTO, затем frontend.
- Prisma warning про `package.json#prisma` пока не блокирует запуск, но перед переходом на Prisma 7 конфигурацию нужно вынести в `prisma.config.ts`.

## Деплой

### Один сервер с Docker Compose

1. Подготовить Linux-хост с Docker и Docker Compose.
2. Скопировать репозиторий и создать production `.env`.
3. Задать сильные `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`.
4. Настроить публичные `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` и `CORS_ORIGIN`.
5. Выполнить `docker compose up -d --build`.
6. Поставить TLS перед Nginx или заменить его внешним reverse proxy.

### Managed services

1. Вынести PostgreSQL и Redis в managed-сервисы.
2. Собирать `apps/api` и `apps/web` как отдельные контейнеры.
3. Прогонять Prisma migrations на релизе.
4. Маршрутизировать `/api` и `/socket.io` в API.
5. Маршрутизировать `/` в Next.js web.
6. Держать `CORS_ORIGIN` равным публичному origin фронтенда.
