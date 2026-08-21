# Tracker Web

Next.js App Router frontend для overview, списка задач, kanban-доски, аналитики и task details.

## Слои

| Слой | Ответственность |
| --- | --- |
| `app` | routes, layout и page composition |
| `features` | пользовательские действия: login, filters, create/update |
| `widgets` | workspace shell и крупные page sections |
| `lib` | API client, React Query keys и realtime hooks |
| `store` | in-memory session и persisted UI preferences |
| `shared` | icons и общие frontend utilities |
| `@tracker/ui` | переиспользуемые UI primitives |

Backend DTO импортируются из `@tracker/types`; page components не дублируют transport contracts.

## Session model

- Access token хранится только в памяти Zustand store и исчезает при reload.
- Refresh token недоступен JavaScript: API устанавливает `HttpOnly` cookie.
- После hydration клиент выполняет single-flight refresh, затем запрашивает `/auth/me`.
- При `401` исходный request повторяется максимум один раз после refresh.
- Persisted-store migration удаляет legacy `accessToken`, `refreshToken`, `user` и сохраняет только
  UI preferences: выбранные organization/project, filters и saved views.

Это намеренный security trade-off. Подробности: [`ADR-0002`](../../docs/adr/0002-browser-session-model.md).

## Data flow

`WorkspacePage` восстанавливает session, выбирает organization/project и передаёт страницам единый
workspace context. Server state хранится в React Query. Zustand отвечает только за локальные preferences
и текущий in-memory access token.

Realtime hook подключается к namespace `/tasks`, подписывается на разрешённый проект и по событию
`task:changed` инвалидирует task list/detail query keys. Он не мутирует неполный payload вручную.

## Маршруты

- `/` — overview;
- `/pages/my` — workspace entry;
- `/tasks` — список и фильтры;
- `/tasks/[taskId]` — карточка, комментарии и activity;
- `/boards` — kanban;
- `/analytics` — распределение и показатели проекта.

Горячие клавиши: `C` для create task, `Ctrl+K` / `⌘K` для command palette.

## Конфигурация

Шаблон: [`.env.example`](./.env.example).

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

`NEXT_PUBLIC_*` встраиваются в browser bundle и не должны содержать секреты. Для same-origin deployment
используйте `/api/v1` и публичный origin ingress/Nginx для Socket.IO.

## Команды

```bash
pnpm --filter @tracker/web dev
pnpm --filter @tracker/web lint
pnpm --filter @tracker/web typecheck
pnpm --filter @tracker/web build
pnpm --filter @tracker/web start
```

UI-изменение должно сохранять keyboard navigation, visible focus, semantic labels, reduced motion,
loading/empty/error states и не переносить authorization из API в frontend.

Локальные правила: [`AGENTS.md`](./AGENTS.md). Архитектура: [`../../docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).
