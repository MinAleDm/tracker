# Tracker Agent Guide

## Scope

These instructions apply to the entire repository. More specific `AGENTS.md` files under `apps/`
and `packages/db/` refine them for those areas.

## Architecture invariants

- Treat the backend as a modular monolith and the web application as an independently deployable client.
- Keep domain logic inside its module. Cross-module access goes through an exported service or explicit
  interface, never another module's repository.
- The HTTP API is private by default. A public route requires `@Public()` and a security justification.
- Organization and project access comes from the authenticated user and a database membership check.
  Never trust an organization or project identifier as proof of access.
- Apply the same authorization boundary to HTTP, Socket.IO, background work and cache keys.
- Keep the access token in browser memory and the refresh token in an `HttpOnly` cookie. Never persist
  either token in browser storage.
- Schema changes require a Prisma migration. Production uses `prisma migrate deploy`; never `db push`.
- Do not weaken CORS, cookie flags, rate limits, headers, environment validation or request logging.

## Working agreement

- Preserve unrelated working-tree changes.
- Prefer small Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:` or `perf:`.
- Update an ADR when changing an accepted architectural decision.
- Update `docs/ARCHITECTURE.md` when boundaries, request flow, topology or data ownership changes.
- Add tests for authorization boundaries, organization isolation, token lifecycle, cache invalidation,
  migrations and realtime subscriptions.
- Never commit secrets, `.env` files, database dumps, tokens, cookies or generated Kubernetes Secrets.

## Required checks

Before handing off a change, run the relevant checks from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level high
kubectl kustomize k8s/base >/dev/null
docker compose config --quiet
```

When Docker is available, build affected images and run their health checks.

## Documentation map

- `README.md` — product overview and quick start.
- `docs/ARCHITECTURE.md` — boundaries, flows, data and deployment topology.
- `docs/adr/` — accepted architectural decisions and consequences.
- `docs/THREAT_MODEL.md` — assets, trust boundaries, controls and residual risks.
- `docs/PROJECT_STATUS.md` — current readiness and remaining work.
- `docs/operations/runbook.md` — deployment, rollback and incident procedures.
- `SECURITY.md` — vulnerability reporting and supported security posture.
