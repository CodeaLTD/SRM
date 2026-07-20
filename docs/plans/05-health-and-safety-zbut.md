# Epic 05 — Health & Safety at Work / ЗБУТ (`OSH`)

| Field | Value |
|---|---|
| **Epic code** | `OSH` |
| **Phase** | 1 |
| **Priority** | **Must — compliance-critical** |
| **Depends on** | `CORE` (job queue, Calendar, PDF, audit log with IP) |
| **Status** | Not started |
| **Owner** | PO + Compliance |

> Traceability: PRD §8 Module 5. Access: **Admin** manages registers; employees confirm their own instruction; Analyst awareness-only; Sales no access.

## 1. Goal & business value

Make **legally mandated safety-instruction compliance automatic** instead of a manual, error-prone paper process. This is the one epic where *not* shipping carries a direct legal/financial penalty from the **ГИТ (Главна инспекция по труда)**. Goal: **zero lapsed periodic instructions** (G2) and inspection-ready, timestamped PDF declarations on demand.

**This is why `OSH` leads Phase 1 priority alongside `FIN`.**

## 2. Scope

### In scope
- **Instruction register** for the four types under **Наредба № РД-07-2**: Начален (Initial), На работното място (Workplace), Периодичен (Periodic), Извънреден (Extraordinary).
- **Instruction profile** with auto-calculated next-periodic date.
- **Automatic deadline tracking**: notify Admin **14 days** before expiry + auto-create the repeat event in Google Calendar.
- **Digital acknowledgement** by the employee, logging **timestamp + IP**, generating a **PDF compliance declaration** for the ГИТ.

### Out of scope
- Broader OSH management beyond instructions (risk assessments, incident logs) — later.

## 3. Requirements traceability

| ID | Requirement | Phase | Priority |
|---|---|:--:|:--:|
| OSH-1 | Register supporting the 4 instruction types (Наредба № РД-07-2) | 1 | M |
| OSH-2 | Instruction profile: employee, type, date, instructor, **auto next-periodic date** | 1 | M |
| OSH-3 | Track periodic deadlines; **notify Admin 14 days before** expiry | 1 | M |
| OSH-4 | Auto-create repeat-instruction event in responsible persons' Google Calendar | 1 | M |
| OSH-5 | Employee digital acknowledgement (notification + confirm button) | 1 | M |
| OSH-6 | On confirm: log **timestamp + IP**; generate **PDF declaration** for ГИТ | 1 | M |

## 4. User stories & acceptance criteria

- **As an Admin, I record an instruction** (type, employee, date conducted, instructor) and the system computes the next periodic date automatically (OSH-1/2).
- **As an Admin, I'm alerted 14 days before any periodic instruction lapses**, and the repeat is already on the responsible person's calendar (OSH-3/4).
  - Given an approaching periodic deadline, a notification fires to the Admin at the 14-day mark and a Google Calendar event is created for the responsible person(s).
- **As an Employee, I confirm my completed instruction with one click, producing a legally usable record** (OSH-5/6).
  - On confirm, the system logs exact timestamp + IP address and generates a branded **PDF declaration**; the record is immutable/audit-logged and exportable for a ГИТ inspection.

## 5. Dependencies
- `CORE`: job queue (OSH-3 timed alerts), Calendar (OSH-4), PDF service (OSH-6), **immutable audit log with IP capture** (OSH-6), notification service (OSH-5).
- **Legal/Compliance sign-off** on the declaration format and logged fields before Phase 1 exit (R3).

## 6. Technical notes
- Next-periodic-date calculation must follow the interval rules per instruction type/role in Наредба № РД-07-2 (confirm exact rules — open question).
- Declaration PDF + acknowledgement record are compliance artifacts: immutable, timestamped, IP-logged (NFR-AUDIT).

## 7. Delivery plan

**Milestone 5.1 — Register & profiles (OSH-1/2)**
- [ ] Instruction types (Начален / На работното място / Периодичен / Извънреден).
- [ ] Instruction profile model; auto next-periodic-date calculation.

**Milestone 5.2 — Deadline automation (OSH-3/4)**
- [ ] Scheduled 14-day-before Admin notifications (job queue).
- [ ] Auto-create repeat instruction calendar event.

**Milestone 5.3 — Acknowledgement & declaration (OSH-5/6)**
- [ ] Employee notification + confirm button.
- [ ] Log timestamp + IP; immutable audit entry.
- [ ] Generate branded PDF declaration (ГИТ-ready).

**Milestone 5.4 — Compliance validation**
- [ ] Legal review of declaration format + logged fields (gates Phase 1 exit).

**Exit criteria:** no periodic instruction can lapse without a ≥14-day alert; every confirmation yields an immutable, IP-timestamped PDF declaration.

## 8. Success metrics
- **G2: 100% of periodic instructions get a ≥14-day advance alert; 0 lapsed instructions.**
- 100% of confirmations produce a valid PDF declaration.

## 9. Risks
| Risk | Mitigation |
|---|---|
| R3 — Declaration not accepted by ГИТ | Legal review before Phase 1 exit; immutable audit trail; align fields to regulation |
| R4 — Missed timed alert | Reliable job queue + monitoring (`CORE`) |

## 10. Open questions
- Exact periodicity/interval rules per instruction type and role for OSH-2? (§14 Q2 — confirm against Наредба № РД-07-2)
- Retention period for ЗБУТ declarations; who can delete (Admin-only)? (§14 Q5)
