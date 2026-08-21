# Database Agent Guide

- `schema.prisma` is the canonical data model; every schema change requires a reviewed migration.
- Never use `prisma db push` in deployment or add `--accept-data-loss` automation.
- Migrations must be forward-safe for rolling deployment. Separate destructive cleanup into a later release.
- Preserve organization membership as the authorization anchor and index foreign keys used in access checks.
- Refresh tokens are secrets: store hashes, expiry, revocation and family lineage; never plaintext values.
- Seed execution is explicit and development-only. It must require a caller-supplied strong demo password.
- This package exports generated types/client APIs without creating a global `PrismaClient` as an import side effect.

Checks from the repository root:

```bash
pnpm --filter @tracker/db exec prisma validate --schema prisma/schema.prisma
pnpm --filter @tracker/db prisma:generate
pnpm --filter @tracker/db typecheck
```
