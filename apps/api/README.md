# Tracker API

Backend приложения `tracker`, построенный на `NestJS`. Этот сервис отвечает за аутентификацию, доступ к организациям и проектам, CRUD задач, комментарии, историю активности и realtime-уведомления через Socket.IO.

## Что делает API

- Поднимает HTTP API под префиксом `/api`.
- Выдаёт Swagger по адресу `/api/docs`.
- Проверяет JWT access token для защищённых роутов.
- Хранит данные в PostgreSQL через Prisma.
- Использует Redis как необязательный кеш для списков задач.
- Публикует realtime-события по задачам через namespace `/tasks`.

## Быстрый запуск

Из корня монорепозитория:

```bash
pnpm --filter @tracker/api dev
```

Полезные команды:

```bash
pnpm --filter @tracker/api build
pnpm --filter @tracker/api start
pnpm --filter @tracker/api typecheck
pnpm --filter @tracker/api test
```

## Переменные окружения

Шаблон лежит в [`.env.example`](/home/minkin/minkingithub/tracker/apps/api/.env.example).

Основные переменные:

- `PORT` — порт HTTP-сервера, по умолчанию `3001`.
- `DATABASE_URL` — строка подключения к PostgreSQL.
- `REDIS_URL` — адрес Redis для кеша списков задач.
- `JWT_ACCESS_SECRET` — секрет access token.
- `JWT_REFRESH_SECRET` — секрет refresh token.
- `JWT_ACCESS_TTL` — TTL access token, например `15m`.
- `JWT_REFRESH_TTL` — TTL refresh token, например `7d`.
- `CORS_ORIGIN` — список origin через запятую для frontend-клиентов.
- `DEMO_USER_EMAIL` и `DEMO_USER_PASSWORD` — демо-учётка для seed-данных.

## Точка входа и инфраструктура

Точка входа — [src/main.ts](/home/minkin/minkingithub/tracker/apps/api/src/main.ts).

При старте приложение:

1. Создаёт Nest-приложение с CORS.
2. Подключает `helmet`.
3. Ставит глобальный префикс `/api`.
4. Включает `ValidationPipe` с `whitelist`, `transform` и `forbidNonWhitelisted`.
5. Генерирует Swagger.
6. Слушает `PORT`.

Корневой модуль — [src/app.module.ts](/home/minkin/minkingithub/tracker/apps/api/src/app.module.ts). Он собирает:

- `PrismaModule`
- `RedisModule`
- `AuthModule`
- `UsersModule`
- `OrganizationsModule`
- `ProjectsModule`
- `TasksModule`
- `RealtimeModule`

Также на все роуты навешан [logging middleware](/home/minkin/minkingithub/tracker/apps/api/src/common/logging/logging.middleware.ts), который пишет метод, URL, статус и время ответа.

## Архитектура слоёв

В проекте используется простой и предсказуемый разрез:

- `controller` — HTTP-контракт, разбор параметров, guards и DTO.
- `service` — бизнес-логика и правила доступа.
- `repository` — Prisma-запросы и работа с базой.
- `common` — общая инфраструктура: auth, Prisma, Redis, logging.

Это хорошо видно на модуле задач:

- [tasks.controller.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/tasks.controller.ts)
- [tasks.service.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/tasks.service.ts)
- [tasks.repository.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/tasks.repository.ts)

## Основные модули

### Auth

Файлы:

- [auth.controller.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/auth/auth.controller.ts)
- [auth.service.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/auth/auth.service.ts)
- [auth.repository.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/auth/auth.repository.ts)

Что происходит:

- `POST /api/auth/login` проверяет email и пароль через `bcryptjs`.
- При успешном логине сервис выдаёт `accessToken` и `refreshToken`.
- Refresh token хранится в базе не в открытом виде, а как `sha256` hash.
- `POST /api/auth/refresh` валидирует refresh token, ищет его среди ещё не отозванных, отзывает старый и выдаёт новую пару токенов.
- `GET /api/auth/me` возвращает текущего пользователя и его организации.

