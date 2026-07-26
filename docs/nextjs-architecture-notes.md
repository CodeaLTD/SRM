# SRM architecture notes (frontend-focused orientation)

Personal onboarding notes on how this repo works, written while getting reacquainted with
Next.js. Not a formal epic plan (see [`docs/plans/`](./plans/) for those) — just a reference
for "how does a page load, how does an update happen, what are worker/packages for."

## Repo shape

Turborepo monorepo, single TypeScript codebase:

```
apps/web     Next.js 15 (App Router) — frontend AND backend API in one app
apps/worker  separate always-on Node process — BullMQ background job workers
packages/db  Prisma schema + generated client (Postgres), shared by web and worker
packages/core RBAC, audit log, PDF generation, Google OAuth/Gmail/Calendar, job queue, finance logic
```

Only the **Finance** module (`apps/web/src/app/(dashboard)/finance/`) is substantially built.
`hr`, `osh`, `crm`, `tasks`, `communications` are route stubs — they do the RBAC check and
render "not yet implemented." The Prisma schema currently only has finance-related tables
(`Transaction`, `Subscription`, `GeneratedDocument`, `UploadedDocument`, `DocumentSequence`) plus
auth tables (`User`, `Account`, `Session`, `GoogleToken`) and `AuditLog`.

There are no `"use client"` components anywhere in the app yet — every page is a React Server
Component, all forms are plain HTML posted via Server Actions. No client-side data fetching,
no loading spinners, no `useFormStatus`/`useActionState` pending-UI pattern in use yet.

## Page load flow

Example: `GET /finance/transactions/new`.

1. **Middleware** (`apps/web/src/middleware.ts`) runs first, on every matching request. Coarse,
   route-prefix RBAC gate ("can this role be here at all") — redirects to `/login` or `/403`
   before any React code runs. Uses an edge-safe auth config (no Prisma adapter).
2. **Layout(s) render**, outermost first — `(dashboard)/layout.tsx` re-checks auth (defense in
   depth, not the primary gate) and renders the shared shell/nav.
3. **The page component renders** — e.g. `finance/transactions/new/page.tsx`. It's an `async
   function` with no `"use client"` directive: a **React Server Component**, meaning it runs
   *only* on the server, per request. If it needs data it queries Prisma directly inline (see
   `finance/page.tsx`'s `prisma.transaction.findMany(...)` right inside the component) — there's
   no separate REST/GraphQL API being called from the browser for this.
4. The server renders straight to HTML and streams it down. Data is already in the HTML by the
   time it reaches the browser — no client fetch/`useEffect`/spinner involved.

Two RBAC layers matter, and both need to exist independently:
- **Middleware** = coarse route gate.
- **In-page/action `assertCan(role, "finance:read")`** (from `@codea-srm/core`) = the actual
  data-layer check. UI-level gating alone is never trusted (NFR-AUTHZ).

## Update flow (Server Actions)

Example: `finance/transactions/new/page.tsx` has `<form action={createTransaction}>`, where
`createTransaction` is imported from `finance/actions.ts`, a file starting with `"use server"`.
That directive turns every exported function in the file into a **Server Action** — Next.js
compiles it into a real server endpoint and wires the `<form>` to POST to it automatically. No
`onSubmit` handler needed; it's a genuine HTML form post under the hood (works even with JS
disabled).

On submit:
1. Browser posts the form data to the action.
2. The action function runs **on the server**: re-checks session/role (never trust the earlier
   checks alone), validates/reads fields, does the Prisma mutation, writes an audit log entry
   via `recordAuditEntry`.
3. `revalidatePath("/finance")` — marks the cached render of that route as stale.
4. `redirect("/finance")` — sends the browser there.
5. Because that path was just invalidated, the redirect lands on a **freshly server-rendered**
   page — it re-runs its Prisma query and the new data is just there.

So "update" = **mutate DB → invalidate the cached render of the affected route(s) → redirect
there → server re-renders with fresh data.** No client state to keep in sync, no manual
refetch, no client cache (Redux/TanStack Query) to invalidate — `revalidatePath` *is* the cache
invalidation.

`app/api/*` route handlers are only used where a real HTTP endpoint is unavoidable: NextAuth's
callback, file downloads, and `api/health` (a deliberate smoke-test endpoint — see below).

## `apps/worker` — the background-job process

A second, always-running Node process, entirely separate from the Next.js web server. Its whole
job: pull jobs off Redis (BullMQ) queues and execute them. No HTTP server, no routes — just one
`Worker` per queue (`health-check`, `subscription-renewal-alert`, `osh-deadline-alert`,
`scheduled-email`), listening forever.

**Why it's separate**: `web` must only *enqueue* work, never run it inline. Anything slow or
scheduled (sending an email at a specific time, scanning for renewing subscriptions, checking
ЗБУТ/safety compliance deadlines) needs to survive past a single web request and run on its own
schedule — not something a Next.js request handler should do.

**The handshake**, using `api/health/route.ts` as the reference example (built specifically to
prove this works end to end):
1. `web` calls `getQueue(QueueName.HEALTH_CHECK).add(...)` — only pushes a job onto Redis,
   returns immediately (`202`). Runs no logic itself.
2. `worker`'s `startHealthCheckWorker()` (registered at boot in `apps/worker/src/index.ts`) is
   independently listening on that queue and picks the job up whenever it runs.
3. Queue names and job payload types live in one shared place
   (`packages/core/src/queue.ts`) so the enqueue side (`web`) and the listener side (`worker`)
   can't silently drift apart.

Most queues today are stubs (e.g. `scheduled-email.ts` just throws "not implemented yet
(COMM-2)"). Only health-check is fully wired, on purpose — it's the plumbing smoke test.

## `packages/*` — shared code, not services

Plain npm workspace packages (`workspace:*` in package.json), imported directly by both `web`
and `worker` — not separately-running things.

**`packages/db`** — Prisma schema + generated client. Exports one shared `prisma` client
instance (reused across hot-reloads/requests so connections aren't exhausted) plus all generated
types (`Role`, `TransactionType`, etc.).

**`packages/core`** — business logic that isn't page/route-specific, re-exported from one
`index.ts`:
- `rbac.ts` → `assertCan`/`assertCanAny`
- `audit.ts` → `recordAuditEntry` (writes to the tamper-proof `AuditLog` table — DB trigger
  rejects `UPDATE`/`DELETE` on it)
- `pdf.ts` → Puppeteer wrapper for turning document-template HTML into PDFs
- `queue.ts` → the BullMQ wiring described above
- `google/*` → Gmail/Calendar/OAuth client wrappers
- `documents/*`, `finance/*` → receipt/invoice/advance-report templates, categorization,
  extraction, subscription-renewal math

In short: `packages/core`/`packages/db` are "the backend" as libraries — `web`'s Server
Components/Actions call into them directly and synchronously. `worker` is the one actual second
process, decoupled from `web` via Redis queues, for anything that shouldn't block a request.
