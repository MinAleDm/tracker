# Tracker Web

Frontend приложения `tracker`, построенный на `Next.js App Router`. Это клиентское рабочее пространство для задач, досок, аналитики и детальной карточки задачи. Приложение работает в связке с `@tracker/api` и получает все рабочие данные по HTTP и realtime-сигналам.

## Что делает frontend

- Показывает экран входа, если пользователь не авторизован.
- Хранит сессию и UI-фильтры в `zustand`.
- Загружает организации, проекты, пользователей и задачи через `React Query`.
- Автоматически обновляет access token через refresh token.
- Подписывается на realtime-события задач через Socket.IO.
- Делит UI на отдельные маршруты: обзор, задачи, доски, аналитика, карточка задачи.

## Быстрый запуск

Из корня монорепозитория:

```bash
pnpm --filter @tracker/web dev
```

Полезные команды:

```bash
pnpm --filter @tracker/web build
pnpm --filter @tracker/web start
pnpm --filter @tracker/web typecheck
```

## Переменные окружения

Шаблон лежит в [`.env.example`](/home/minkin/minkingithub/tracker/apps/web/.env.example).

Используются две публичные переменные:

- `NEXT_PUBLIC_API_URL` — базовый URL HTTP API, обычно `http://localhost:3001/api`
- `NEXT_PUBLIC_SOCKET_URL` — базовый URL Socket.IO, обычно `http://localhost:3001`

## Общая архитектура

Frontend устроен по слоям:

- `app` — маршруты и композиция страниц.
- `features` — локальные пользовательские сценарии, например логин, фильтры, создание проекта и задачи.
- `widgets` — крупные секции экрана, которые можно переиспользовать между страницами.
- `lib` — API-клиент, query keys, realtime hooks, общие вычисления.
- `store` — клиентское состояние UI и сессии.
- `shared` — общие утилиты и иконки.

Это не просто разбиение по папкам: данные загружаются на уровне workspace shell, а конкретные страницы получают уже готовый рабочий контекст.

## Точка входа

Корневой layout — [src/app/layout.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/layout.tsx).

Он:

- подключает глобальные стили
- выставляет `metadata`
- оборачивает приложение в [Providers](/home/minkin/minkingithub/tracker/apps/web/src/app/providers.tsx)

`Providers` поднимает:

- `ThemeProvider` из `next-themes`
- `QueryClientProvider` из `@tanstack/react-query`

У `React Query` настроены:

- `staleTime: 15_000`
- `retry: 1`
- `refetchOnWindowFocus: false`

Это означает, что клиент не дёргает API слишком агрессивно, но и не оставляет данные бесконтрольно устаревшими.

## Как работает авторизация на клиенте

Ключевые файлы:

- [sign-in-form.tsx](/home/minkin/minkingithub/tracker/apps/web/src/features/auth/ui/sign-in-form.tsx)
- [api-client.ts](/home/minkin/minkingithub/tracker/apps/web/src/lib/api-client.ts)
- [use-ui-store.ts](/home/minkin/minkingithub/tracker/apps/web/src/store/use-ui-store.ts)

Поток входа:

1. Пользователь вводит email и пароль на экране входа.
2. Форма вызывает `apiClient.login`.
3. API возвращает `user`, `accessToken`, `refreshToken`.
4. Store сохраняет сессию в persisted zustand-хранилище.
5. Пользователь перенаправляется на `/pages/my`.

Поток обновления токенов:

1. Любой запрос идёт через `request()` в `api-client.ts`.
2. Если API вернул `401`, клиент один раз пытается вызвать `/auth/refresh`.
3. Если refresh успешен, токены обновляются в store.
4. Исходный запрос повторяется один раз.
5. Если refresh не удался, сессия очищается и пользователь фактически возвращается к экрану входа.

Важно:

- Access token хранится в persisted store, а не в cookie.
- Любой route использует один и тот же механизм guard на уровне UI-композиции.

## Zustand store

Файл: [use-ui-store.ts](/home/minkin/minkingithub/tracker/apps/web/src/store/use-ui-store.ts)

Store хранит:

- `accessToken`
- `refreshToken`
- `user`
- `selectedOrganizationId`
- `selectedProjectId`
- `search`
- `status`
- `priority`
- `assigneeId`
- `hydrated`

Почему это важно:

- Сессия переживает перезагрузку страницы.
- Выбранная организация и проект сохраняются между экранами.
- Фильтры задач остаются стабильными при навигации.
- Пока persisted store не гидратирован, UI показывает skeleton вместо ложного состояния.

## Workspace shell

Основной контейнер приложения — [workspace-shell.tsx](/home/minkin/minkingithub/tracker/apps/web/src/widgets/workspace-shell/ui/workspace-shell.tsx).

Это центральный слой фронтенда. Он:

