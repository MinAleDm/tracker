# Changelog

Все заметные изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), проект следует семантике версий по мере появления релизных тегов.

## [Unreleased]

## [1.1.0] - 2026-08-21

### Added

- Versioned HTTP contract `/api/v1`; health endpoints остаются version-neutral.
- Строгая environment validation для JWT secrets, CORS, ports и production defaults.
- Глобальные private-by-default JWT guard и rate limiting для API/auth flows.
- Refresh-token families, rotation, reuse detection, logout revocation и scoped HttpOnly cookie.
- Проверка active user и project membership перед Socket.IO room subscription.
- Request IDs и структурированные HTTP logs без credentials и request bodies.
- NetworkPolicy, restricted container contexts, resource limits и external secret template для Kubernetes.
- API ESLint, Dependency Review, scheduled dependency audit, CODEOWNERS и GitHub templates.
- `SECURITY.md`, `CONTRIBUTING.md`, `SUPPORT.md`, Code of Conduct и scoped `AGENTS.md`.
- Architecture, ADR, threat model, project status и operations runbook.
- Prisma migration `20260821180000_harden_refresh_sessions`.

### Changed

- Frontend хранит access token только в памяти, refresh token — только в HttpOnly cookie.
- Dependencies обновлены до актуальных совместимых releases; high dependency audit очищен.
- Runtime baseline переведён на Node.js 22 и non-root/read-only containers.
- API startup применяет `prisma migrate deploy`; demo seed запускается только при явном флаге.
- Redis защищён паролем, внутренние Compose ports привязаны к loopback, Nginx добавляет security headers.
- README и component guides полностью синхронизированы с текущей архитектурой и deployment flow.
- Удалён implicit `PrismaClient` singleton из общего DB package.

### Fixed

- Закрыта cross-organization подписка на чужую Socket.IO project room.
- Исправлена инвалидация всех task-list cache variants после mutation.
- Отозванный refresh token теперь нельзя повторно использовать для продолжения family.
- Удалены fallback/placeholder JWT secrets и browser-persisted credentials.
- Plaintext Kubernetes Secret удалён из истории текущего дерева.
- Устранены известные high-severity dependency vulnerabilities.

### Breaking

- Прикладные endpoints перемещены с `/api/*` на `/api/v1/*`; обновите API clients и reverse proxy rules.
- Refresh session schema требует `prisma migrate deploy` до запуска `1.1.0`.
- Существующие browser sessions необходимо создать заново: старые persisted tokens удаляются миграцией store,
  а новые JWT требуют issuer/audience/type claims.

## [1.0.0] - 2026-07-11

### Added

- Монорепозиторий task tracker с `Next.js` frontend, `NestJS` API, PostgreSQL, Prisma, Redis, Socket.IO, Docker Compose и Nginx.
- JWT-аутентификация с refresh-token rotation.
- Организации, участники, роли, проекты, задачи, комментарии и история активности.
- Экраны обзора, задач, kanban-доски, аналитики и детальной карточки задачи.

[Unreleased]: https://github.com/minkinad/tracker/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/minkinad/tracker/compare/35a3111...v1.1.0
[1.0.0]: https://github.com/minkinad/tracker/tree/35a3111
