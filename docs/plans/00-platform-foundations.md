# Epic 00 — Platform Foundations (`CORE`)

| Field | Value |
|---|---|
| **Epic code** | `CORE` |
| **Phase** | 0 (pre-MVP) |
| **Priority** | Must — **blocker for every other epic** |
| **Depends on** | — |
| **Blocks** | `FIN`, `TASK`, `COMM`, `HR`, `OSH`, `CRM` |
| **Status** | In progress |
| **Owner** | Eng lead |

> Traceability: PRD §6 (RBAC), §9 (NFRs), §10 (Architecture), §11 Phase 0.

## 1. Goal & business value

Stand up the shared platform every module reuses so we don't rebuild auth, access control, document generation, scheduled work, and notifications six times. Getting these primitives right early **retires our two biggest cross-cutting risks** — RBAC data leaks (R5) and unreliable scheduled jobs (R4) — and unblocks parallel work on all functional epics.

## 2. Scope

### In scope
- Application shell (web app), environment/config, CI baseline.
- Identity: login via Google Workspace accounts; session/JWT issuance.
- **RBAC** enforcement middleware (Admin / Analyst / Sales / User).
- User & role administration.
- **Google Workspace OAuth 2.0** connection (Gmail + Calendar scopes).
- **PDF generation service** (HTML/CSS templates → branded PDF).
- **Background job queue** (Redis + BullMQ or Celery) for scheduled/deferred work.
- **Shared notification service** (in-app + email).
- **Immutable audit-logging service**.

### Out of scope
- Any module-specific business logic (lives in `FIN`/`OSH`/etc.).
- Multi-company / multi-tenant (single deployment for now — PRD §7).
- Non-Google identity or email providers.

## 3. Requirements traceability

| PRD ref | Requirement | Phase |
|---|---|:--:|
| NFR-SEC | Server-side middleware validates JWT + role on **every** request; default-deny | 0 |
| NFR-AUTHZ | RBAC enforced at data layer, not just UI; cross-role leak = P0 | 0 |
| NFR-REL | Reliable at-least-once job execution with idempotency | 0 |
| NFR-AUDIT | Immutable audit log (actor, timestamp, IP where required) | 0 |
| §6 | Role matrix (Admin/Analyst/Sales/User) | 0 |
| §10 | Google OAuth 2.0, Redis queue, PDF engine | 0 |

## 4. User stories & acceptance criteria

- **As the system**, I validate a JWT and the caller's role before executing any request.
  - Given a request with no/invalid token → **401**; valid token but insufficient role → **403**; default is deny.
  - Authorization is enforced server-side; hiding UI is not sufficient. Automated authz tests cover each role × resource.
- **As an Admin**, I can create users and assign one of the four roles.
- **As an Admin**, I connect the company Google Workspace so modules can send mail and write calendar events.
  - OAuth 2.0 consent completes with the minimum required scopes; tokens refresh without re-consent; a revoked/expired token surfaces a clear reconnect prompt.
- **As any module**, I can render a branded PDF from an HTML/CSS template deterministically.
  - Same input → same output; generation error rate < 1% (NFR-DOC).
- **As any module**, I can enqueue a job to run at a specific time or in the background.
  - Executes within ±1 min of target (G4); retried on failure; never duplicated (idempotency key).
- **As a compliance/finance action**, I write an immutable audit entry.
  - Entries cannot be edited/deleted via the app; capture actor + timestamp (+ IP where required).

## 5. Dependencies
- Google Workspace admin consent for OAuth scopes (external — start early, see R2).
- Redis (or managed equivalent); PDF-render runtime (headless browser or WeasyPrint/PDFKit).

## 6. Technical notes (from PRD §10, constraints)
- Middleware: NestJS **Guards** or Django **decorators**.
- Queue: **BullMQ** (Node) or **Celery** (Python) on **Redis**.
- PDF: **Puppeteer** (headless) or **WeasyPrint / PDFKit**.
- Final stack choice owned by Engineering; these are recommendations of record.

## 7. Delivery plan

**Milestone 0.1 — App & identity**
- [x] Project scaffold, config/secrets, CI, environments.
- [x] Google login → JWT issuance + refresh. *(code complete; not yet validated against a real Google OAuth client — needs Workspace admin credentials, see §10 Open questions)*
- [x] User & role model (Admin/Analyst/Sales/User).

**Milestone 0.2 — Access control**
- [x] RBAC middleware (default-deny), role checks per route.
- [x] Data-layer authorization guards.
- [x] Automated authz test matrix (role × resource) — 20 passing e2e tests.

**Milestone 0.3 — Google integration**
- [ ] OAuth 2.0 app + consent flow; scope set for Gmail + Calendar. *(code complete — incremental-consent flow, encrypted token storage/refresh, reconnect status endpoint — but unverified against a real Google Cloud OAuth client; needs real credentials to validate end to end)*
- [ ] Token storage/refresh; reconnect UX. *(same as above)*

**Milestone 0.4 — Shared services**
- [x] PDF generation service + base branded template.
- [x] Job queue (Redis + BullMQ) with idempotency + monitoring — verified end to end (enqueue → worker → idempotent processing → status update).
- [x] Notification service (in-app + email).
- [x] Immutable audit-log service — DB trigger verified to reject UPDATE/DELETE.

**Exit criteria:** a request cannot bypass RBAC; a scheduled job fires on time; a PDF renders from a template; an audit entry is written and immutable.

## 8. Success metrics
- Guardrail: unauthorized cross-role data exposure = **0** (NFR-AUTHZ).
- G4: ≥ 99% of scheduled jobs on time.
- NFR-DOC: PDF error rate < 1%.

## 9. Risks
| Risk | Mitigation |
|---|---|
| R2 — OAuth scope approval / quotas | Validate scopes in Milestone 0.3 first; design graceful degradation + retries |
| R5 — RBAC leak | Server-side + data-layer enforcement; automated authz tests; P0 gate |
| R4 — Unreliable jobs | Idempotent at-least-once queue + monitoring |

## 10. Open questions
- Exact OAuth scopes acceptable to the Workspace admin?
- Redis: self-hosted vs managed?
- Audit-log read access & export policy (PRD §14 Q8)?