Механика refresh-token rotation:

1. Пользователь логинится.
2. API создаёт два JWT.
3. Hash refresh token сохраняется в таблице refresh tokens.
4. При refresh старый токен отзывается.
5. Пользователь получает новую пару.

Это уменьшает риск повторного использования старого refresh token.

### Organizations

Файл: [organizations.controller.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/organizations/organizations.controller.ts)

Маршрут:

- `GET /api/organizations` — отдаёт организации, в которых состоит текущий пользователь.

### Users

Файл: [users.controller.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/users/users.controller.ts)

Маршрут:

- `GET /api/users?organizationId=...` — список пользователей, видимых текущему пользователю.

Используется фронтендом для выбора исполнителя задачи и фильтров.

### Projects

Файл: [projects.controller.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/projects/projects.controller.ts)

Маршруты:

- `GET /api/projects?organizationId=...` — список проектов организации.
- `POST /api/projects` — создание проекта.

Особенность:

- Создание проекта защищено `JwtAuthGuard + RolesGuard`.
- Для `POST /projects` нужен `@Roles("ADMIN")`.

### Tasks

Файлы:

- [tasks.controller.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/tasks.controller.ts)
- [tasks.service.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/tasks.service.ts)
- [tasks.repository.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/tasks.repository.ts)
- [task.mapper.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/task.mapper.ts)

Маршруты:

- `GET /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/tasks`
- `GET /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId`
- `POST /api/tasks/:taskId/comments`
- `GET /api/tasks/:taskId/activity`

Что делает сервис задач:

- Проверяет доступ пользователя к проекту.
- При создании и изменении задачи проверяет, что исполнитель состоит в той же организации.
- Возвращает список задач с пагинацией и фильтрами.
- Возвращает детальную карточку задачи вместе с комментариями и историей.
- После изменений публикует доменные события.

Поддерживаемые фильтры списка:

- `search`
- `status`
- `priority`
- `assigneeId`
- `page`
- `pageSize`

Нормализация фильтров:

- Пустые и пробельные query-параметры приводятся к `undefined`.
- Для списка используется детерминированный cache key.
- Ключ кеша учитывает пользователя и проект, чтобы не смешивать разные сессии.

## Как работает кеш задач

Кеш реализован в [redis.service.ts](/home/minkin/minkingithub/tracker/apps/api/src/common/redis/redis.service.ts).

Логика:

- Кешируются только ответы списка задач.
- TTL кеша списка: `30` секунд.
- Если Redis недоступен, API продолжает работать без падения.
- Инвалидация идёт по префиксу при событиях по задачам.
- Для очистки используется `SCAN`, а не `KEYS`, чтобы не делать тяжёлый блокирующий проход по Redis.

Это означает, что Redis здесь ускоряет чтение, но не является обязательной зависимостью для корректности бизнес-логики.

## Доменные события задач

Модуль задач использует fan-out обработчиков событий:

- [task-events.service.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/events/task-events.service.ts)
- [task-domain-event.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/events/task-domain-event.ts)
- [task-domain-event-handler.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/events/task-domain-event-handler.ts)

Поддерживаются события:

- `task.created`
- `task.updated`
- `task.commented`

На каждое событие срабатывают три обработчика:

1. [TaskActivityEventHandler](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/events/task-activity-event.handler.ts)
   Пишет историю активности в базу.
2. [TaskCacheEventHandler](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/events/task-cache-event.handler.ts)
   Сбрасывает кеш списков задач проекта.
3. [TaskRealtimeEventHandler](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks/events/task-realtime-event.handler.ts)
   Публикует realtime-событие клиентам.

Это разделение полезно тем, что бизнес-операция остаётся одной, а побочные эффекты изолированы по ответственности.

## Realtime

Файлы:

- [realtime.gateway.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/realtime/realtime.gateway.ts)
- [realtime.service.ts](/home/minkin/minkingithub/tracker/apps/api/src/modules/realtime/realtime.service.ts)

