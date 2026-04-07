FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

# -------------------
# INSTALL DEPENDENCIES
# -------------------
FROM base AS deps
WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

# -------------------
# BUILD
# -------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app .

ARG APP_NAME

RUN pnpm --filter "${APP_NAME}" build

# -------------------
# RUNNER
# -------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

ARG APP_NAME
ARG PORT=3000
ENV PORT="${PORT}"

COPY --from=builder /app .

EXPOSE ${PORT}

CMD ["sh", "-c", "pnpm --filter \"${APP_NAME}\" start"]