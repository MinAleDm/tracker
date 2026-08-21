# Contributing to Tracker

Спасибо за интерес к проекту. Небольшие, проверяемые изменения с ясной мотивацией проще ревьюить и
безопаснее выпускать.

## Перед началом

- Для вопроса используйте GitHub Discussions, для дефекта — bug template.
- Уязвимости отправляйте приватно по инструкции из [`SECURITY.md`](./SECURITY.md).
- Для существенного изменения сначала создайте proposal issue и согласуйте границы.

## Локальная разработка

Требуются Node.js 22.13.1+, pnpm 9.15.4, PostgreSQL 16 и Redis 7.

```bash
npm install --global pnpm@9.15.4
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Секреты в локальных env должны быть уникальными и не короче 32 символов. Никогда не коммитьте env,
дампы БД, токены или Kubernetes Secret.

## Архитектурные правила

- Backend остаётся модульным монолитом; модуль не обращается напрямую к repository другого модуля.
- HTTP API закрыт по умолчанию. Новый публичный route требует явного обоснования безопасности.
- Любая project/org-scoped операция проверяет membership аутентифицированного пользователя.
- Access/refresh tokens нельзя сохранять в `localStorage` или `sessionStorage`.
- Изменение Prisma schema сопровождается migration; `db push` для production запрещён.
- Изменение границ, потоков или deployment topology обновляет `docs/ARCHITECTURE.md` и ADR.

Полный контракт для автоматизированных и человеческих участников находится в [`AGENTS.md`](./AGENTS.md).

## Проверки

Перед pull request выполните:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level high
kubectl kustomize k8s/base >/dev/null
docker compose config --quiet
```

Добавляйте тесты для authorization boundaries, межорганизационной изоляции, token lifecycle,
миграций, кеш-инвалидации и realtime-подписок.

## Коммиты и pull request

Используйте небольшие Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`,
`perf:`. PR должен объяснять результат, риски, способ проверки и эксплуатационные последствия.

Отправляя вклад, вы соглашаетесь лицензировать его на условиях [`LICENSE`](./LICENSE).
