# Changelog

Все заметные изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), проект следует семантике версий по мере появления релизных тегов.

## [Unreleased]

### Added

- Добавлены API health endpoints `/api/health/live` и `/api/health/ready`.
- Добавлен web health endpoint `/api/health`.
- Добавлены Docker healthchecks и Kubernetes HTTP probes для API и Web.
- Добавлены CodeQL workflow и Dependabot configuration.
- Добавлены скриншоты основных страниц в `docs/screenshots` и README.
- Добавлены базовые Kubernetes-манифесты в `k8s/base` для PostgreSQL, Redis, API, Web и Nginx.
- Добавлена инструкция по локальному запуску Kubernetes-контура в `k8s/README.md`.
- Добавлен `CHANGELOG.md`.

### Changed

- CI validation теперь рендерит Kubernetes-манифесты через `kubectl kustomize`.
- В `TasksService` централизована проверка доступа к задаче для update/comment/activity flow.

### Fixed

- История активности задач теперь сохраняет пустую строку как значение изменения, а не превращает ее в `null`.
- In-memory test repositories расширены методами, которые нужны для полного web smoke flow.

## [1.0.0] - 2026-07-11

### Added

- Монорепозиторий task tracker с `Next.js` frontend, `NestJS` API, PostgreSQL, Prisma, Redis, Socket.IO, Docker Compose и Nginx.
- JWT-аутентификация с refresh-token rotation.
- Организации, участники, роли, проекты, задачи, комментарии и история активности.
- Экраны обзора, задач, kanban-доски, аналитики и детальной карточки задачи.
