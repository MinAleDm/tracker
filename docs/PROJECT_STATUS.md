# Project Status

Последнее обновление: 2026-08-21. Целевая версия: `1.1.0`.

## Готовность

| Область | Состояние | Примечание |
| --- | --- | --- |
| Основные task flows | Готово | Projects, tasks, comments, activity, filters, board, analytics |
| Organization isolation | Готово | Membership checks и boundary tests |
| Browser session | Готово | In-memory access, HttpOnly refresh, rotation/reuse detection |
| Realtime authorization | Готово | Active user и project membership до room join |
| Versioned API | Готово | `/api/v1`; version-neutral health endpoints |
| Dependency security | Готово | На 2026-08-21 high audit: 0 известных уязвимостей |
| CI and repository policy | Готово | Lint/typecheck/test/build/audit, CodeQL, review, CODEOWNERS |
| Compose baseline | Готово для dev/single host | Non-root/read-only services, Redis auth, loopback data ports |
| Kubernetes base | Демонстрационный | Restricted workloads и NetworkPolicy; не production platform |
| Observability | Частично | Structured request logs/request ID; нет traces, metrics и SLO |
| Delivery guarantees | Частично | Нет transactional outbox для activity/realtime side effects |
| Browser E2E/a11y | Требуется | API E2E есть; автоматический browser regression suite отсутствует |

## Закрытые риски текущего цикла

- Удалены fallback JWT secrets и добавлена строгая environment validation.
- Токены исключены из browser storage; refresh cookie ограничена по path и JS недоступна.
- Реализованы refresh families, rotation, reuse detection и logout revocation.
- Глобальная private-by-default авторизация заменяет разрозненные controller guards.
- Закрыт cross-organization Socket.IO room join.
- Исправлена инвалидация task list cache.
- Runtime больше не выполняет destructive `prisma db push` или безусловный seed.
- Plaintext Kubernetes Secret удалён из Git; workloads переведены на restricted baseline.
- Обновлены зависимости; `pnpm audit --audit-level high` не находит известных уязвимостей.

## До production

1. Подключить TLS, managed PostgreSQL/Redis и внешний secret manager.
2. Настроить автоматические encrypted backups и регулярно проверять restore.
3. Вынести migration в single-run deployment job и отключить demo seed.
4. Добавить distributed rate limiting, OpenTelemetry, alerting и SLO.
5. Реализовать transactional outbox и идемпотентную доставку side effects.
6. Добавить Playwright smoke/a11y tests и независимый security review.
7. Настроить branch ruleset: PR, CODEOWNERS review, required checks, no force-push/deletion.

Этот файл описывает состояние репозитория, а не сертификацию безопасности и не гарантию SLA.
