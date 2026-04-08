FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
RUN corepack prepare pnpm@10.33.0 --activate

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
ENV HOSTNAME="0.0.0.0"

ARG APP_NAME
ARG PORT=3000
ENV PORT="${PORT}"

COPY --from=builder --chown=node:node /app .

USER node

EXPOSE ${PORT}

CMD ["sh", "-c", "for v in APP_NAME AUTH_API_BASE_URL API_BASE_URL; do if [ -z \"$(printenv \"$v\")\" ]; then echo \"Missing required env var: $v\"; exit 1; fi; done; pnpm --filter \"${APP_NAME}\" start"]