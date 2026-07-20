# @codea-srm/db

Shared Prisma schema + client, used by both `apps/web` and `apps/worker`.

## First-time setup

The schema migration itself hasn't been generated yet — the audit-log
immutability trigger (`prisma/migrations/20260101000000_audit_log_immutability`)
was hand-written ahead of it and expects to run *after* the initial schema
migration. Against a running Postgres (see root `docker-compose.yml`):

```sh
pnpm --filter @codea-srm/db migrate:dev -- --name init
```

This generates the initial `CREATE TABLE` migration and applies both it and
the immutability trigger, in order.

## Adding module models

Finance/tasks/HR/OSH/CRM models are added to `schema.prisma` per-epic, once
`CORE` (auth, RBAC, audit) is verified end to end — see the architecture
plan's delivery sequencing.
