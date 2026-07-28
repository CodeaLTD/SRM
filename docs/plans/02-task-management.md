# Epic 02 — Task Management (`TASK`)

| Field | Value |
|---|---|
| **Epic code** | `TASK` |
| **Phase** | 1 |
| **Priority** | Must |
| **Depends on** | `CORE` (RBAC, Google Calendar via OAuth) |
| **Status** | Done (Milestones 2.1 and 2.2 complete) |
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
- `CORE`: Google Calendar write access (OAuth) — *(implemented — real OAuth credentials in `.env`, consent flow at `/api/google/connect` + `/api/google/callback`, encrypted token storage in `packages/core/src/google/token-store.ts`/`token-crypto.ts`, connect/disconnect UI at `/settings/google`. This same plumbing is what HR-6's and OSH-4's own `TODO` seams are waiting on — they can hook in without rebuilding any of this.)*
- Interacts with `HR` leave (HR-6): assigning tasks to someone marked Out of Office should warn. *(implemented — `checkLeaveOverlapWarnings` in `apps/web/src/app/(dashboard)/tasks/actions.ts` reuses `overlapsExistingLeave` from `packages/core/src/hr/leave-period.ts`, exactly the reuse that function's doc comment anticipated; fires a non-blocking warning banner, not a hard block, on task create/edit/assignee-set when a deadline falls inside an assignee's pending/approved leave)*

## 6. Technical notes
- Calendar event lifecycle must stay idempotent and in sync with task edits (reuse `CORE` job/integration layer).

## 7. Delivery plan

**Milestone 2.1 — Board core (TASK-1/2)**
- [x] Task model (status, assignees[], deadline). `Task`/`TaskAssignee` models, first many-to-many in the schema (explicit join table, not implicit Prisma m:n, to stay consistent with the rest of the schema's audit-friendly, id+timestamped-row style).
- [x] Kanban + list views; status transitions. Board (`/tasks`, 3 columns, button-forms — no drag-and-drop, since this app has no client components anywhere yet) and a separate list view (`/tasks/list`).
- [x] Multi-assignee UI. Checkbox-based assignee selection on task creation (`/tasks/new`) and editing (`/tasks/[id]/edit`).

**Milestone 2.2 — Calendar sync (TASK-3)**
- [x] Create calendar event on deadline set. Per-assignee, date-only deadlines become full-day events (`taskDeadlineToEventWindow` in `packages/core/src/tasks/status.ts`); best-effort — an assignee who hasn't connected Calendar is silently skipped, not blocked or warned.
- [x] Sync on assignee/deadline change; clean up on removal. `syncAssigneeCalendarEvents` in `tasks/actions.ts` upserts/removes per assignee, storing each event id on `TaskAssignee.calendarEventId` so edits update the same event instead of duplicating; deleting a task or removing an assignee removes their event.
- [x] Cross-check with leave/OOO (coordinate with `HR`). Already covered by Milestone 2.1's `checkLeaveOverlapWarnings` — unchanged by this milestone.

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
