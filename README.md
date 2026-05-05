# Tracker

[![CI](https://github.com/minkinad/tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/minkinad/tracker/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/minkinad/tracker?color=000000)](https://github.com/minkinad/tracker/blob/main/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.11.1-000000?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15.4-000000?logo=pnpm&logoColor=white)](https://pnpm.io/)

Монорепозиторий task tracker: `Next.js`-frontend, `NestJS` API, `PostgreSQL` + `Prisma`, `Redis`, `Socket.IO`, `Docker Compose` и `Nginx`.

Проект уже содержит рабочий контур для командной работы:

- JWT-аутентификация с refresh-token rotation
- организации, участники, роли и проекты
- CRUD задач, комментарии и история активности
- список задач с фильтрами и kanban-доска
- realtime-инвалидация задач через Socket.IO
- отдельные экраны обзора, задач, досок, аналитики и карточки задачи

## Состав репозитория

```text
apps/
  api/     NestJS API
  web/     Next.js App Router frontend
packages/
  db/      Prisma schema, generate, seed
  types/   общие DTO и контракты
  ui/      базовые UI-компоненты
```

## Текущий стек

- Node.js `>=20.11.1`
- pnpm `9.15.4`
- Frontend: `Next.js 15`, `React 19`, `React Query 5`, `Zustand`, `@dnd-kit`, `framer-motion`
- Backend: `NestJS 11`, `Socket.IO 4`
- Data: `PostgreSQL 16`, `Prisma 6`, `Redis 7`
- Infra: `Docker Compose`, `Nginx`

## Что есть в приложении

### Frontend

- `/` — главная сводка проекта
- `/pages/my` — стартовая страница рабочего пространства
- `/tasks` — список задач с фильтрами и scope-переключателями
- `/tasks/[taskId]` — детальная карточка задачи
- `/boards` — kanban-доска
- `/analytics` — аналитика по текущему проекту

Рабочее пространство построено вокруг `WorkspacePage`: он решает авторизацию, гидрацию client state, загрузку организации, проекта, пользователей и задач, а также realtime-подписку.

### Backend

API поднимается с префиксом `/api`, Swagger доступен по `/api/docs`.

Основные модули:

- `auth` — login, refresh, `me`
- `organizations` — список доступных организаций
- `projects` — список и создание проектов
- `tasks` — список, создание, обновление, комментарии, активность
- `realtime` — namespace `/tasks` и рассылка `task:changed`

Redis используется как необязательный кеш списка задач. Если Redis недоступен, API продолжает работать без падения.

## Быстрый старт без Docker

### 1. Установить зависимости

```bash
pnpm install
```

### 2. Подготовить env-файлы

Для локальной разработки нужны env-файлы приложений:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Типовые значения уже есть в шаблонах:

- `apps/api/.env`
  - `PORT=3001`
  - `DATABASE_URL=postgresql://tracker:tracker@localhost:5432/tracker?schema=public`
  - `REDIS_URL=redis://localhost:6379`
  - `JWT_ACCESS_SECRET=replace-me-access`
  - `JWT_REFRESH_SECRET=replace-me-refresh`
  - `JWT_ACCESS_TTL=15m`
  - `JWT_REFRESH_TTL=7d`
  - `CORS_ORIGIN=http://localhost:3000`
- `apps/web/.env.local`
  - `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
  - `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`

### 3. Поднять PostgreSQL и Redis

```bash
docker compose up -d postgres redis
```

### 4. Подготовить Prisma и seed-данные

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Запустить frontend и API

```bash
pnpm dev
```

Локальные адреса:

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`
- Swagger: `http://localhost:3001/api/docs`
- Socket.IO base URL: `http://localhost:3001`

Демо-доступ после `seed`:

- Email: `owner@tracker.local`
- Password: `changeme123`

## Быстрый старт через Docker Compose

Для compose используется корневой `.env`:

```bash
cp .env.example .env
docker compose up --build -d
```

По умолчанию compose поднимает:

- `postgres` на `5432`
- `redis` на `6379`
- `api` на `3001`
- `web` на `3000`
- `nginx` на `8080`

Публичные адреса:

- Web: `http://localhost:8080`
- API: `http://localhost:8080/api`
- Swagger: `http://localhost:8080/api/docs`
- Socket.IO: `http://localhost:8080/socket.io`

При старте API-контейнер:

1. ждёт доступности PostgreSQL
2. выполняет `prisma db push`
3. запускает `seed`
4. стартует NestJS API

Остановить и удалить volumes:

```bash
docker compose down -v
```

## Переменные окружения

### Корень репозитория

Файл `.env` нужен для `docker compose` и управляет портами, кредами PostgreSQL, JWT-секретами и demo-user.

Шаблон: [`.env.example`](./.env.example)

### API

Шаблон: [`apps/api/.env.example`](./apps/api/.env.example)

Ключевые переменные:

- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL`
- `JWT_REFRESH_TTL`
- `CORS_ORIGIN`
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`

### Web

Шаблон: [`apps/web/.env.example`](./apps/web/.env.example)

Ключевые переменные:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`

## Команды из корня

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

Что важно:

- `pnpm build` и `pnpm typecheck` сначала вызывают `db:generate`
- `pnpm test` сейчас запускает тесты `@tracker/api`
- `pnpm dev` параллельно поднимает `@tracker/api` и `@tracker/web`

## Полезные команды по пакетам

```bash
pnpm --filter @tracker/api dev
pnpm --filter @tracker/api test
pnpm --filter @tracker/web dev
pnpm --filter @tracker/web build
pnpm --filter @tracker/db prisma:generate
pnpm --filter @tracker/db prisma:migrate
pnpm --filter @tracker/db prisma:seed
```

## Ключевые файлы

- [`apps/api/src/main.ts`](./apps/api/src/main.ts) — bootstrap API, CORS, Swagger, `/api`
- [`apps/api/src/app.module.ts`](./apps/api/src/app.module.ts) — сборка модулей и middleware
- [`apps/api/src/modules/tasks/tasks.service.ts`](./apps/api/src/modules/tasks/tasks.service.ts) — логика задач, кеш и доменные события
- [`apps/api/src/modules/realtime/realtime.gateway.ts`](./apps/api/src/modules/realtime/realtime.gateway.ts) — Socket.IO gateway
- [`packages/db/prisma/schema.prisma`](./packages/db/prisma/schema.prisma) — схема БД
- [`packages/db/prisma/seed.ts`](./packages/db/prisma/seed.ts) — демо-данные
- [`apps/web/src/widgets/workspace-shell/ui/workspace-shell.tsx`](./apps/web/src/widgets/workspace-shell/ui/workspace-shell.tsx) — shell рабочего пространства
- [`apps/web/src/lib/api-client.ts`](./apps/web/src/lib/api-client.ts) — auth-aware HTTP-клиент
- [`apps/web/src/lib/use-task-realtime.ts`](./apps/web/src/lib/use-task-realtime.ts) — realtime-подписка

## Проверки

Основные проверки:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Smoke-check после Docker:

```bash
curl -i http://localhost:8080/
curl -i -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@tracker.local","password":"changeme123"}'
```

## Деплой

### Один сервер

1. Подготовить Linux-хост с Docker и Docker Compose.
2. Создать production `.env`.
3. Задать сильные `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET`.
4. Поднять `docker compose up -d --build`.
5. Поставить TLS перед `nginx`.

### Раздельные сервисы

- вынести PostgreSQL и Redis во внешние managed-сервисы
- деплоить `apps/api` и `apps/web` отдельно
- маршрутизировать `/api` и `/socket.io` в API
- маршрутизировать `/` в Next.js frontend
- прогонять Prisma-операции на релизе отдельно от runtime

## Дополнительно

- README приложений:
  - [`apps/api/README.md`](./apps/api/README.md)
  - [`apps/web/README.md`](./apps/web/README.md)
- Присутствуют комментарии в коде.
- Frontend работает через контракты из `packages/types`.
