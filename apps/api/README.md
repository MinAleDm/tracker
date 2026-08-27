# Tracker API

NestJS backend для аутентификации, организаций, проектов, задач, приглашений и realtime-событий.
Прикладной HTTP contract версионируется по URI и доступен под `/api/v1`.

## Контракт

| Endpoint | Назначение | Доступ |
| --- | --- | --- |
| `POST /api/v1/auth/login` | Вход и создание refresh family | Public + rate limit |
| `POST /api/v1/auth/refresh` | Ротация refresh token | Public + cookie + rate limit |
| `POST /api/v1/auth/logout` | Отзыв session family | Public + cookie |
| `GET /api/v1/auth/me` | Текущий user и organizations | Authenticated |
| `/api/v1/organizations` | Organizations и invitations | Authenticated + role checks |
| `/api/v1/projects` | Projects | Authenticated + membership |
| `/api/v1/tasks` | Task details/mutations | Authenticated + project access |
| `/api/health/live` | Process liveness | Public, version-neutral |
| `/api/health/ready` | PostgreSQL/Redis readiness | Public, version-neutral |
| `/api/docs` | Swagger UI | Только при `SWAGGER_ENABLED=true` |

Полный список routes генерируется Swagger из запущенного приложения.

На edge login и invitation acceptance используют отдельный строгий limit. Refresh/logout проходят через
общий API edge limit; controller policies дополнительно ограничивают refresh/logout до 30 запросов в минуту.

## Архитектурные границы

```text
src/modules/<domain>/
  *.controller.ts    transport и DTO
  *.service.ts       authorization и бизнес-правила
  *.repository.ts    Prisma queries
  dto/               module-local inputs
  events/            side effects домена
```

HTTP API закрыт глобальным `JwtAuthGuard`. Только явно отмеченные `@Public()` handlers обходят guard.
Контроллер не импортирует repository другого модуля; межмодульное взаимодействие проходит через service.

PostgreSQL — источник истины. Redis кеширует task lists на 30 секунд и работает fail-open только в смысле
доступности кеша: security checks всегда выполняются до чтения/записи данных. Инвалидация использует
`SCAN` и project-first prefix.

## Авторизация и session lifecycle

1. Login проверяет bcrypt password.
2. Access JWT возвращается в JSON и хранится клиентом только в памяти.
3. Refresh JWT сохраняется в виде SHA-256 hash и отправляется как `HttpOnly`, `SameSite=Strict` cookie
   с path `/api/v1/auth`.
4. Refresh ротирует token и связывает замену внутри family.
5. Reuse отозванного token отзывает всю family.
6. JWT strategy проверяет signature, issuer, audience, type и активность пользователя.

Organization/project identifier никогда не является доказательством доступа. Сервисы связывают ресурс с
membership пользователя из JWT subject. Realtime gateway повторяет эту проверку перед room join.

## Realtime

- Namespace: `/tasks`.
- Access JWT передаётся в `handshake.auth.token`.
- `project:subscribe` принимает project id после active-user/project-access checks.
- `task:changed` служит сигналом инвалидации; canonical data клиент перечитывает по HTTP.

## Переменные окружения

Шаблон: [`.env.example`](./.env.example).

Обязательные: `DATABASE_URL`, `REDIS_URL`, разные `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` длиной
не менее 32 символов. Также задаются `JWT_ISSUER`, `JWT_AUDIENCE`, `CORS_ORIGIN`, TTL, cookie/Swagger и
proxy flags. Wildcard CORS и placeholder secrets отклоняются при старте.

Для production:

```dotenv
NODE_ENV=production
COOKIE_SECURE=true
SWAGGER_ENABLED=false
SEED_DEMO_DATA=false
```

## Команды

Из корня монорепозитория:

```bash
pnpm --filter @tracker/api dev
pnpm --filter @tracker/api lint
pnpm --filter @tracker/api typecheck
pnpm --filter @tracker/api test
pnpm --filter @tracker/api build
```

Тестовый набор покрывает session rotation/reuse, private-by-default routes, organization roles,
cross-organization assignee denial, one-time invitations, cache invalidation и realtime room isolation.

## Изменение API

- Backward-compatible изменения добавляются в `/api/v1`.
- Breaking contract требует новой URI version и migration plan для web-клиента.
- Новый public route требует `@Public()`, rate-limit review и security justification.
- Schema change требует Prisma migration; production применяет только `prisma migrate deploy`.
- Изменение границ обновляет [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) и ADR.

Локальные правила: [`AGENTS.md`](./AGENTS.md). Уязвимости: [`../../SECURITY.md`](../../SECURITY.md).
