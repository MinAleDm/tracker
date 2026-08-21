# Operations Runbook

## Перед релизом

1. Убедиться, что рабочее дерево чистое и CI зелёный.
2. Выполнить `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
   `pnpm audit --audit-level high`.
3. Проверить `docker compose config --quiet` и `kubectl kustomize k8s/base`.
4. Просмотреть миграции, план rollback/roll-forward и актуальный backup.
5. Убедиться, что JWT secrets уникальны, `COOKIE_SECURE=true`, Swagger и demo seed выключены.

## Deployment

Предпочтительный порядок production release:

1. Создать проверяемый backup PostgreSQL.
2. Запустить ровно один job `prisma migrate deploy`.
3. Развернуть API и дождаться `/api/health/ready`.
4. Развернуть web с корректным `NEXT_PUBLIC_API_URL=/api/v1`.
5. Проверить login, refresh, project list, task mutation и Socket.IO subscription.
6. Наблюдать 5xx, 401/403 spikes, latency, DB connections и Redis errors.

Seed в production запрещён. Compose entrypoint запускает его только при явном `SEED_DEMO_DATA=true`.

## Health и smoke checks

```bash
curl -fsS https://tracker.example.com/api/health/live
curl -fsS https://tracker.example.com/api/health/ready
curl -fsS https://tracker.example.com/api/health
```

- `live` отвечает, когда процесс способен обслуживать HTTP.
- `ready` проверяет PostgreSQL и Redis.
- Web health подтверждает доступность Next.js process, но не полный пользовательский flow.

## Rollback

- Приложение: вернуть предыдущий immutable image tag.
- Миграция: предпочитать forward fix. Не выполнять ручной destructive rollback без backup и review.
- Если новая версия читает старую/новую схему, откатить application first; cleanup schema выпускать позже.
- После rollback повторить health/smoke и проверить error rate.

## Ротация JWT secrets

Текущая реализация использует один secret каждого типа и не поддерживает key ring. Ротация завершит все
активные сессии:

1. Объявить maintenance/session reset.
2. Сгенерировать два независимых random secrets не короче 32 байт.
3. Обновить secret manager и перезапустить все API replicas согласованно.
4. Проверить login/refresh и удалить старые значения из системы доставки.

Не выводить secret в shell history, CI log или issue.

## Инцидент: подозрение на кражу refresh token

1. Сохранить request IDs, timestamps, user id и источник сигнала без копирования token.
2. Отозвать refresh family пользователя; при массовом инциденте ротировать refresh secret.
3. Ограничить источник на edge, проверить reuse events и аномальные room subscriptions.
4. Определить окно доступа и затронутые organization/project records.
5. Выпустить исправление, уведомить затронутых пользователей и оформить post-incident review.

## Инцидент: недоступна база

1. Проверить `/api/health/ready`, DB service status, connections, storage и recent migrations.
2. Не переключать readiness в «успех» и не отключать проверки ради трафика.
3. При потере данных остановить записи, восстановить в новый instance и проверить consistency.
4. Переключить connection secret, перезапустить API, затем выполнить smoke flow.

## Backup и restore

- Шифровать backup, ограничивать доступ и задавать retention согласно требованиям оператора.
- Проводить restore drill в изолированной среде, а не считать наличие файла доказательством восстановления.
- Проверять memberships, tasks, comments, activity и refresh-token revocation state.
- Redis не является источником истины и может быть очищен после восстановления PostgreSQL.