- решает, показать ли экран входа
- показывает skeleton до завершения hydration
- загружает рабочий контекст через `useWorkspaceData`
- рендерит левый rail, overlay-панели и header страницы
- отдаёт готовые данные конкретным страницам через render prop `children(data)`

Поведение `WorkspacePage`:

- если store ещё не гидратирован, рендерится skeleton
- если нет `accessToken` или `user`, рендерится `SignInForm`
- если данные ещё грузятся, снова показывается skeleton
- если в организации нет проектов, показывается empty state
- иначе рендерится целевой экран

## Как загружаются рабочие данные

Файл: [use-workspace-data.ts](/home/minkin/minkingithub/tracker/apps/web/src/widgets/workspace-shell/model/use-workspace-data.ts)

Hook делает несколько зависимых запросов:

1. Загружает организации текущего пользователя.
2. Выбирает активную организацию из store или берёт первую доступную.
3. Загружает проекты выбранной организации.
4. Загружает пользователей организации.
5. Автоматически выбирает проект, если он ещё не выбран.
6. Строит `taskFilters` на основе store.
7. Загружает список задач текущего проекта.
8. Подключает realtime-подписку на выбранный проект.

На выходе `WorkspaceData` содержит:

- текущую организацию
- текущий проект
- список проектов
- список участников
- список задач
- данные текущего пользователя
- роль пользователя в организации
- флаг загрузки задач

Это сделано так, чтобы страницы не знали, как именно склеиваются организации, проекты, пользователи и задачи.

## API-клиент

Файл: [api-client.ts](/home/minkin/minkingithub/tracker/apps/web/src/lib/api-client.ts)

Он инкапсулирует все HTTP-запросы фронтенда:

- `login`
- `getOrganizations`
- `getProjects`
- `createProject`
- `getUsers`
- `getTasks`
- `getTask`
- `createTask`
- `updateTask`
- `createComment`

Особенности:

- Всегда ставит `Content-Type: application/json`.
- Автоматически добавляет `Authorization: Bearer ...`, если токен есть.
- Бросает `ApiError` при неуспешном ответе.
- Один раз ретраит запрос после refresh token flow.

## Realtime на клиенте

Файл: [use-task-realtime.ts](/home/minkin/minkingithub/tracker/apps/web/src/lib/use-task-realtime.ts)

Логика такая:

1. При наличии `projectId` и `accessToken` создаётся Socket.IO подключение к `/tasks`.
2. В `auth.token` передаётся access token.
3. Клиент подписывается на проект через `project:subscribe`.
4. При событии `task:changed` клиент не мутирует данные вручную.
5. Вместо этого инвалидируются query-кэши:
   `["tasks", projectId]` и `queryKeys.task(taskId)`.

Это хороший компромисс:

- realtime остаётся простым
- сервер не обязан отправлять полный payload задачи
- клиент всегда перечитывает актуальное состояние через обычный API

## Карта маршрутов

Маршруты лежат в [src/app](/home/minkin/minkingithub/tracker/apps/web/src/app).

- `/` — главная сводка проекта. Файл: [page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/page.tsx)
- `/pages/my` — стартовая страница рабочего пространства. Файл: [pages/my/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/pages/my/page.tsx)
- `/tasks` — список задач. Файл: [tasks/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/tasks/page.tsx)
- `/tasks/[taskId]` — детальная карточка задачи. Файл: [tasks/[taskId]/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/tasks/[taskId]/page.tsx)
- `/boards` — kanban-доска. Файл: [boards/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/boards/page.tsx)
- `/analytics` — метрики и аналитика. Файл: [analytics/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/analytics/page.tsx)

## Что находится на страницах

### Главная `/`

Файл: [src/app/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/page.tsx)

Страница рендерит:

- `TaskCreate` для быстрого создания
- `OverviewContent` для оперативной сводки

Это экран для быстрого входа в работу и оценки текущего состояния проекта.

### Мои страницы `/pages/my`

Файл: [pages/my/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/pages/my/page.tsx)

Это обзорная стартовая страница после входа, завязанная на workspace shell.

### Задачи `/tasks`

Файл: [tasks/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/tasks/page.tsx)

Здесь используются:

- `BoardFilter`
- `TaskCreate`
- `TasksTable`

Есть локальные scope-переключатели:

- `all`
- `mine`
- `unassigned`
- `review`

Таблица задач строится поверх уже загруженного списка, без отдельного запроса на каждый таб.

### Доски `/boards`

Файл: [boards/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/boards/page.tsx)

Здесь используются:

- `BoardFilter`
- `TaskCreate`
- `KanbanBoard`

Канбан открывает карточку задачи через router push на `/tasks/:taskId`.

### Аналитика `/analytics`

Файл: [analytics/page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/analytics/page.tsx)

