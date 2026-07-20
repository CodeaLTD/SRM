FROM node:22-slim AS base
RUN corepack enable
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
RUN pnpm --filter @codea-srm/web build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /repo ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@codea-srm/web", "start"]
