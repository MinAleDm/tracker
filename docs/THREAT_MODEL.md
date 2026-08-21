# Threat Model

## Область и активы

Модель покрывает web, HTTP API, Socket.IO, PostgreSQL, Redis, контейнерные конфигурации и CI. Главные
активы: учётные записи, refresh sessions, membership/roles, задачи и комментарии, строки подключения,
JWT secrets, invitation tokens и audit/activity data.

## Trust boundaries

1. Интернет → TLS ingress/Nginx.
2. Browser JavaScript → HTTP API и Socket.IO.
3. API → PostgreSQL/Redis.
4. CI и image build → registry/deployment environment.
5. Cluster operator → Kubernetes Secrets и data volumes.

## Основные угрозы и контроли

| Угроза | Влияние | Контроли | Остаточный риск |
| --- | --- | --- | --- |
| Credential stuffing | Захват учётки | login rate limit, edge limit, bcrypt, generic 401 | Нет MFA и breached-password check |
| XSS крадёт сессию | Захват refresh token | refresh в HttpOnly cookie, access только в памяти, CSP | XSS может выполнять действия в активной вкладке |
| CSRF refresh/logout | Продление/завершение сессии | SameSite=Strict, scoped cookie, строгий CORS | Нужен TLS и корректный reverse-proxy origin policy |
| Межорганизационный IDOR | Чтение/изменение чужих данных | membership checks в service/repository, boundary tests | Новые query требуют обязательного review/test |
| Несанкционированная WS room | Утечка событий | JWT claims + active user + project access перед join | Долгое соединение не перепроверяет role до reconnect |
| Refresh reuse | Длительный захват сессии | hash, rotation, family revocation, reuse detection | Нет UI для просмотра всех сессий пользователя |
| Injection/mass assignment | Повреждение данных | Prisma parameters, strict DTO whitelist/forbid | Raw SQL требует отдельного review |
| Secret disclosure | Полный компромисс | env validation, ignored secret files, templates without values | Operator/CI permissions остаются внешней ответственностью |
| Supply-chain dependency | Выполнение вредоносного кода | frozen lockfile, audit, Dependabot, Dependency Review, CodeQL | Actions пока закреплены major tags, не commit SHA |
| Data loss on deploy | Потеря БД | reviewed migrations, `migrate deploy`, no `db push` | Backup/restore зависит от оператора |
| Cache confusion | Чужие/устаревшие данные | authorization before reads, user/project-aware keys, tested invalidation | Redis не предназначен для security decisions |
| Event delivery loss | Неполный activity/realtime | canonical state в PostgreSQL, client refetch | Нет transactional outbox |
| DoS | Недоступность | body defaults, app/edge limits, resource limits | In-memory limiter не общий между replicas |

## Security assumptions

- Production traffic проходит только через HTTPS/WSS.
- JWT secrets уникальны, случайны, не короче 32 символов и хранятся во внешнем secret manager.
- PostgreSQL и Redis не доступны из публичной сети; Redis защищён паролем и network policy.
- CI runners и registry доверенные, branch protection требует успешных проверок и review владельца.
- Operator регулярно проверяет backup restore и обновляет base images/dependencies.

## Проверяемые границы

- E2E: private-by-default routes, org roles, foreign assignee denial, invitation one-time use.
- Auth: refresh rotation/reuse/family revocation и environment validation.
- Realtime: отказ в подписке на чужой project.
- Cache: list invalidation после mutation.
- Automation: high severity audit, Dependency Review и CodeQL.

## Следующий пересмотр

Обновлять модель при добавлении файлов, вложений, OAuth/SSO, внешних webhooks, background workers,
публичного API, нескольких регионов или изменении session model.
