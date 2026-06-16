# Feature Spec: Notes

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Notes |
| Module | Module 7 |
| Priority | P1 |
| Status | Approved |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-13 |

---

## 2. Business Goal

Provide a place for free-text context that does not fit a structured field. Notes are attached to deals, contacts, companies, or leads and give reps a place to capture meeting summaries, key insights, objections, or reminders. Without notes, valuable context lives only in reps' heads and is lost when they move on.

---

## 3. User Roles Affected

- [x] Admin
- [x] Manager
- [x] Sales Rep

---

## 4. User Stories

### 4.1 Add a note to a record
**As a** Sales Rep,
**I want to** add a note to a deal, contact, company, or lead,
**So that** I can capture context from a conversation or meeting.

### 4.2 Edit a note I wrote
**As a** Sales Rep,
**I want to** edit a note I wrote,
**So that** I can correct mistakes or add detail after the fact.

### 4.3 Delete a note I wrote
**As a** Sales Rep,
**I want to** delete a note I wrote,
**So that** outdated or incorrect information is removed.

### 4.4 Admin deletes any note
**As an** Admin,
**I want to** delete any note in the organisation,
**So that** I can clean up inappropriate or sensitive content.

### 4.5 Pin a note
**As a** Sales Rep,
**I want to** pin an important note to the top of a record,
**So that** critical information is always visible without scrolling.

---

## 5. Acceptance Criteria

### AC-01: Create note linked to a record
**Given** a user submits a note with content and a linked record (deal, contact, company, or lead),
**When** the form is submitted,
**Then** the note is saved with author_id = the submitting user and is visible in the Notes tab of that record.

### AC-02: Note must link to at least one record
**Given** a user submits a note without specifying a linked record,
**When** the form is submitted,
**Then** the system returns 400 with message "A note must be linked to at least one record."

### AC-03: Author can edit own note
**Given** User A created a note,
**When** User A edits the note and submits,
**Then** the note content is updated.

### AC-04: Non-author cannot edit note
**Given** a note was created by User A,
**When** User B (who is not Admin) attempts to edit it,
**Then** the system returns 403 with message "You can only edit notes you created."

### AC-05: Author can delete own note
**Given** User A created a note,
**When** User A deletes it,
**Then** the note is soft-deleted and no longer appears in the Notes tab.

### AC-06: Non-author, non-admin cannot delete note
**Given** a note was created by User A,
**When** User B (not Admin) attempts to delete it,
**Then** the system returns 403 with message "You can only delete notes you created."

### AC-07: Admin can delete any note
**Given** an Admin attempts to delete a note written by any user,
**When** confirmed,
**Then** the note is soft-deleted and no longer appears.

### AC-08: Pin note
**Given** a Sales Rep pins a note,
**When** the Notes tab is viewed,
**Then** the pinned note appears at the top of the list, above all unpinned notes.

---

## 6. Out of Scope (MVP)

- File attachments on notes
- Note mentions (@user notifications)
- Rich text editor (bold, bullets, links) — plain text only in MVP
- Note search across all records
- Note templates

---

## 7. Data Requirements

### Entities involved
- **Note**: primary entity; created, edited, pinned, soft-deleted
- **Deal**: optional FK
- **Contact**: optional FK
- **Company**: optional FK
- **Lead**: optional FK

### New fields (if any)

All fields from existing entity spec at `specs/database/entities/note.md`.

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Note | content | TEXT | Yes | Plain text; no HTML |
| Note | author_id | UUID | Yes | FK → users.id; set on creation |
| Note | is_pinned | BOOLEAN | Yes | Default false |
| Note | deal_id | UUID | No | FK → deals.id, SET NULL |
| Note | contact_id | UUID | No | FK → contacts.id, SET NULL |
| Note | company_id | UUID | No | FK → companies.id, SET NULL |
| Note | lead_id | UUID | No | FK → leads.id, SET NULL |

DB-level CHECK: at least one of deal_id, contact_id, company_id, lead_id must be NOT NULL.

---

## 8. API Requirements

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/notes | List notes (filter by deal_id / contact_id / company_id / lead_id) | Yes |
| POST | /api/notes | Create note | Yes |
| GET | /api/notes/:id | Get note by ID | Yes |
| PUT | /api/notes/:id | Update note content or pin status | Yes — author or Admin |
| DELETE | /api/notes/:id | Soft-delete note | Yes — author or Admin |

---

## 9. UI Requirements

| Page / Component | Description |
|-----------------|-------------|
| Notes tab (inline) | Appears on deal detail, contact detail, company detail, lead detail pages |
| Create note form | Textarea for content; appears inline at top of Notes tab |
| Edit note inline | Inline edit on click; save / cancel buttons |
| Pin button | Appears on each note card; toggles is_pinned |
| Delete confirmation | Small inline confirmation before soft-deleting |

Notes do not have a standalone page — they are always embedded in the Notes tab of a parent record.

---

## 10. Business Rules

- **BR-01**: Notes are soft-deleted — never hard-deleted. deleted_at is set; the record is retained.
- **BR-02**: Only the note's author or an Admin can edit or delete a note.
- **BR-03**: A note must be linked to at least one record. The DB enforces this with a CHECK constraint.
- **BR-04**: Pinned notes always appear before unpinned notes in the list (ordered by is_pinned DESC, created_at DESC).
- **BR-05**: Note content is stored as plain text. No HTML is accepted or rendered.

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| Create note with no linked record | 400 "A note must be linked to at least one record." |
| Create note with empty content | 400 "Note content is required." |
| Non-author edits note | 403 "You can only edit notes you created." |
| Non-author, non-admin deletes note | 403 "You can only delete notes you created." |
| Note ID not found in org | 404 "Note not found." |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View notes on a record | ✅ | ✅ | ✅ |
| Create note | ✅ | ✅ | ✅ |
| Edit own note | ✅ | ✅ | ✅ |
| Edit any note | ✅ | ❌ | ❌ |
| Pin own note | ✅ | ✅ | ✅ |
| Delete own note | ✅ | ✅ | ✅ |
| Delete any note | ✅ | ❌ | ❌ |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec | Notes are inline on detail pages — see `specs/ui/deal-detail.md`, `specs/ui/contact-detail.md` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1notes` |
| DB entity spec | `specs/database/entities/note.md` |
| DB spec | `specs/features/notes/db-spec.md` |
| Test spec | `specs/features/notes/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | Can a Manager edit other users' notes, or is edit strictly author + Admin? | Product | — | Resolved: strictly author + Admin only (Manager cannot edit others' notes) |
