# Facilitator app (`@weema/facilitator`)

This package is the facilitator-facing web app. It does **not** include admin **Base Data** routes or screens.

## API routes in this app

- **`/api/auth/*`** — login, logout, refresh, password reset (proxied to auth service).
- **`/api/user/*`** — current user profile and account actions (`me`, `edit-profile`, `change-password`), proxied to the backend with the session cookie.

Shared proxy helpers live under `app/api/_lib/` (not under a “base-data” path).

## Community / surveys

SHG, member, and survey-answering API routes will be added here as those features are implemented.
