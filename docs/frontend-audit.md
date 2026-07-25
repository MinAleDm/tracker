# Frontend audit

Срез: 25 июля 2026 года.

## Текущее состояние

Frontend построен на Next.js App Router, React Query и Zustand. Основной рабочий контур включает:

- явную desktop-навигацию и компактную mobile-навигацию;
- список задач с views, фильтрами и inline-редактированием;
- Kanban с drag-and-drop и горизонтальным потоком на узких экранах;
- быстрый composer задачи и клавишу `C`;
- overview, аналитику и детальную карточку задачи;
- loading, empty, API error, route error и 404-состояния;
- общий слой task mutations, единые UI-токены и видимый keyboard focus;
- lint, typecheck и production build как проверяемый контур качества.

## Сравнение с аналогами

| Продукт | Сильный паттерн | Состояние Tracker |
| --- | --- | --- |
| [Linear](https://linear.app/docs/conceptual-model) | Несколько способов выполнить действие, keyboard-first управление, динамические views | Быстрый composer, shortcut `C`, presets и сохранённые views реализованы; command menu и bulk actions остаются следующими шагами |
| [Plane](https://docs.plane.so/) | Issues, cycles, modules, views и расширяемая структура проекта | Issues и views реализованы; cycles/modules пока отсутствуют |
| [Jira](https://support.atlassian.com/jira-software-cloud/docs/what-is-a-jira-software-board/) | Тактическая доска отдельно от долгосрочного планирования | Список и Kanban разделены; timeline/roadmap пока отсутствует |

## Принятые UX-решения

- Навигация стала подписанной и постоянно видимой: разделы больше не зависят от запоминания иконок.
- Повторяющиеся KPI и поясняющие панели удалены со страниц задач и доски.
- Быстрое создание больше не сохраняет задачу-заглушку: сначала открывается composer.
- Таблица стала компактнее: ключ, контекст и сигналы отделены от редактируемых полей.
- Kanban сохраняет четыре lane в горизонтальном потоке вместо длинной одноколоночной страницы.
- Focus indicator, reduced motion и размеры основных контролов приведены к устойчивой keyboard/touch-модели по мотивам [WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/).

## Рекомендуемый следующий этап

1. Command palette и полный набор shortcuts с экраном подсказок.
2. Bulk selection и массовое изменение статуса, owner и priority.
3. Cycles, backlog и roadmap/timeline поверх текущей модели задач.
4. URL-синхронизация фильтров и серверные сохранённые views для командного шаринга.
5. Виртуализация длинных списков и cursor pagination вместо лимита в 100 задач.
6. Playwright visual regression для desktop/mobile и axe-проверка доступности.
