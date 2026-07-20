# Product Requirements Document (PRD)
## Codea SRM — Internal ERP, Task & Safety Management Platform

| Field | Value |
|---|---|
| **Product name** | Codea SRM (working title) |
| **Document type** | Product Requirements Document |
| **Version** | 1.0 (Draft) |
| **Status** | For review |
| **Author** | Product Owner |
| **Date** | 2026-07-14 |
| **Source of record** | `Software_Specification_with_Safety_Module_SRS.pdf` (SRS, BG) |
| **Audience** | Founders, Engineering, Design, Finance, HR, Compliance/ЗБУТ |

> **Terminology note.** This product operates in a Bulgarian legal and operational context. Regulatory terms are kept in Bulgarian with an English gloss on first use, because they carry specific legal meaning: **ЗБУТ** (Health & Safety at Work / OSH), **ГИТ** (Главна инспекция по труда — General Labour Inspectorate), **Наредба № РД-07-2** (the ordinance governing safety instructions), **ТРЗ** (payroll), **ЕИК/Булстат** (company tax ID).

---

## 1. Executive Summary

Codea SRM is a single, web-based platform that centralizes the operational and administrative "back office" of the company — finance & documents, task management, HR & leave, health-and-safety compliance, and a business/CRM network — and wires them into the tools the team already lives in (Google Workspace: Gmail + Calendar).

Today these processes are spread across spreadsheets, email threads, folder trees, and people's memory. That fragmentation costs us **time** (manual re-entry, chasing approvals), **money** (missed subscription cancellations, VAT/expense errors), and **risk** (missed ЗБУТ instruction deadlines are a direct regulatory liability with the ГИТ).

The product's north star: **eliminate manual, repetitive administrative work and make compliance automatic rather than heroic.**

This PRD reframes the engineering SRS into a product plan: who we're building for, what problems we solve, how we'll sequence delivery, and how we'll know it worked.

---

## 2. Vision & Strategic Rationale

**Vision:** One operating system for how the company runs internally — where a document, a task, a person, and a legal obligation are all first-class, connected objects, and where routine follow-through (reminders, filings, calendar events, emails) happens on its own.

**Why now / why us:**
- The team already standardizes on Google Workspace — integration leverage is high and adoption friction is low.
- AI/OCR has matured to the point where invoice data entry can be automated reliably enough to be a daily-driver feature.
- ЗБУТ compliance is non-optional and currently under-tooled; doing it well is both a risk reducer and a differentiator if we ever externalize the product.

**Strategic bets:**
1. **Integration over replacement** — meet people in Gmail/Calendar, don't ask them to abandon it.
2. **Automation as the product** — the value is in what the system does *without* being asked (renewal alerts, instruction deadlines, scheduled sends).
3. **Compliance-grade records** — auditable, timestamped, PDF-exportable artifacts that hold up in front of an inspector or an accountant.

---

## 3. Problem Statement

| # | Problem | Current pain | Cost of inaction |
|---|---|---|---|
| P1 | Financial documents are created manually | Receipts, advance reports and proforma invoices hand-made per document; expense entry is manual | Slow, error-prone, inconsistent branding |
| P2 | Invoice/expense data entry is manual | Someone reads each invoice and types supplier, VAT, amount, date | Wasted hours, keying errors, VAT mistakes |
| P3 | SaaS subscriptions renew silently | No central registry of tools, fees, renewal dates | Paying for unused tools; surprise auto-renewals |
| P4 | Task ownership & deadlines live in chat | No shared board; deadlines not on calendars | Dropped tasks, missed deadlines |
| P5 | Communication is ad-hoc | Reminders and document sends are manual and time-sensitive | Missed "send tomorrow 09:00" moments |
| P6 | HR knowledge is tribal | CVs/skills scattered; no talent search; leave requests informal | Slow staffing of offers; leave conflicts |
| P7 | ЗБУТ compliance is manual & risky | Paper logbooks, human-tracked deadlines for legally mandated instructions | Regulatory exposure with ГИТ; fines |
| P8 | Business relationships aren't captured | Strategic contacts in personal phones/inboxes | Lost opportunities; knowledge leaves with people |

