# SRM

Codea SRM — Internal ERP, Task & Safety Management Platform. Centralizes finance & documents, task management, HR & leave, health-and-safety compliance, and a business/CRM network into one platform, integrated with Google Workspace (Gmail + Calendar).

See [`PRD.md`](./PRD.md) for product requirements and [`docs/plans`](./docs/plans) for per-epic delivery plans.

## Architecture

Full-stack TypeScript, single Turborepo monorepo, self-hosted via Docker Compose:

```
/apps
  /web       Next.js (App Router) — UI + API route handlers
  /worker    Node process — BullMQ workers for scheduled/background jobs
/packages
  /db        Prisma schema + client (Postgres), shared by web and worker
  /core      RBAC, audit log, PDF (Puppeteer), job queue, Google OAuth/Gmail/Calendar wrappers
```

Two run targets, one codebase: `web` handles requests and only *enqueues* background work; `worker` is the always-on process that actually executes it (scheduled emails, subscription-renewal alerts, ЗБУТ deadline checks) — see the architecture plan for why this split exists even though everything is Next.js.

## How to run

### Prerequisites

- Node 22+, [pnpm](https://pnpm.io) 10+, Docker Desktop running.
- A Google Cloud OAuth client (client ID/secret) with the company Workspace domain — required for login; everything else in the stack runs without it.

### 1. Install dependencies

```sh
pnpm install
pnpm --filter @codea-srm/db generate   # generates the Prisma client into packages/db/generated
```

Puppeteer (used for PDF generation) downloads its own headless Chromium as part of `pnpm install` — no extra step needed. If it's ever missing (e.g. after manually editing `pnpm.onlyBuiltDependencies` in the root `package.json` and re-running install on an *existing* `node_modules`, which doesn't retry previously-skipped install scripts), force it with:

```sh
pnpm --filter @codea-srm/core exec puppeteer browsers install chrome
```

### 2. Configure environment

```sh
cp .env.example .env
```

Fill in `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (and the `GOOGLE_OAUTH_*` vars) once leadership provides Google Cloud OAuth credentials. `DATABASE_URL` and `REDIS_URL` already point at the Docker Compose services below and don't need editing for local dev.

### 3. Start infrastructure

```sh
docker compose up -d postgres redis
```

### 4. Run database migrations

```sh
pnpm --filter @codea-srm/db migrate:dev --name init
```

Note: no `--` before `--name` — `pnpm --filter <pkg> <script> -- <args>` double-forwards the separator here and Prisma silently falls back to an interactive "Enter a name for the new migration" prompt instead of failing loudly. Passing the flag directly (as above) forwards correctly.

This applies two migrations: the schema itself, then a hand-written migration that adds a Postgres trigger rejecting `UPDATE`/`DELETE` on `audit_log` (NFR-AUDIT — see `packages/db/README.md`).

### 5. Run the app

```sh
pnpm dev
```

Runs `apps/web` (http://localhost:3000) and `apps/worker` together via Turborepo. Sign in via `/login` (needs real Google OAuth creds — see step 2), then hit `GET /api/health` while authenticated: it enqueues a job that `worker` logs, proving the auth → RBAC → queue loop end to end.

### Running tests

```sh
pnpm test          # everything, via Turborepo
pnpm --filter @codea-srm/core test   # RBAC matrix + a real Puppeteer PDF render
```

### Stopping

```sh
docker compose down          # stop postgres/redis, keep data
docker compose down -v       # also wipe the postgres volume
```