Как это работает:

1. Клиент открывает Socket.IO соединение в namespace `/tasks`.
2. В `handshake.auth.token` передаётся access token.
3. Gateway валидирует JWT.
4. Клиент подписывается на комнату проекта через событие `project:subscribe`.
5. При изменении задачи API публикует `task:changed` в комнату `project:<projectId>`.

Важно:

- WebSocket не делает чтение данных сам по себе.
- Он только сигнализирует клиенту, что данные устарели.
- После этого фронтенд инвалидирует query-кеш и перечитывает актуальные данные по HTTP.

## Prisma и база

Prisma-клиент поднимается в [prisma.service.ts](/home/minkin/minkingithub/tracker/apps/api/src/common/prisma/prisma.service.ts).

Поведение:

- `onModuleInit` подключает клиент к БД.
- `onModuleDestroy` закрывает соединение.

Схема базы лежит не в приложении API, а в общем пакете:

- [packages/db/prisma/schema.prisma](/home/minkin/minkingithub/tracker/packages/db/prisma/schema.prisma)

Это сделано для переиспользования Prisma-клиента и схемы между пакетами монорепозитория.

## Guards и доступ

Файлы:

- [jwt-auth.guard.ts](/home/minkin/minkingithub/tracker/apps/api/src/common/auth/jwt-auth.guard.ts)
- [jwt.strategy.ts](/home/minkin/minkingithub/tracker/apps/api/src/common/auth/jwt.strategy.ts)
- [roles.guard.ts](/home/minkin/minkingithub/tracker/apps/api/src/common/auth/roles.guard.ts)
- [current-user.decorator.ts](/home/minkin/minkingithub/tracker/apps/api/src/common/auth/current-user.decorator.ts)

Что важно знать:

- Почти все рабочие роуты требуют `Bearer` access token.
- Доступ к задачам и проектам проверяется не только по наличию токена, но и по membership в организации проекта.
- Создание проекта ограничено ролью `ADMIN`.

## Тесты

Тесты лежат в папке [test](/home/minkin/minkingithub/tracker/apps/api/test).

Есть сценарии:

- auth flow
- task flow
- realtime flow
- redis service

Интеграционные тесты используют `node:test` и `supertest`.
Часть инфраструктуры в тестах подменяется in-memory реализациями, чтобы проверять бизнес-логику без необходимости поднимать реальный PostgreSQL и Redis на каждый тестовый сценарий.

## Полезная карта файлов

- [src/main.ts](/home/minkin/minkingithub/tracker/apps/api/src/main.ts) — bootstrap приложения.
- [src/app.module.ts](/home/minkin/minkingithub/tracker/apps/api/src/app.module.ts) — сборка модулей.
- [src/common](/home/minkin/minkingithub/tracker/apps/api/src/common) — auth, prisma, redis, logging.
- [src/modules/auth](/home/minkin/minkingithub/tracker/apps/api/src/modules/auth) — логин, refresh, текущий пользователь.
- [src/modules/tasks](/home/minkin/minkingithub/tracker/apps/api/src/modules/tasks) — задачи, комментарии, активность, события.
- [src/modules/realtime](/home/minkin/minkingithub/tracker/apps/api/src/modules/realtime) — Socket.IO gateway и publish layer.

## Если нужно расширять API

Рекомендуемый порядок:

1. Добавить DTO в нужный модуль и общие типы в `@tracker/types`, если контракт общий.
2. Добавить контроллерный маршрут.
3. Реализовать бизнес-логику в service.
4. Вынести Prisma-запросы в repository.
5. Если операция влияет на задачи, подумать, нужно ли доменное событие.
6. Добавить тест на HTTP-сценарий и, при необходимости, отдельный unit/integration test для инфраструктуры.

Если новая операция меняет список задач или карточку задачи, важно не забыть про:

- инвалидацию кеша
- запись активности
- realtime-уведомление клиентам