---

## 4. Goals & Success Metrics

**Product goals (outcomes, not features):**

| Goal | Success metric (target) | How measured |
|---|---|---|
| G1 — Cut admin time | ≥ 60% reduction in time to record an expense (manual → OCR-assisted) | Time-in-form analytics before/after |
| G2 — Zero missed compliance deadlines | 100% of periodic ЗБУТ instructions get a ≥14-day advance alert; 0 lapsed instructions | Instruction register report |
| G3 — Stop subscription waste | 100% of tracked subscriptions alert before renewal; measurable € saved from cancellations | Subscription tracker + finance reconciliation |
| G4 — Reliable follow-through | ≥ 99% of scheduled emails sent within ±1 min of target time | Queue/worker telemetry |
| G5 — Adoption | ≥ 80% weekly active use among employees within 8 weeks of launch | Auth/session analytics |
| G6 — Faster offer prep | Time to assemble a client offer (portfolio + skills) reduced by ≥ 50% | Sales self-report + usage funnel |

**Guardrail metrics (must not regress):** data-access violations = 0; unauthorized cross-role data exposure = 0; PDF/document generation error rate < 1%.

---

## 5. Target Users & Personas

Derived from the RBAC model in the SRS. Each role is both a permission set and a persona.

**Persona A — Admin / Owner ("Мария, the operator-owner")**
- Runs the company day-to-day; ultimately accountable for compliance and finances.
- Needs: full visibility, approval controls, and confidence that nothing legal is slipping.
- Only role that can **delete critical data** and **approve leave**.

**Persona B — Analyst ("Финансист / ТРЗ")**
- Owns money and payroll inputs.
- Needs: fast, accurate finance workflows; leave/sick-leave reports for payroll.
- Deliberately walled off from HR CVs/skills, ЗБУТ detail (beyond awareness), and the sales portfolio.

**Persona C — Sales ("Търговец")**
- Prepares client offers and manages relationships.
- Needs: company portfolio, CRM network, and the skills matrix to staff proposals; read view of the team calendar.
- Strictly no access to financial data, invoices, subscriptions, or ЗБУТ registers.

**Persona D — Employee / User ("Служител")**
- Individual contributor.
- Needs: see my tasks, keep my CV/skills current, request leave, confirm my safety instruction.
- Sees only their own data and assignments.

---

## 6. Roles & Access Control (RBAC)

The platform enforces **Role-Based Access Control**. This is a core requirement, not a setting — it must be enforced server-side on every request (see NFR-SEC).

| Capability | Admin | Analyst | Sales | User |
|---|:--:|:--:|:--:|:--:|
| All modules, settings, integrations | ✅ | — | — | — |
| Delete critical data | ✅ (only) | — | — | — |
| Approve leave | ✅ (only) | — | — | — |
| Finance: income/expense/invoices/subscriptions (read+edit) | ✅ | ✅ | ❌ | ❌ |
| Leave/sick reports for payroll (ТРЗ) | ✅ | ✅ (read) | ❌ | own only |
| HR CVs / Skills Matrix | ✅ | ❌ | ✅ | own only |
| Company Portfolio (Case Studies) | ✅ | ❌ | ✅ | read |
| Business Network (CRM) | ✅ | ❌ | ✅ | ❌ |
| Team calendar | ✅ | ✅ | ✅ (read) | own |
| ЗБУТ registers & detail | ✅ | awareness only | ❌ | own confirmation |
| Own tasks / own CV / own leave / own instruction | ✅ | ✅ | ✅ | ✅ |

> **Design principle:** default-deny. A role sees nothing it isn't explicitly granted, and cross-role leakage is a P0 defect.

---

## 7. Scope

