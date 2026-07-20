# Epic 03 — Communication & Notifications (`COMM`)

| Field | Value |
|---|---|
| **Epic code** | `COMM` |
| **Phase** | 1 (COMM-1…2) → 2 (COMM-3…4) |
| **Priority** | Must (core) / Should (queue dashboard, templates) |
| **Depends on** | `CORE` (Gmail/Calendar OAuth, job queue, PDF service, notification service) |
| **Status** | Not started |
| **Owner** | PO + Eng |

> Traceability: PRD §8 Module 3.

## 1. Goal & business value

Make follow-through automatic and reliable. The system sends the right email/invite at the right moment — including **scheduled sends** for time-sensitive comms (e.g. "next business day, 09:00") — so nobody has to be online to hit send. Reliability target is a headline metric (G4: ≥99% within ±1 min).

## 2. Scope

### In scope
- Auto Gmail notification + calendar invite on task assignment / meeting scheduling.
- **Scheduled Emails** with future date/time send.
- **Queue dashboard** to view/edit/delete pending sends (Phase 2).
- **Automated email templates** with dynamically generated PDF attachments (Phase 2).

### Out of scope
- Full marketing/bulk email; non-Gmail providers.

## 3. Requirements traceability

| ID | Requirement | Phase | Priority |
|---|---|:--:|:--:|
| COMM-1 | Auto Gmail notification + calendar invite on assignment/meeting | 1 | M |
| COMM-2 | Scheduled Emails — send at a specific future date & time | 1 | M |
| COMM-3 | Queue dashboard: view / edit / delete pending scheduled emails | 2 | S |
| COMM-4 | Automated templates: prefilled HTML email + dynamic PDF attachment | 2 | S |

## 4. User stories & acceptance criteria

- **As an Admin, I schedule an email today to send tomorrow at 09:00.**
  - Given a composed email + future send time, it sends within **±1 min** of target (G4); until then I can view/edit/cancel it from the queue dashboard (COMM-3); no duplicate sends on retry.
- **As a system, when someone is added to a task or a meeting is scheduled, an email + calendar invite go out automatically** (COMM-1).
- **As an Admin, I auto-send an approved advance report to accounting** using a template with the generated PDF attached (COMM-4).
  - Given an approved document, the template email is populated and the branded PDF (from `FIN`/`CORE`) is attached and sent.

## 5. Dependencies
- `CORE`: Gmail + Calendar OAuth, **job queue** (COMM-2 reliability), PDF service (COMM-4), notification service.
- `TASK` (COMM-1 trigger on assignment), `FIN`/`HR`/`OSH` (COMM-4 document sends).

## 6. Technical notes
- Scheduled sends run on the `CORE` Redis queue (BullMQ/Celery) with idempotency keys.
- Timezone correctness matters for "next business day 09:00" semantics.

## 7. Delivery plan

**Milestone 3.1 — Auto notifications (COMM-1)**
- [ ] Email + calendar invite on task assignment / meeting scheduling.

**Milestone 3.2 — Scheduled email engine (COMM-2)**
- [ ] Compose + choose future send time (timezone-aware).
- [ ] Enqueue on `CORE` job queue; send within ±1 min; idempotent.

**Milestone 3.3 — Queue dashboard (COMM-3, Phase 2)**
- [ ] List pending sends; edit/reschedule/cancel.

**Milestone 3.4 — Templated sends (COMM-4, Phase 2)**
- [ ] HTML email templates; attach dynamically generated PDF; trigger from approvals.

## 8. Success metrics
- G4: ≥ 99% of scheduled emails sent within ±1 min of target.
- 0 duplicate sends.

## 9. Risks
| Risk | Mitigation |
|---|---|
| R4 — Scheduled emails fire late/twice | Reliable queue + idempotency + monitoring; timezone tests |
| R2 — Gmail API quota/limits | Backoff + retry; queue smooths bursts |

## 10. Open questions
- Channels beyond in-app + email needed (SMS/Slack) for critical alerts? (§14 Q7)
- Editing a queued send: version/audit needed?