Здесь рендерится `AnalyticsContent`, который считает состояние workflow и распределение нагрузки по текущей выборке задач.

### Карточка задачи `/tasks/[taskId]`

Основная реализация — [task-detail-page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/widgets/task-detail/ui/task-detail-page.tsx)

Что делает экран:

- загружает детальную задачу по `taskId`
- показывает статус, приоритет, автора, исполнителя, даты
- даёт редактировать title, description, status, priority и assignee
- показывает dirty-state перед сохранением
- позволяет оставлять комментарии
- показывает историю активности
- подбирает связанные задачи

После сохранения или комментария экран инвалидирует:

- список задач проекта
- query конкретной задачи

## Основные widgets

- [overview-content.tsx](/home/minkin/minkingithub/tracker/apps/web/src/widgets/overview/ui/overview-content.tsx) — summary и focus-панель
- [tasks-table.tsx](/home/minkin/minkingithub/tracker/apps/web/src/widgets/tasks-table/ui/tasks-table.tsx) — табличный вид задач
- [kanban-board.tsx](/home/minkin/minkingithub/tracker/apps/web/src/widgets/kanban-board/ui/kanban-board.tsx) — drag-and-drop доска
- [analytics-content.tsx](/home/minkin/minkingithub/tracker/apps/web/src/widgets/analytics/ui/analytics-content.tsx) — метрики
- [task-detail-page.tsx](/home/minkin/minkingithub/tracker/apps/web/src/widgets/task-detail/ui/task-detail-page.tsx) — детальная карточка

## Основные features

- [sign-in-form.tsx](/home/minkin/minkingithub/tracker/apps/web/src/features/auth/ui/sign-in-form.tsx) — экран входа
- [board-filter.tsx](/home/minkin/minkingithub/tracker/apps/web/src/features/board-filter/ui/board-filter.tsx) — фильтры списка/доски
- [project-create.tsx](/home/minkin/minkingithub/tracker/apps/web/src/features/project-create/ui/project-create.tsx) — создание проекта
- [task-create.tsx](/home/minkin/minkingithub/tracker/apps/web/src/features/task-create/ui/task-create.tsx) — быстрое создание задачи
- [theme-toggle.tsx](/home/minkin/minkingithub/tracker/apps/web/src/features/theme-toggle/ui/theme-toggle.tsx) — переключение темы

## Навигация и рабочий контекст

Левый rail в `workspace-shell` даёт доступ к:

- задачам
- проектам и портфелям
- целям
- очередям
- доскам
- дашбордам
- истории
- настройкам

Часть пунктов ведёт на отдельные route, часть открывает contextual overlay-панели без полной смены экрана.

Дополнительно:

- кнопка `+` создаёт новую задачу в выбранном проекте
- профиль снизу rail открывает компактное меню с выходом
- проект переключается через overlay-панель

## Как frontend думает о данных

Ключевой принцип: frontend не хранит отдельную предметную модель задач поверх API.

Что это означает на практике:

- нет локального demo-репозитория задач
- нет дублирующего entity-слоя
- экран работает с DTO, полученными от API
- React Query отвечает за server state
- Zustand отвечает только за session/UI state

Это сильно упрощает сопровождение: источник истины один, а синхронизация между экранами строится через invalidate/refetch.

## Полезная карта файлов

- [src/app](/home/minkin/minkingithub/tracker/apps/web/src/app) — маршруты App Router
- [src/app/providers.tsx](/home/minkin/minkingithub/tracker/apps/web/src/app/providers.tsx) — React Query и theme providers
- [src/store/use-ui-store.ts](/home/minkin/minkingithub/tracker/apps/web/src/store/use-ui-store.ts) — persisted session/UI store
- [src/lib/api-client.ts](/home/minkin/minkingithub/tracker/apps/web/src/lib/api-client.ts) — HTTP-слой
- [src/lib/use-task-realtime.ts](/home/minkin/minkingithub/tracker/apps/web/src/lib/use-task-realtime.ts) — Socket.IO hook
- [src/widgets/workspace-shell](/home/minkin/minkingithub/tracker/apps/web/src/widgets/workspace-shell) — каркас приложения и общий рабочий контекст

## Если нужно расширять frontend

Практичный порядок работы:

1. Если нужен новый экран, добавить route в `src/app`.
2. Если это самостоятельная крупная секция, оформить её как widget.
3. Если это локальное пользовательское действие, вынести в feature.
4. Новые запросы добавлять в `api-client.ts`.
5. Для server state использовать `React Query`.
6. Для локального UI state использовать `zustand` только если состояние нужно между экранами или виджетами.
7. Если новая операция меняет задачи, инвалидировать query задач и query карточки.

Если функциональность касается задач, нужно проверить три вещи:

- корректно ли собираются фильтры
- инвалидируется ли список после изменений
- обновляется ли карточка задачи после realtime или mutation