**In scope (this product):** the six functional modules below, the RBAC model, Google Workspace integration, AI/OCR invoice capture, background job processing, and branded PDF generation.

**Out of scope (for now — candidates for later):**
- Full double-entry accounting / general ledger (we record and export, we are not an accounting engine).
- Payroll calculation itself (we feed ТРЗ, we don't compute salaries).
- Customer-facing / external portal (internal tool first).
- Mobile native apps (responsive web is the target).
- Non-Google email/calendar providers (Microsoft 365, etc.).
- Multi-company / multi-tenant SaaS (single-company deployment first).

---

## 8. Functional Requirements by Module

Priorities use **MoSCoW**: **M**ust (MVP), **S**hould (V1), **C**ould (V2), **W**on't-yet. Each module = an epic; requirements carry IDs for traceability back to the SRS.

### Module 1 — Finance & Document Flow  *(Epic: FIN)*

| ID | Requirement | Priority |
|---|---|:--:|
| FIN-1 | Generate official **receipts, advance reports (авансови отчети), and proforma invoices** as branded PDFs from predefined HTML templates | M |
| FIN-2 | Manually record income & expense transactions with **automatic categorization** | M |
| FIN-3 | **AI/OCR invoice intake** — upload PDF/image; auto-extract supplier name, ЕИК/Булстат, total, VAT, issue date | M |
| FIN-4 | OCR-extracted data pre-fills the finance form; transaction is created with status **"For review" (За проверка)** | M |
| FIN-5 | Admin/Analyst reviews, corrects, and confirms the record before it is committed | M |
| FIN-6 | **Subscription Tracker** — registry of SaaS/hosting/API subscriptions: name, URL, monthly fee (**multi-currency**), unsubscribe date | S |
| FIN-7 | Automatic notification **X days before** a subscription auto-renews | S |

**Representative user stories & acceptance criteria**

- *As an Analyst, I upload a supplier invoice so that the transaction is created for me instead of typed by hand.*
  - **Given** a PDF or image invoice, **when** I upload it, **then** the system extracts supplier, ЕИК/Булстат, total, VAT, and date, and **creates a transaction with status "За проверка".**
  - Extraction confidence is visible; I can edit any field before confirming.
  - Nothing enters the committed ledger until an **Admin or Analyst confirms** (FIN-5).
- *As an Admin, I want subscriptions to warn me before renewing so we stop paying for tools we dropped.*
  - **Given** a subscription with an unsubscribe date, **when** the date is X days away, **then** I receive a notification (email + in-app) in time to cancel.

### Module 2 — Task Management (Task Dashboard)  *(Epic: TASK)*

| ID | Requirement | Priority |
|---|---|:--:|
| TASK-1 | **Kanban board + list views** with statuses **To Do / In Progress / Done** | M |
| TASK-2 | **Multiple assignees** per task (multi-association of responsible people) | M |
| TASK-3 | Setting a task **deadline auto-creates a Google Calendar event** in the personal calendars of all assignees | M |

- *As a User, when I'm assigned a task with a deadline, it appears on my Google Calendar automatically so I don't miss it.*
  - **Given** a task with assignees and a deadline, **when** the deadline is set/changed, **then** a calendar event is created/updated for each assignee; **when** assignees change, calendar events stay in sync.

### Module 3 — Communication & Notifications  *(Epic: COMM)*

| ID | Requirement | Priority |
|---|---|:--:|
| COMM-1 | On task-assignment or meeting scheduling, auto-send **Gmail notification + calendar invite** | M |
| COMM-2 | **Scheduled Emails** — compose an email/document send for a specific future date & time (e.g. next business day 09:00) | M |
| COMM-3 | **Queue dashboard** to view, edit, or delete pending scheduled emails | S |
| COMM-4 | **Automated email templates** — prefilled HTML emails with a **dynamically generated PDF attachment** (e.g. auto-send an approved advance report to accounting) | S |

- *As an Admin, I schedule an email today to go out tomorrow at 09:00 so time-sensitive comms leave at the right moment without me being online.*
  - **Given** a composed email with a future send time, **when** that time arrives, **then** it is sent within ±1 minute (see G4); **and** until then I can view/edit/cancel it from the queue dashboard.

### Module 4 — HR, Leave & Corporate Portfolio  *(Epic: HR)*

| ID | Requirement | Priority |
|---|---|:--:|
| HR-1 | **Skills Matrix / CV database** — tech stack, languages, expertise levels, internal projects worked on | M |
| HR-2 | **Talent search** — find people internally by technology/skill | S |
| HR-3 | **Branded CV PDF export** with **personal contacts hidden** (client-safe version) | S |
| HR-4 | **Leave management** — request paid/unpaid/sick leave with period + substitute | M |
| HR-5 | Leave request routes through **Admin approval** (Admin-only, per RBAC) | M |
| HR-6 | On approval, employee is auto-marked **Out of Office in Google Calendar**, and task assignment during that period is guarded/flagged | M |
| HR-7 | **Company Portfolio / Case Studies** — projects with description, client, industry, tech stack, and links to the team members who built them | S |

- *As an Employee, I request leave with a substitute and, once my Admin approves, I'm automatically shown Out of Office and shielded from careless task assignment.*
  - **Given** an approved leave request, **then** an OOO event is created in Google Calendar for the period **and** the system warns before assigning that person tasks in that window.
- *As Sales, I export a candidate's CV as a branded PDF with contacts hidden so I can put it in a client offer safely.*

### Module 5 — Health & Safety at Work / ЗБУТ  *(Epic: OSH)* — **compliance-critical**

| ID | Requirement | Priority |
|---|---|:--:|
| OSH-1 | **Instruction register** supporting the four types per **Наредба № РД-07-2**: Начален (Initial), На работното място (Workplace), Периодичен (Periodic), Извънреден (Extraordinary) | M |
| OSH-2 | **Instruction profile** — employee, type, date conducted, instructor (lecturer), and **auto-calculated next periodic date** | M |
| OSH-3 | Automatic tracking of periodic deadlines; **notify Admin 14 days before** expiry | M |
| OSH-4 | Auto-create the repeat-instruction event in the responsible persons' **Google Calendar** | M |
| OSH-5 | **Digital acknowledgement** — employee gets a notification + button to confirm completed instruction | M |
| OSH-6 | On confirmation, **log exact timestamp + IP address** and generate a **PDF compliance declaration** ready for the **ГИТ** | M |

- *As an Admin, I'm alerted 14 days before any periodic instruction lapses, and the repeat is already on the responsible person's calendar, so we are never out of compliance.*
- *As an Employee, I click "confirm" on my instruction and the system produces a timestamped, IP-logged PDF declaration that would satisfy a ГИТ inspection.*
  - **Given** a completed instruction, **when** the employee confirms, **then** the system records time + IP and generates the declaration PDF; the record is immutable/audit-logged.

> **Why this module leads on priority:** OSH is the only module where the cost of *not* doing it is a legal/financial penalty. Its "Must" items are non-negotiable for launch to any team subject to Bulgarian labor law.

### Module 6 — Business Network (CRM)  *(Epic: CRM)*

| ID | Requirement | Priority |
|---|---|:--:|
| CRM-1 | Contact database for partners, subcontractors, prospects | S |
| CRM-2 | Contact record: full name, current position + company, phone/email/LinkedIn, free-text meeting notes | S |
| CRM-3 | **"Strategic importance" (Value/Importance)** field or tag system describing why the contact matters (e.g. "key software-services client", "potential hardware partner") | S |

---

## 9. Non-Functional Requirements (NFRs)

| ID | Area | Requirement |
|---|---|---|
| NFR-SEC | Security | **Server-side API middleware** (e.g. NestJS Guards / Django decorators) validates a **JWT** and checks the user role on **every** request before executing it. Default-deny. |
| NFR-AUTHZ | Authorization | RBAC enforced at the data layer, not just the UI. Cross-role data exposure is a P0 defect (guardrail metric). |
| NFR-REL | Reliability | Scheduled/background jobs (emails, alerts) execute at the intended time with ≥99% on-time delivery (G4). At-least-once with idempotency; no duplicate sends. |
| NFR-AUDIT | Auditability | Compliance-relevant actions (ЗБУТ confirmations, leave approvals, critical deletes) are immutably logged with actor, timestamp, and (where required) IP. |
| NFR-PRIV | Privacy | Personal data (CVs, contacts, health/leave data) handled per **GDPR**; CV export supports contact redaction (HR-3); role walls prevent unauthorized PII access. |
| NFR-PERF | Performance | Interactive views (boards, lists, registers) load in < 2s under normal load; OCR extraction returns within a few seconds or runs async with a "processing" state. |
| NFR-DOC | Document fidelity | Generated PDFs are pixel-consistent, branded, and deterministic from templates; generation error rate < 1%. |
| NFR-I18N | Localization | Bulgarian-first UI and content; currency handling is multi-currency (FIN-6); dates/legal terms follow local conventions. |
| NFR-AVAIL | Availability | Target 99.5% uptime for core web app during business hours; degraded (queued) behavior rather than data loss if an external API (Google) is down. |

---

## 10. Technical Architecture & Integrations

*(From SRS §4 — treated as constraints/recommendations, final choices owned by Engineering.)*

- **API security middleware:** JWT validation + role check on every request (NestJS Guards or Django decorators). → *NFR-SEC*
- **Background processing:** Redis-backed job queue (**BullMQ** for Node.js or **Celery** for Python) to guarantee precise, reliable execution of scheduled emails and time-based alerts. → *Modules 3 & 5, NFR-REL*
- **PDF generation:** headless browser engine (**Puppeteer**) or a library (**WeasyPrint / PDFKit**) rendering HTML/CSS templates → official PDFs (invoices, CVs, ЗБУТ declarations). → *Modules 1, 4, 5*
- **External integrations:**
  - **Google Workspace APIs** — Gmail API + Calendar API via **OAuth 2.0** (notifications, invites, OOO events, instruction reminders).
  - **OCR/AI** — **Google Document AI** or **OpenAI API** for semantic parsing and structuring of invoices. → *FIN-3/4*

**Integration risk note:** Google API quotas, OAuth scope approval, and OCR accuracy are external dependencies on the critical path (see §13).

---

## 11. Release Plan / Roadmap

Sequencing is driven by **risk retirement + fastest value**: prove the two hardest, highest-value bets early (OCR intake, reliable scheduling) and ship compliance (OSH) as a first-class MVP concern.

**Phase 0 — Foundations (pre-MVP)**
- AuthN/AuthZ, RBAC middleware (NFR-SEC/AUTHZ), user & role management, Google OAuth connection, PDF templating engine, job queue infra.

**Phase 1 — MVP ("Must")**
- Module 5 **ЗБУТ** core: OSH-1…6 (compliance can't wait).
- Module 1 finance core: FIN-1…5 (document generation + OCR intake + review flow).
- Module 2 tasks: TASK-1…3.
- Module 3 comms core: COMM-1, COMM-2.
- Module 4 leave core: HR-1, HR-4…6.
- **MVP exit criteria:** a team can run safety compliance, capture expenses via OCR, manage tasks with calendar sync, request/approve leave, and schedule emails — all under enforced RBAC.

**Phase 2 — V1 ("Should")**
- FIN-6/7 subscription tracker + renewal alerts.
- COMM-3/4 queue dashboard + templated PDF sends.
- HR-2/3/7 talent search, client-safe CV export, portfolio/case studies.
- CRM-1…3 business network.

**Phase 3 — V2 ("Could") & scale**
- Advanced analytics/reporting across finance & HR; deeper CRM (pipeline/importance analytics); refinements to OCR categorization; potential externalization/multi-company (currently out of scope).

---

## 12. Dependencies & Assumptions

**Dependencies**
- Google Workspace admin consent for required OAuth scopes (Gmail/Calendar).
- OCR/AI provider account, quota, and acceptable accuracy on real Bulgarian invoices.
- Redis (or managed equivalent) for queues; PDF-render runtime (headless browser or library).

**Assumptions**
- Single company, single deployment (not multi-tenant SaaS yet).
- All users have Google Workspace accounts in the company domain.
- Bulgarian legal requirements (Наредба № РД-07-2, GDPR) are the compliance baseline; legal will validate the ЗБУТ declaration format for ГИТ acceptance.
- Responsive web is sufficient; no native mobile at launch.

---

## 13. Risks & Mitigations

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|:--:|:--:|---|
| R1 | OCR accuracy too low on real invoices | High | Med | Human-in-the-loop "За проверка" review is mandatory (FIN-5); measure & tune; allow easy correction |
| R2 | Google API quotas / OAuth scope rejection | High | Med | Verify scopes early in Phase 0; design graceful degradation + queued retries (NFR-REL) |
| R3 | ЗБУТ declaration not accepted by ГИТ | High | Low | Legal review of PDF format & logged fields before Phase 1 exit; keep immutable audit trail |
| R4 | Scheduled emails fire late/twice | Med | Med | Reliable queue (BullMQ/Celery) with idempotency + monitoring (G4) |
| R5 | RBAC leak exposes finance/HR/PII across roles | High | Low | Server-side enforcement, default-deny, automated authz tests, P0 guardrail |
| R6 | Low adoption (team stays in spreadsheets/inbox) | High | Med | Integration-first UX; automate the annoying parts; track WAU (G5); onboard per-persona |
| R7 | GDPR handling of health/leave/CV data | High | Low | Data minimization, redaction on export (HR-3), access logging, retention policy |

---

## 14. Open Questions

1. **Currencies & FX:** Which currencies must the subscription tracker and finance module support, and do we convert to a base currency for reporting?
2. **ЗБУТ periodicity rules:** Exact interval rules per instruction type/role for the auto-calculated "next periodic date" (OSH-2) — confirm against Наредба № РД-07-2.
3. **Leave types & approval chain:** Beyond paid/unpaid/sick, are there other leave types, and is approval always Admin-only or can it be delegated?
4. **Document numbering:** Do receipts/proforma invoices need statutory sequential numbering / accounting-compliant identifiers?
5. **Retention & deletion:** Retention periods for financial records, ЗБУТ declarations, and CVs; who/what triggers deletion (ties to "Admin only can delete critical data").
6. **OCR provider decision:** Google Document AI vs OpenAI — decided by accuracy on Bulgarian invoices + cost + data-residency.
7. **Notification channels:** Is in-app + email enough, or is there demand for other channels (e.g. SMS/Slack) for critical ЗБУТ/subscription alerts?
8. **Audit access:** Who can read the audit logs, and are they exportable for inspections?

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **ЗБУТ** | Здравословни и безопасни условия на труд — Health & Safety at Work (OSH) |
| **ГИТ** | Главна инспекция по труда — General Labour Inspectorate (the auditor for ЗБУТ) |
| **Наредба № РД-07-2** | Bulgarian ordinance defining mandatory safety-instruction types & rules |
| **ТРЗ** | Труд и работна заплата — payroll / labor & wages |
| **ЕИК / Булстат** | Bulgarian unified company identification (tax) number |
| **RBAC** | Role-Based Access Control |
| **OCR** | Optical Character Recognition (invoice data extraction) |
| **Авансов отчет** | Advance (expense) report |
| **Проформа фактура** | Proforma invoice |
| **OOO** | Out of Office |

---

*This PRD is derived from and traceable to the source SRS. Where the SRS specified engineering choices (§10), they are recorded as constraints; final technical decisions remain with Engineering. Update the version table on each revision.*
