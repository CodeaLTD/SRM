FROM node:22-slim AS base
RUN corepack enable
# Puppeteer (via @codea-srm/core) needs system Chromium deps at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @codea-srm/db generate
# "build" here is a typecheck-only gate (tsc --noEmit) — the worker runs
# its TS source directly via tsx at start, it's not compiled to dist.
RUN pnpm --filter @codea-srm/worker build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo ./
CMD ["pnpm", "--filter", "@codea-srm/worker", "start"]
