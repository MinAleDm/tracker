# Frontend audit

Срез: 27 августа 2026 года.

## Что изменено

Интерфейс переведён на shadcn/ui-примитивы поверх Radix UI, CVA и Lucide. Семантические токены,
светлая и тёмная темы, focus states и reduced motion теперь задаются общим UI-пакетом.

Информационная архитектура упрощена:

- overview показывает личную активную работу, очереди разбора/review и последние изменения;
- список и Kanban используют один набор фильтров и сохранённых представлений;
- создание задачи открывается в dialog и больше не занимает постоянный экранный блок;
- строки списка работают как краткое резюме и ведут в полноценную карточку вместо набора inline-select;
- повторяющиеся KPI, marketing-страница `/pages/my` и дублирующие сводки на доске удалены;
- аналитика показывает только наблюдаемые данные: WIP, review, незакреплённые и давно не обновлённые
  задачи, распределение статусов и активных назначений;
- условный «pulse score» удалён: модель данных не позволяет достоверно оценивать здоровье проекта,
  загрузку или производительность;
- пустое временное окно аналитики имеет явное empty state вместо пустого графика.

Актуальная галерея production-интерфейса хранится в [`docs/screenshots`](./screenshots), а мастер
логотипа — в [`apps/web/public/logo.svg`](../apps/web/public/logo.svg). Скриншоты покрывают desktop и
mobile viewport, вход, overview, list, Kanban, analytics и task detail.

## Сравнение с актуальными паттернами

Tracker следует [концептуальной модели Linear](https://linear.app/docs/conceptual-model): задача — базовая единица работы, а список, доска и views — разные
способы сфокусироваться на одном наборе задач. Главная организована вокруг личной работы и очередей,
а не общего набора vanity metrics. [Фильтры и сохранённые views](https://linear.app/docs/custom-views) не изменяют сами задачи.

[Jira также сохраняет фильтры между представлениями](https://support.atlassian.com/jira-software-cloud/docs/filter-work-items/) и отделяет быстрые фильтры от редактирования issue.
Поэтому изменение статуса и остальных полей оставлено карточке и Kanban, а список оптимизирован для
сканирования.

## Ограничения текущей бизнес-модели

Схема поддерживает status, priority, assignee, creator, comments и activity. В ней пока нет backlog,
cycle/sprint, due date, estimate, labels, rank, relations и отдельного `completedAt`. Интерфейс не
имитирует эти сущности локальным состоянием и не делает прогнозов из `updatedAt`.

Следующий продуктовый этап потребует миграций и API-контрактов:

1. Backlog и ранжирование задач.
2. Cycles/sprints с датами и scope.
3. Labels, estimates, due dates и task relations.
4. Серверные командные views и URL-синхронизация фильтров.
5. Cursor pagination, bulk actions и visual regression suite.

## Security и эксплуатация

Access token остаётся только в памяти, refresh token — в HttpOnly cookie. Строгий edge rate limit
применяется к login и invitation acceptance; refresh/logout идут через общий API limit и дополнительно
ограничены API policy. Это исключает ложный разлогин при нескольких обычных перезагрузках, не ослабляя
защиту login endpoint.
