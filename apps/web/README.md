# Tracker Web

Next.js App Router frontend для личного рабочего фокуса, списка задач, Kanban, аналитики потока и task details.

## Слои

| Слой | Ответственность |
| --- | --- |
| `app` | routes, layout и page composition |
| `features` | пользовательские действия: login, filters, create/update |
| `widgets` | workspace shell и крупные page sections |
| `lib` | API client, React Query keys и realtime hooks |
| `store` | in-memory session и persisted UI preferences |
| `shared` | icons и общие frontend utilities |
| `@tracker/ui` | shadcn/ui-примитивы на Radix UI, CVA и семантические theme tokens |

Backend DTO импортируются из `@tracker/types`; page components не дублируют transport contracts.

## UI system

Компоненты интерфейса находятся в `packages/ui` и следуют композиционной модели shadcn/ui. Radix UI
обеспечивает focus management и keyboard behavior для dialog, dropdown и tooltip; визуальные варианты
задаются через CVA, а классы объединяются через общий `cn`. Цвета экранов используют семантические
CSS variables (`background`, `foreground`, `primary`, `muted`, `destructive`), поэтому светлая и тёмная
темы не требуют локальных цветовых исключений. Конфигурация генератора находится в `components.json`.

Production-знак Tracker хранится в [`public/logo.svg`](./public/logo.svg); PNG fallback, favicon и
product preview лежат рядом. Документационная галерея находится в [`../../docs/screenshots`](../../docs/screenshots).

## Информационная архитектура

- overview отвечает на вопрос «что делать дальше»: личная работа, разбор, review и свежие изменения;
- list оптимизирован для сканирования, а изменение полей выполняется в task detail;
- list и Kanban читают один набор фильтров/views из Zustand, но сами задачи остаются server state;
- create task открывается как dialog из shell, route toolbar, command palette или клавиши `C`;
- analytics не выводит health/capacity score без estimates и completion timestamps.

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
- `/pages/my` — legacy redirect на overview;
- `/tasks` — список и фильтры;
- `/tasks/[taskId]` — карточка, комментарии и activity;
- `/boards` — kanban;
- `/analytics` — измеримые показатели потока задач.

Горячие клавиши: `C` для create task, `Ctrl+K` / `⌘K` для command palette.

## Конфигурация

Шаблон: [`.env.example`](./.env.example).

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

`NEXT_PUBLIC_*` встраиваются в browser bundle и не должны содержать секреты. Для same-origin deployment
используйте `NEXT_PUBLIC_API_URL=/api/v1` и пустой `NEXT_PUBLIC_SOCKET_URL`: browser подключится к
публичному origin ingress/Nginx. Значения выше предназначены для запуска Web/API без reverse proxy.

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
