# Архитектура Tracker

## Контекст и цели

Tracker — многопользовательская система управления задачами. Репозиторий построен как pnpm-монорепо:
frontend и API развёртываются независимо, backend остаётся модульным монолитом, а общие контракты и
схема данных вынесены в workspace-пакеты.

Такой дизайн сохраняет транзакционную простоту и быстрые изменения домена без преждевременного
разделения на микросервисы. Границы модулей уже пригодны для последующего извлечения, если появятся
независимые требования к масштабированию или владению.

## Контейнеры

```mermaid
flowchart LR
  Browser[Next.js client] -->|HTTPS /api/v1| Edge[Nginx / ingress]
  Browser -->|WSS /tasks| Edge
  Edge --> Web[Next.js web]
  Edge --> API[NestJS modular monolith]
  API --> DB[(PostgreSQL)]
  API --> Cache[(Redis cache)]
  API --> Socket[Socket.IO rooms]
  Socket --> Browser
```

- `apps/web` — App Router UI, shadcn/ui, React Query, Zustand и Socket.IO client.
- `apps/api` — versioned HTTP API, authorization, domain services и realtime gateway.
- `packages/types` — общие транспортные DTO.
- `packages/ui` — UI-примитивы без бизнес-логики.
- `packages/db` — Prisma schema, migrations и явный seed.
- PostgreSQL — единственный источник истины.
- Redis — необязательный кеш; его отказ ухудшает latency, но не корректность.

## Frontend information architecture

`WorkspacePage` восстанавливает session и единый organization/project context, после чего route
компонует доменные widgets:

| Route | Назначение |
| --- | --- |
| `/` | личная активная работа, очереди разбора/review и последние изменения |
| `/tasks` | компактный read-first list, сохранённые views и общие фильтры |
| `/boards` | тот же task set в Kanban; drag-and-drop выполняет status mutation |
| `/analytics` | измеримые показатели текущего task flow без условного health score |
| `/tasks/:id` | редактирование, workflow action, comments, activity и related tasks |

React Query владеет server state. Zustand хранит только UI preferences и текущий in-memory access token;
transport DTO импортируются из `packages/types`. UI-примитивы находятся в `packages/ui`, route composition —
в `app`, действия — в `features`, крупные секции — в `widgets`.

## Backend-модули и владение данными

| Модуль | Ответственность | Основные данные |
| --- | --- | --- |
| `auth` | login, refresh rotation, logout, session recovery | `User`, `RefreshToken` |
| `organizations` | доступные организации и membership | `Organization`, `Membership` |
| `invitations` | создание и одноразовое принятие приглашений | `Invitation`, `Membership` |
| `projects` | проекты и проверка project access | `Project`, `Membership` |
| `tasks` | задачи, комментарии, activity, cache events | `Task`, `Comment`, `Activity` |
| `users` | активные пользователи и видимость участников | `User`, `Membership` |
| `realtime` | аутентифицированные project rooms | данных не хранит |
| `health` | liveness/readiness | данных не хранит |

Контроллер вызывает сервис своего модуля. Сервис применяет бизнес-правила и обращается к собственному
repository. Межмодульный вызов идёт через экспортированный service/interface, а не напрямую в repository.

## Граница авторизации

```mermaid
sequenceDiagram
  participant C as Client
  participant G as Global JWT guard
  participant S as Domain service
  participant D as PostgreSQL
  C->>G: Bearer access token + resource id
  G->>D: active user by token subject
  D-->>G: user status
  G->>S: authenticated user id
  S->>D: resource joined with membership
  D-->>S: authorized resource or none
  S-->>C: result or 403/404
```

Идентификатор организации или проекта — только selector, но не доказательство доступа. Источник identity —
subject проверенного access JWT; membership перечитывается из базы. Тот же принцип применяется к
Socket.IO rooms и assignee validation.

## Сессия браузера

1. `POST /api/v1/auth/login` проверяет пароль и создаёт refresh family.
2. Короткий access token возвращается клиенту и хранится только в памяти.
3. Refresh token сохраняется как hash и отправляется в scoped `HttpOnly`, `SameSite=Strict` cookie.
4. После перезагрузки frontend вызывает refresh и восстанавливает in-memory access token.
5. Каждый refresh ротирует token. Повторное использование отозванного token отзывает всю family.
6. Logout отзывает family и удаляет cookie.

На edge строгий auth limit применяется к login и invitation acceptance. Refresh/logout проходят через
общий API limit и дополнительно ограничены policy самого API; это сохраняет защиту credential endpoints,
не превращая обычное восстановление сессии в ложный logout.

## Поток изменения задачи

```mermaid
sequenceDiagram
  participant UI as Web
  participant API as Tasks service
  participant DB as PostgreSQL
  participant R as Redis
  participant WS as Socket.IO
  UI->>API: PATCH /api/v1/tasks/:id
  API->>DB: authorize membership + update
  API->>DB: write activity
  API->>R: invalidate project list keys
  API->>WS: task:changed(project room)
  WS-->>UI: invalidation signal
  UI->>API: refetch canonical data
```

Событие realtime не считается источником состояния: клиент инвалидирует React Query и перечитывает API.
Текущие activity/cache/realtime handlers выполняются после основной mutation и пока не имеют гарантий
transactional outbox; это явно зафиксированный residual risk.

## Deployment topology

- Docker Compose — локальный/односерверный контур. PostgreSQL, Redis и API привязаны к loopback,
  Web доступен только в Compose-сети, публичная точка — unprivileged Nginx.
- Kubernetes base — демонстрационный self-contained контур с NetworkPolicy и restricted workloads.
- Production — внешний TLS ingress, managed PostgreSQL/Redis, secret manager, backup/restore,
  централизованные метрики/логи и отдельный migration job.

API container выполняет только `prisma migrate deploy`; seed запускается лишь при явном
`SEED_DEMO_DATA=true`. Файлы Secret не хранятся в Git.

## Эволюция

Приоритетные следующие шаги:

1. Transactional outbox для activity/realtime delivery.
2. Распределённый rate limiter для нескольких API replicas.
3. OpenTelemetry traces/metrics и SLO для login/task mutation.
4. Постоянные E2E browser tests, visual regression и accessibility checks в CI.
5. Production overlay: external secrets, autoscaling, PDB и managed data services.

Решения: [`docs/adr`](./adr), риски: [`THREAT_MODEL.md`](./THREAT_MODEL.md), состояние:
[`PROJECT_STATUS.md`](./PROJECT_STATUS.md).
