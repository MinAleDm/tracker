# API Agent Guide

## Boundaries

- Organize code by domain module: controller, service, repository and module-local DTO/events.
- Controllers translate HTTP only. Authorization and business rules belong in services; persistence
  belongs in repositories.
- Cross-module collaboration uses exported services. Do not inject another module's repository.
- All application routes use `/api/v1`; health stays version-neutral under `/api/health`.

## Security invariants

- The global JWT guard protects every route unless it is explicitly decorated with `@Public()`.
- Validate token issuer, audience, type and the current user status.
- Resolve access from `request.user.id`; every organization/project/task lookup must enforce membership.
- Before joining a Socket.IO project room, validate the active user and project access.
- Refresh tokens rotate as a family, are stored only as hashes and are transported only by the scoped
  `HttpOnly`, `SameSite=Strict` cookie.
- Keep DTO validation strict and never log credentials, authorization headers, cookies or request bodies.
- Redis is an optimization. Cache failure must not bypass authorization or change correctness.

## Data and events

- Add a Prisma migration for schema changes and test the forward migration path.
- Invalidate all affected task-list cache variants after a mutation.
- Treat database mutation and side effects as a consistency boundary. If delivery guarantees become
  required, introduce a transactional outbox rather than hiding retries in controllers.

## Checks

```bash
pnpm --filter @tracker/api lint
pnpm --filter @tracker/api typecheck
pnpm --filter @tracker/api test
pnpm --filter @tracker/api build
```
