# Changelog

Все заметные изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), проект следует семантике версий по мере появления релизных тегов.

## [Unreleased]

### Added

- Добавлены базовые Kubernetes-манифесты в `k8s/base` для PostgreSQL, Redis, API, Web и Nginx.
- Добавлена инструкция по локальному запуску Kubernetes-контура в `k8s/README.md`.
- Добавлен `CHANGELOG.md`.

### Changed

- В `TasksService` централизована проверка доступа к задаче для update/comment/activity flow.

### Fixed

- История активности задач теперь сохраняет пустую строку как значение изменения, а не превращает ее в `null`.

## [1.0.0] - 2026-07-11

### Added

- Монорепозиторий task tracker с `Next.js` frontend, `NestJS` API, PostgreSQL, Prisma, Redis, Socket.IO, Docker Compose и Nginx.
- JWT-аутентификация с refresh-token rotation.
- Организации, участники, роли, проекты, задачи, комментарии и история активности.
- Экраны обзора, задач, kanban-доски, аналитики и детальной карточки задачи.
