# Epic 06 — Business Network / CRM (`CRM`)

| Field | Value |
|---|---|
| **Epic code** | `CRM` |
| **Phase** | 2 |
| **Priority** | Should |
| **Depends on** | `CORE` (RBAC) |
| **Status** | Done |
| **Owner** | PO + Eng |

> Traceability: PRD §8 Module 6. Access: **Admin + Sales** only (Analyst/User have no access — PRD §6).

## 1. Goal & business value

Capture strategic relationships as company knowledge instead of letting them live in individual phones and inboxes — so opportunities and partner context survive staff turnover. Supports faster, better-informed offer/partnership work alongside `HR` portfolio + skills.

## 2. Scope

### In scope
- Contact database for partners, subcontractors, prospects.
- Rich contact record (identity, position/company, channels, meeting notes).
- **"Strategic importance" (Value/Importance)** field or tag system.

### Out of scope
- Full sales pipeline / deal stages / forecasting (candidate for V2+).
- Email sync/threading into contacts (later).

## 3. Requirements traceability

| ID | Requirement | Phase | Priority |
|---|---|:--:|:--:|
| CRM-1 | Contact database: partners, subcontractors, prospects | 2 | S |
| CRM-2 | Record: full name, position + company, phone/email/LinkedIn, free-text notes | 2 | S |
| CRM-3 | "Strategic importance" (Value/Importance) field or tags | 2 | S |

## 4. User stories & acceptance criteria

- **As Sales, I store a strategic contact** with full name, current position + company, phone/email/LinkedIn, and free-text meeting notes (CRM-1/2).
- **As Sales, I tag why a contact matters** (e.g. "key software-services client", "potential hardware partner") so importance is explicit and filterable (CRM-3).
  - Contacts can be filtered/sorted by strategic-importance tag/value.
- **As an Admin, I control access** — only Admin and Sales can view/edit the network (RBAC).

## 5. Dependencies
- `CORE`: RBAC (Admin/Sales gate).

## 6. Technical notes
- Decide field vs tag system for "strategic importance" (tags give filtering flexibility; a single field is simpler). Recommend tags.

## 7. Delivery plan

**Milestone 6.1 — Contacts (CRM-1/2)**
- [x] Contact model + CRUD; RBAC (Admin/Sales). `Contact` model in `packages/db/prisma/schema.prisma`; `crm:read`/`crm:write` already gated to ADMIN+SALES (pre-existing). No per-user ownership scoping — the whole list is shared company knowledge, unlike Task/Leave/HR.
- [x] Fields: names, position/company, phone/email/LinkedIn, notes. `apps/web/src/app/(dashboard)/crm/{new,[id],[id]/edit}/page.tsx`.

**Milestone 6.2 — Strategic importance (CRM-3)**
- [x] Importance tags/field + filtering/sorting. Went with tags (native Postgres `String[]` column, not a separate join table — see schema comment). Filterable via `/crm?tag=`; `packages/core/src/crm/tags.ts` parses the comma-separated input (case-insensitive dedup; a tag itself can't contain a comma, no escape syntax). Sortable by name or company via `/crm?sort=`.

## 8. Success metrics
- Adoption by Sales (contacts created/updated per month).
- Qualitative: relationships retained through staff changes.

## 9. Risks
| Risk | Mitigation |
|---|---|
| R7 — Personal/contact data (GDPR) | Access limited by RBAC; access logging; retention policy |
| Low usage (data stays in personal inboxes) | Keep entry lightweight; integrate into offer/portfolio workflow |

## 10. Open questions
- Field vs tag system for strategic importance (recommend tags)?
- Any overlap/merge with `HR` portfolio client references worth linking?
