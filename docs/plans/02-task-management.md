# Epic 02 — Task Management (`TASK`)

| Field | Value |
|---|---|
| **Epic code** | `TASK` |
| **Phase** | 1 |
| **Priority** | Must |
| **Depends on** | `CORE` (RBAC, Google Calendar via OAuth) |
| **Status** | Not started |
| **Owner** | PO + Eng |

> Traceability: PRD §8 Module 2. Everyone has access to their own tasks; visibility follows RBAC.

## 1. Goal & business value

Move operational work out of chat threads and into a shared, visual board where ownership and deadlines are explicit — and where deadlines land on people's **Google Calendars automatically** so nothing is dropped. Directly supports adoption (G5).

## 2. Scope

### In scope
- Kanban board + list views with **To Do / In Progress / Done**.
- **Multiple assignees** per task.
- Deadline → auto-created Google Calendar event for each assignee, kept in sync.

### Out of scope
- Time tracking, sub-tasks, dependencies/Gantt (candidates for later).
- Non-Google calendar sync.

## 3. Requirements traceability

| ID | Requirement | Phase | Priority |
|---|---|:--:|:--:|
| TASK-1 | Kanban board + list views with statuses To Do / In Progress / Done | 1 | M |
| TASK-2 | Multiple assignees per task | 1 | M |
| TASK-3 | Deadline auto-creates a Google Calendar event for all assignees | 1 | M |

## 4. User stories & acceptance criteria

- **As a User, I see my tasks on a board and move them across statuses.**
  - Cards show title, assignees, deadline; drag/update moves between To Do / In Progress / Done.
- **As a task creator, I assign several responsible people to one task.**
- **As an assignee, a task deadline appears on my Google Calendar automatically.**
  - Given a task with assignees and a deadline, setting/changing the deadline creates/updates a calendar event for each assignee; changing the assignee set adds/removes events accordingly; removing the deadline removes the events.

## 5. Dependencies
- `CORE`: Google Calendar write access (OAuth), RBAC, notification service.
- Interacts with `HR` leave (HR-6): assigning tasks to someone marked Out of Office should warn.

## 6. Technical notes
- Calendar event lifecycle must stay idempotent and in sync with task edits (reuse `CORE` job/integration layer).

## 7. Delivery plan

**Milestone 2.1 — Board core (TASK-1/2)**
- [ ] Task model (status, assignees[], deadline).
- [ ] Kanban + list views; status transitions.
- [ ] Multi-assignee UI.

**Milestone 2.2 — Calendar sync (TASK-3)**
- [ ] Create calendar event on deadline set.
- [ ] Sync on assignee/deadline change; clean up on removal.
- [ ] Cross-check with leave/OOO (coordinate with `HR`).

## 8. Success metrics
- Contributes to G5 (≥ 80% WAU): board is the daily entry point.
- % of tasks with deadlines that successfully created calendar events (≈100%).

## 9. Risks
| Risk | Mitigation |
|---|---|
| Calendar sync drift on edits | Idempotent event upserts; reconciliation job |

## 10. Open questions
- Should board columns/statuses be configurable, or fixed to the three specified?
- Notification on assignment handled here or via `COMM` (COMM-1)? → treat `COMM` as owner, `TASK` as trigger source.
