# Surevia — Requirements Gap Analysis

> Generated: 2026-03-30

---

## A. Document Upload + Scan

### What Exists
- **File upload**: `POST /api/upload` — max 10MB, validates MIME types (PDF, images, Word, Excel, text), stores to local filesystem with UUID filenames
- **Filename parsing**: `src/lib/document-parser.ts` — 5 date regex patterns, 10 category keyword maps, confidence scoring (`high` / `medium` / `low`)
- **Analysis endpoint**: `POST /api/documents/analyze` — calls `parseDocument(filename)`, returns suggested title / category / expiration date
- **Upload-to-deadline flow**: Deadline detail page → upload → filename analyzed → suggestion banner → "Upload & Apply" (PUTs category/date to deadline) or "Upload Only"
- **File download**: `GET /api/documents/[id]` — serves file with proper headers, company-level access check

### What's Missing

| Gap | Severity |
|-----|----------|
| No PDF/image content reading — only filename is parsed | High |
| No OCR integration (Tesseract, AWS Textract, Google Vision, etc.) | High |
| No content-based extraction of dates, policy numbers, coverage amounts | High |
| No document preview or thumbnail generation | Medium |
| No multi-file batch upload | Low |
| No drag-and-drop upload UI on a standalone documents view | Low |

### Verdict
The filename intelligence is solid as a first pass, but the **"Scan"** half of "Upload + Scan" is entirely absent. The system reads the filename, not the document content.

---

## B. Verification Layer

### What Exists
- **Statuses**: `active`, `due_soon`, `overdue`, `completed`, `archived` — computed by `src/lib/deadline-status.ts` based on days until expiration
- **Completion flow**: `POST /api/deadlines/[id]/complete` — marks completed with optional notes and `handledById`
- **Confidence levels**: `document-parser.ts` returns `high` / `medium` / `low`, shown in the UI suggestion banner — but never persisted or acted upon

### What's Missing

| Gap | Severity |
|-----|----------|
| No `uploaded` / `scanned` / `needs_review` / `verified` statuses | High |
| No verification workflow — no review queue for low-confidence extracted data | High |
| Confidence score not persisted on Document or Deadline model | High |
| No admin review dashboard for flagged items | High |
| No "pending verification" state that blocks reminder activation | Medium |
| No audit trail for verification actions (who verified what, when) | Medium |

### Verdict
There is **no verification layer**. Deadlines transition: `created → active → due_soon → overdue / completed`. There is no intermediate state where uploaded or scanned data gets human review before being trusted by the system.

---

## C. Privacy & Security

### What Exists
- **Company-level isolation**: All queries filter by `companyId` — users only see their own company's data
- **Role-based access**: `admin` vs `member` — admins manage team and can delete any deadline; members can only delete their own
- **JWT auth**: httpOnly cookie, 7-day expiry, `secure` flag in production, `sameSite: "lax"`
- **Activity logging**: `ActivityLog` model tracks deadline actions — `document_uploaded`, `updated`, `completed`, `renewed`
- **Password hashing**: bcryptjs

### What's Missing

| Gap | Severity |
|-----|----------|
| No document encryption at rest — files stored as plain files in `/uploads` | High |
| No data-access audit log — `ActivityLog` only tracks actions, not reads ("user X viewed document Y") | High |
| Default JWT secret hardcoded as fallback (`"savr-track-secret-key-change-in-production"`) | High |
| No global auth middleware — each route manually calls `getAuthUser()`, risk of omission | Medium |
| No privacy policy / terms of service UI | Medium |
| No data export or deletion capability (GDPR-style compliance) | Medium |
| No rate limiting on API routes | Medium |
| No CSRF protection beyond SameSite cookie | Low |
| No file virus scanning on upload | Low |

### Verdict
The basics are in place (auth, company isolation, role checks), but there are significant gaps for a compliance-focused app that handles sensitive contractor documents. **Document encryption and access auditing** are the most critical missing pieces.

---

## D. Notification System

### What Exists
- **Reminder model**: Stores `type` (always `"email"`), `daysBefore` (30, 14, 7, 3, 1, 0), `sentAt` (always `null`)
- **Auto-creation**: Reminders created automatically when deadlines are added — manually or via onboarding
- **Cron endpoint**: `POST /api/reminders/check` — but it only recomputes deadline statuses; it does **not** send notifications
- **UI display**: Deadline detail page shows reminder list with sent / pending status

### What's Missing

| Gap | Severity |
|-----|----------|
| No email sending integration — no nodemailer, sendgrid, resend, or equivalent | Critical |
| `sentAt` is never populated — reminders are created but never actually sent | Critical |
| Cron endpoint only updates statuses; does not check or dispatch reminders | High |
| No SMS channel | High |
| No in-app notification system (bell icon, notification centre) | High |
| No user notification preferences (channel, interval, opt-out) | High |
| No escalation logic (e.g. notify manager if owner ignores overdue item) | Medium |
| No notification templates or per-company customisation | Medium |

### Verdict
The notification system is **scaffolded but non-functional**. The data model exists, reminders get created, the UI displays them — but **nothing actually sends**. This is the widest gap between what the UI implies and what really works.

---

## E. Overall Product Direction — "Compliance Autopilot"

### What Works Toward the Vision
- Business type selection → auto-suggested compliance items during onboarding
- Guided 3-step onboarding wizard with success screen
- Smart suggestions on the new-deadline form (pre-fills title, category, recurring settings, expiration)
- Filename intelligence on document upload (auto-suggests category and date)
- Compliance coverage dashboard (shows missing items per business type with coverage score)
- One-click "Upload & Apply" flow on deadline detail page

### What Undermines the Vision

| Issue | Impact |
|-------|--------|
| After onboarding, adding deadlines is still a manual form — users fall into "tracker" mode | High |
| Document upload only reads filenames, not content — "smart" feels shallow after first use | High |
| No verification workflow — no trust layer between auto-extracted data and the system acting on it | High |
| Notifications don't actually fire — the "autopilot" never reminds anyone | Critical |
| No proactive system actions (e.g. surface renewal prompts for soon-to-expire items without user hunting for them) | Medium |
| No bulk operations — uploading 5 documents and matching to 5 deadlines requires 5 separate flows | Medium |

---

## Priority Recommendation

Ordered by impact on the "compliance autopilot" vision:

| Priority | Area | Why First |
|----------|------|-----------|
| 1 | **Notification System** | Without actual notifications the app has no proactive value — wire up email + cron |
| 2 | **Verification Layer** | Add document/deadline states: `uploaded → needs_review → verified`. Creates the trust foundation |
| 3 | **Document Content Scanning** | Even basic PDF text extraction (no OCR needed for digital PDFs) dramatically improves the "smart" feeling |
| 4 | **Privacy & Security hardening** | Document encryption, access logging, middleware consolidation |
| 5 | **In-app Notifications + Preferences** | Bell icon, notification centre, user-configurable channels and intervals |
