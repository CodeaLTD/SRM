# Epic 04 — HR, Leave & Corporate Portfolio (`HR`)

| Field | Value |
|---|---|
| **Epic code** | `HR` |
| **Phase** | 1 (HR-1, HR-4…6) → 2 (HR-2, HR-3, HR-7) |
| **Priority** | Must (leave core, skills matrix) / Should (search, CV export, portfolio) |
| **Depends on** | `CORE` (RBAC, PDF export, Calendar OOO, audit log) |
| **Status** | Not started |
| **Owner** | PO + Eng |

> Traceability: PRD §8 Module 4. Access: Skills/Portfolio → **Admin + Sales** (offer prep); leave → all users request, **Admin approves**; Analyst gets leave/sick reports for ТРЗ (read).

## 1. Goal & business value

Turn tribal HR knowledge into a searchable asset and make leave a clean, auditable, calendar-aware workflow. Speeds offer preparation (G6: ≥50% faster) via the skills matrix + client-safe CV export, and prevents leave/task conflicts by marking people Out of Office.

## 2. Scope

### In scope
- **Skills Matrix / CV database** (stack, languages, expertise, internal projects).
- **Talent search** by technology (Phase 2).
- **Branded CV PDF export with contacts hidden** (client-safe) (Phase 2).
- **Leave management** (paid/unpaid/sick) with period + substitute, **Admin approval**, auto **Out of Office** in Google Calendar, and guarded task assignment during leave.
- **Company Portfolio / Case Studies** (Phase 2).

### Out of scope
- Payroll calculation (Analyst exports for ТРЗ; we don't compute salaries — PRD §7).
- Performance reviews / org chart (later).

## 3. Requirements traceability

| ID | Requirement | Phase | Priority |
|---|---|:--:|:--:|
| HR-1 | Skills Matrix / CV DB: stack, languages, expertise, internal projects | 1 | M |
| HR-4 | Leave request (paid/unpaid/sick) with period + substitute | 1 | M |
| HR-5 | Leave routes through **Admin approval** (Admin-only) | 1 | M |
| HR-6 | On approval → auto **OOO in Google Calendar** + guard task assignment in period | 1 | M |
| HR-2 | Talent search by technology/skill | 2 | S |
| HR-3 | Branded CV PDF export with personal contacts hidden | 2 | S |
| HR-7 | Company Portfolio / Case Studies (desc, client, industry, stack, team links) | 2 | S |

## 4. User stories & acceptance criteria

- **As an Employee, I keep my CV/skills current** — tech stack, languages, expertise levels, internal projects.
- **As an Employee, I request leave with a substitute; once my Admin approves, I'm shown Out of Office and shielded from careless task assignment.**
  - Request captures type (paid/unpaid/sick), period, substitute; routes to **Admin** (only Admin approves — HR-5).
  - On approval: OOO event created in Google Calendar for the period (HR-6); assigning that person a task in that window triggers a warning (coordinate with `TASK`); approval is audit-logged (`CORE`).
- **As Sales, I search people by technology and export a client-safe CV PDF** with personal contacts hidden (HR-2/HR-3).
- **As Sales/Admin, I browse the company portfolio** — projects with client, industry, stack, and links to the team members who built them (HR-7).

## 5. Dependencies
- `CORE`: RBAC (role walls around PII), PDF export (HR-3), Calendar OOO (HR-6), audit log (HR-5 approvals), notification service.
- `TASK`: task-assignment guard during leave (HR-6 ↔ TASK-3).

## 6. Technical notes
- **GDPR-sensitive** (CVs, health/leave data). CV export must redact personal contacts; enforce role walls; log PII access (NFR-PRIV).

## 7. Delivery plan

**Milestone 4.1 — Skills Matrix (HR-1)**
- [ ] Employee profile model (stack, languages, expertise, projects).
- [ ] Self-edit for own profile; Admin/Sales read per RBAC.

**Milestone 4.2 — Leave workflow (HR-4/5/6)**
- [ ] Leave request form (type, period, substitute).
- [ ] Admin approval flow (audit-logged).
- [ ] OOO calendar event on approval; task-assignment guard.
- [ ] Leave/sick report for Analyst (ТРЗ, read).

**Milestone 4.3 — Talent tooling (HR-2/3, Phase 2)**
- [ ] Search people by technology/skill.
- [ ] Client-safe branded CV PDF export (contacts hidden).

**Milestone 4.4 — Portfolio (HR-7, Phase 2)**
- [ ] Case-studies catalog with team-member links.

## 8. Success metrics
- G6: ≥ 50% faster offer assembly (skills + portfolio).
- 0 unauthorized PII access (guardrail, NFR-PRIV).
- Leave conflicts (task assigned during approved leave) trend to 0.

## 9. Risks
| Risk | Mitigation |
|---|---|
| R7 — GDPR handling of health/leave/CV data | Data minimization, redaction on export, access logging, retention policy |
| R5 — Cross-role PII leak | RBAC role walls (Analyst blocked from CVs; Sales blocked from finance) |

## 10. Open questions
- Leave types beyond paid/unpaid/sick? Approval always Admin-only or delegable? (§14 Q3)
- Retention for CVs and leave records; deletion trigger? (§14 Q5)
