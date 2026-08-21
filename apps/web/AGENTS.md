# Web Agent Guide

## Boundaries

- Keep route composition in `app`, user actions in `features`, reusable page sections in `widgets`,
  transport/state utilities in `lib` and `store`, and shared primitives in `packages/ui`.
- Consume backend contracts from `@tracker/types`; do not duplicate DTOs in page components.
- Keep server data in React Query and local UI preferences in Zustand.

## Security and session rules

- Access tokens live only in memory. Refresh tokens are opaque to JavaScript and stay in the API cookie.
- Persist only non-sensitive UI preferences. A persisted-state migration must remove legacy token fields.
- Send cookies with `credentials: include`; retry a request after refresh at most once.
- Do not render secrets or include them in `NEXT_PUBLIC_*` variables, telemetry or error messages.
- Treat client-side visibility as UX, never authorization; the API remains the enforcement point.

## UX and quality

- Preserve keyboard navigation, visible focus, semantic labels and reduced-motion behavior.
- Add explicit loading, empty and error states for asynchronous flows.
- Realtime events invalidate canonical query keys rather than mutating incomplete task payloads.

## Checks

```bash
pnpm --filter @tracker/web lint
pnpm --filter @tracker/web typecheck
pnpm --filter @tracker/web build
```
