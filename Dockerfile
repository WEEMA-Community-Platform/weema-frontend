FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps
WORKDIR /app

# Copy workspace manifests first for better Docker layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/facilitator/package.json apps/facilitator/package.json
COPY packages/auth/package.json packages/auth/package.json

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG APP_NAME

RUN pnpm --filter "${APP_NAME}" build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

ARG APP_NAME
ARG PORT=3000
ENV PORT="${PORT}"

COPY --from=builder /app ./

EXPOSE ${PORT}

CMD ["sh", "-c", "pnpm --filter \"${APP_NAME}\" start -- -p ${PORT}"]
