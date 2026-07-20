# Codea SRM — Epic Plans

This folder breaks the [Product Requirements Document](../../PRD.md) into **self-contained epic plans**. Each file is an actionable work plan for one epic: goal, scope, user stories with acceptance criteria, dependencies, a milestone/task breakdown, metrics, and risks.

Requirement IDs (e.g. `FIN-3`, `OSH-6`) are traceable back to PRD §8.

## Epics

| # | Epic | Code | Phase | Priority | Depends on |
|---|---|---|---|---|---|
| [00](./00-platform-foundations.md) | Platform Foundations (enabler) | `CORE` | 0 | Must (blocker) | — |
| [01](./01-finance-and-documents.md) | Finance & Document Flow | `FIN` | 1 → 2 | Must / Should | `CORE` |
| [02](./02-task-management.md) | Task Management | `TASK` | 1 | Must | `CORE` |
| [03](./03-communication-and-notifications.md) | Communication & Notifications | `COMM` | 1 → 2 | Must / Should | `CORE` |
| [04](./04-hr-leave-and-portfolio.md) | HR, Leave & Corporate Portfolio | `HR` | 1 → 2 | Must / Should | `CORE` |
| [05](./05-health-and-safety-zbut.md) | Health & Safety at Work (ЗБУТ) | `OSH` | 1 | Must (compliance) | `CORE` |
| [06](./06-business-network-crm.md) | Business Network (CRM) | `CRM` | 2 | Should | `CORE` |

## Recommended delivery order

1. **`CORE`** — nothing ships until Auth/RBAC, Google OAuth, the PDF engine, and the job queue exist.
2. **`OSH` + `FIN` (Must slice)** in parallel — the two highest-value / highest-risk MVP epics (compliance liability + OCR bet).
3. **`TASK`, `COMM` (Must slice), `HR` (leave slice)** — complete the MVP surface.
4. **Phase 2 slices** — `FIN` subscriptions, `COMM` queue/templates, `HR` talent/portfolio, then `CRM`.

See PRD §11 for the full roadmap and §14 for cross-cutting open questions.

## Status legend

`Not started` · `In progress` · `In review` · `Done` — update the status field in each epic's header table as work progresses.
