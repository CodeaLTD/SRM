# Epic 01 — Finance & Document Flow (`FIN`)

| Field | Value |
|---|---|
| **Epic code** | `FIN` |
| **Phase** | 1 (FIN-1…5) → 2 (FIN-6…7) |
| **Priority** | Must (core) / Should (subscriptions) |
| **Depends on** | `CORE` (RBAC, PDF service, job queue, OCR provider) |
| **Status** | In progress |
| **Owner** | PO + Eng |

> Traceability: PRD §8 Module 1. Access: **Admin + Analyst** only (Sales/User have no finance access — PRD §6).

## 1. Goal & business value

Turn finance from manual typing into an assisted, auditable flow. Two headline wins: **branded documents generated on demand** and **invoice data captured by AI/OCR instead of by hand** — targeting a ≥60% cut in expense-entry time (G1). The subscription tracker (Phase 2) stops silent SaaS auto-renewals (G3).

## 2. Scope

### In scope
- Generate branded PDF **receipts, advance reports (авансови отчети), proforma invoices** from HTML templates.
- Manual income/expense entry with automatic categorization.
- **AI/OCR invoice intake** with a mandatory human review step.
- **Subscription Tracker** with pre-renewal alerts (Phase 2).

### Out of scope
- Double-entry accounting / general ledger (PRD §7 — we record & export).
- Payroll computation (feeds ТРЗ, doesn't calculate).

## 3. Requirements traceability

| ID | Requirement | Phase | Priority |
|---|---|:--:|:--:|
| FIN-1 | Branded PDF receipts / advance reports / proforma invoices from HTML templates | 1 | M |
| FIN-2 | Manual income/expense entry + automatic categorization | 1 | M |
| FIN-3 | AI/OCR extract: supplier, ЕИК/Булстат, total, VAT, issue date from PDF/image | 1 | M |
| FIN-4 | Extracted data pre-fills form; transaction created with status **"За проверка"** | 1 | M |
| FIN-5 | Admin/Analyst reviews, corrects, confirms before commit | 1 | M |
| FIN-6 | Subscription Tracker: name, URL, monthly fee (multi-currency), unsubscribe date | 2 | S |
| FIN-7 | Auto-notify **X days before** auto-renewal | 2 | S |

## 4. User stories & acceptance criteria

- **As an Analyst, I upload a supplier invoice so the transaction is created for me.**
  - Given a PDF/image, extraction returns supplier, ЕИК/Булстат, total, VAT, date, and creates a transaction with status **"За проверка"**.
  - Per-field confidence is visible; I can edit any field before confirming.
  - Nothing hits the committed ledger until **Admin or Analyst confirms** (FIN-5). This review step is mandatory (mitigates R1).
- **As an Analyst, I generate a proforma invoice as a branded PDF** from a template with the client/line data I enter.
- **As an Admin, I get alerted X days before a subscription renews** so we can cancel unused tools (email + in-app), driven by the `CORE` job queue.

## 5. Dependencies
- `CORE`: PDF service (FIN-1), RBAC (Admin/Analyst gate), job queue (FIN-7 alerts), OCR/AI provider (FIN-3).
- **OCR provider decision** — Google Document AI vs OpenAI (PRD §14 Q6); accuracy on real Bulgarian invoices is the deciding factor.

## 6. Technical notes
- OCR: Google Document AI or OpenAI API for semantic extraction/structuring.
- Multi-currency storage for subscriptions; define base-currency reporting (open question).
- Reuse `CORE` PDF templating for document branding.

## 7. Delivery plan

**Milestone 1.1 — Documents (FIN-1)**
- [x] HTML/CSS templates: receipt, advance report, proforma invoice.
- [x] Generate + download/store branded PDFs via `CORE` PDF service.

**Milestone 1.2 — Transactions (FIN-2)**
- [x] Income/expense data model + entry forms.
- [x] Auto-categorization rules.

**Milestone 1.3 — OCR intake (FIN-3/4/5)**
- [ ] Upload (PDF/image) + OCR provider integration. *(upload flow + validation complete; OCR provider integration is a deliberate stub — `packages/core/src/finance/extraction.ts` `extractInvoiceFields()` always returns `{}`, pending OCR provider decision, §14 Q6)*
- [ ] Field extraction → prefilled form; status **"За проверка"**. *(status/workflow wiring complete; no fields are ever pre-filled since extraction is stubbed — see above)*
- [x] Review/correct/confirm workflow (Admin/Analyst) → commit.
- [ ] Extraction-accuracy telemetry (feeds R1 tuning + G1).

**Milestone 1.4 — Subscriptions (FIN-6/7, Phase 2)**
- [x] Subscription registry (name, URL, fee, currency, unsubscribe date).
- [x] Scheduled pre-renewal notifications (X-day lead) via job queue.

## 8. Success metrics
- G1: ≥ 60% reduction in expense-entry time (measured in-form).
- G3: 100% of tracked subscriptions alert before renewal; € saved reconciled.
- OCR correction rate trends down over time.

## 9. Risks
| Risk | Mitigation |
|---|---|
| R1 — OCR accuracy too low | Mandatory human review (FIN-5); measure & tune; easy field correction |

## 10. Open questions
- Which currencies must we support; do we convert to a base currency for reporting? (§14 Q1)
- Do receipts/proforma invoices need statutory sequential numbering? (§14 Q4)
- Retention period for financial records? (§14 Q5)
