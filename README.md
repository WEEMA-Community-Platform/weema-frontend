# WEEMA Monorepo

This repository is organized as a pnpm workspace monorepo for role-based
applications and shared packages.

## Workspace Layout

- `apps/admin`: Admin web application (current focus)
- `packages/auth`: Shared auth utilities (role resolution and token handling)

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run Admin app:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001).

## Auth Flow Baseline

- Admin middleware expects a cookie named `weema_access_token`.
- Unauthorized users are redirected to `NEXT_PUBLIC_AUTH_APP_URL/login`.
- Admin auth callback endpoint:
  - `GET /auth/callback?token=<jwt>`
  - validates role, sets cookie, redirects to `/`.

Create `apps/admin/.env.local` from `apps/admin/.env.example` and set:

- `AUTH_API_BASE_URL`: backend host (for server-to-server auth proxy calls)
- `NEXT_PUBLIC_AUTH_APP_URL`: centralized auth app URL for role redirects

## Workspace Scripts

- `pnpm dev`: run admin app
- `pnpm build`: build all workspace packages/apps
- `pnpm lint`: lint all workspace packages/apps
- `pnpm typecheck`: typecheck all workspace packages/apps
