FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
ENV PNPM_CONFIG_CONFIRM_MODULES_PURGE=false

RUN corepack enable \
    && corepack prepare pnpm@10.33.0 --activate


# -------------------
# INSTALL DEPENDENCIES
# -------------------
FROM base AS deps
WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile


# -------------------
# BUILD
# -------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app /app

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

# IMPORTANT FIX: force correct ownership
COPY --from=builder /app /app

RUN addgroup -S nodegroup \
    && adduser -S nodeuser -G nodegroup \
    && chown -R nodeuser:nodegroup /app

USER nodeuser

EXPOSE ${PORT}

CMD ["sh", "-c", "for v in APP_NAME AUTH_API_BASE_URL API_BASE_URL; do if [ -z \"$(printenv \"$v\")\" ]; then echo \"Missing required env var: $v\"; exit 1; fi; done; case \"$APP_NAME\" in \"@weema/admin\") cd /app/apps/admin ;; \"@weema/facilitator\") cd /app/apps/facilitator ;; *) echo \"Unknown APP_NAME: $APP_NAME\"; exit 1 ;; esac; exec ./node_modules/.bin/next start -p \"$PORT\""]