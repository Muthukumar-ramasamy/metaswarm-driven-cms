# Test Spec: Notes

| Field | Value |
|-------|-------|
| Status | Complete |
| Generated | 2026-06-14 |

---

## 1. AC Coverage

| AC ID | Description | Test IDs |
|-------|-------------|----------|
| AC-01 | Create note linked to a record | notes-unit-06, notes-unit-07, notes-int-01, notes-e2e-01, notes-e2e-02 |
| AC-02 | Note must link to at least one record | notes-unit-05, notes-int-01, notes-e2e-03 |
| AC-03 | Author can edit own note | notes-unit-11, notes-int-10, notes-e2e-04 |
| AC-04 | Non-author cannot edit note | notes-unit-12, notes-unit-14, notes-int-12, notes-e2e-05 |
| AC-05 | Author can delete own note | notes-unit-17, notes-int-13, notes-int-14, notes-e2e-06 |
| AC-06 | Non-author non-admin cannot delete | notes-unit-18, notes-unit-20, notes-int-16, notes-e2e-07 |
| AC-07 | Admin can delete any note | notes-unit-19, notes-int-13, notes-e2e-08 |
| AC-08 | Pin note appears at top of list | notes-unit-16, notes-int-03, notes-int-11, notes-e2e-09, notes-e2e-10 |

---

## 2. BR Coverage

| BR ID | Description | Test IDs |
|-------|-------------|----------|
| BR-01 | Notes are soft-deleted; deleted_at set; record retained | notes-unit-17, notes-unit-19, notes-int-13, notes-int-14, notes-int-15 |
| BR-02 | Only author or Admin can edit or delete | notes-unit-11, notes-unit-12, notes-unit-13, notes-unit-14, notes-unit-17, notes-unit-18, notes-unit-19, notes-unit-20, notes-int-12, notes-int-16, notes-e2e-05, notes-e2e-07 |
| BR-03 | Note must be linked to at least one record (CHECK constraint + service guard) | notes-unit-05, notes-int-01, notes-e2e-03 |
| BR-04 | Pinned notes appear first (is_pinned DESC, created_at DESC) | notes-unit-16, notes-int-03, notes-int-11, notes-e2e-09, notes-e2e-10 |
| BR-05 | GET /api/notes without a filter param returns 400 | notes-unit-02 |

---

## 3. Permission Coverage

| Role | Action | Allowed Test ID | Denied Test ID |
|------|--------|-----------------|----------------|
| Admin | Create note | notes-e2e-02 | — |
| Admin | Edit any note | notes-unit-13 | — |
| Admin | Delete any note | notes-unit-19, notes-e2e-08 | — |
| Sales Rep (author) | Edit own note | notes-unit-11, notes-e2e-04 | — |
| Sales Rep (non-author) | Edit another's note | — | notes-unit-12, notes-e2e-05 |
| Manager | Edit another's note | — | notes-unit-14 |
| Sales Rep (author) | Delete own note | notes-unit-17, notes-e2e-06 | — |
| Sales Rep (non-author) | Delete another's note | — | notes-unit-18, notes-e2e-07 |
| Manager | Delete another's note | — | notes-unit-20 |
| All roles | View notes on a record | notes-e2e-11, notes-e2e-12 | — |
| All roles | Create note | notes-e2e-01, notes-e2e-02 | — |

---

## 4. Unit Tests

**File**: `backend/src/modules/notes/__tests__/notes.service.test.ts`

| Test ID | Description | BR / AC |
|---------|-------------|---------|
| notes-unit-01 | listNotes returns paginated results with a valid filter | AC-01 |
| notes-unit-02 | listNotes throws ValidationError when no filter param provided | BR-05 |
| notes-unit-03 | listNotes passes contactId filter to repository | AC-01 |
| notes-unit-04 | BR-01 — author_id taken from JWT sub, not from request body | BR-01 |
| notes-unit-05 | BR-02 — throws ValidationError when no linked record | BR-03, AC-02 |
| notes-unit-06 | createNote linked to a deal succeeds | AC-01 |
| notes-unit-07 | createNote linked to a contact succeeds | AC-01 |
| notes-unit-08 | isPinned defaults to false when not supplied | AC-01 |
| notes-unit-09 | getNoteById returns the note when found | AC-01 |
| notes-unit-10 | getNoteById throws NotFoundError when note does not exist | error case |
| notes-unit-11 | author can edit own note (success path) | AC-03, BR-02 |
| notes-unit-12 | non-author non-admin gets ForbiddenError on update | AC-04, BR-02 |
| notes-unit-13 | admin can edit any note regardless of authorship | AC-04, BR-02 |
| notes-unit-14 | manager cannot edit another user's note | AC-04, BR-02 |
| notes-unit-15 | updateNote throws NotFoundError when note not found | error case |
| notes-unit-16 | can pin a note (isPinned toggled to true) | AC-08, BR-04 |
| notes-unit-17 | author can soft-delete own note; softDelete called | AC-05, BR-01 |
| notes-unit-18 | non-author non-admin gets ForbiddenError on delete | AC-06, BR-02 |
| notes-unit-19 | admin can soft-delete any note | AC-07, BR-01 |
| notes-unit-20 | manager cannot delete another user's note | AC-06, BR-02 |
| notes-unit-21 | deleteNote throws NotFoundError when note does not exist | error case |

---

## 5. Integration Tests

**File**: `backend/src/modules/notes/__tests__/notes.repository.test.ts`

| Test ID | Description | BR / AC |
|---------|-------------|---------|
| notes-int-01 | create inserts note linked to contact and returns record | AC-01 |
| notes-int-02 | authorId on returned record matches the supplied caller id | BR-01 |
| notes-int-03 | BR-04 — pinned notes sort before unpinned in findMany | AC-08, BR-04 |
| notes-int-04 | multi-tenancy — org B cannot see org A notes | multi-tenancy |
| notes-int-05 | soft-deleted notes excluded from findMany results | BR-01 |
| notes-int-06 | findById returns note with authorName when found | AC-01 |
| notes-int-07 | findById returns undefined for note in different org | multi-tenancy |
| notes-int-08 | findById returns undefined for soft-deleted note | BR-01 |
| notes-int-09 | findById returns undefined for nonexistent ID | error case |
| notes-int-10 | update reflects content change in subsequent findById | AC-03 |
| notes-int-11 | update pins a note (is_pinned set to true) | AC-08, BR-04 |
| notes-int-12 | update returns undefined for note from different org | multi-tenancy, AC-04 |
| notes-int-13 | softDelete sets deleted_at; record retained in DB | BR-01, AC-05, AC-07 |
| notes-int-14 | soft-deleted note invisible to findById | BR-01, AC-05 |
| notes-int-15 | soft-deleted note invisible in findMany list | BR-01, AC-05 |
| notes-int-16 | softDelete is no-op for note from wrong org | multi-tenancy, AC-06 |

---

## 6. E2E Tests

**File**: `e2e/notes.spec.ts`

| Test ID | Description | AC |
|---------|-------------|-----|
| notes-e2e-01 | Sales rep creates a note on a deal; note appears in Notes tab | AC-01 |
| notes-e2e-02 | Admin creates a note on a contact; note appears in Notes tab | AC-01 |
| notes-e2e-03 | Empty content shows inline validation error | AC-02 |
| notes-e2e-04 | Author (Rep A) can edit their own note inline | AC-03 |
| notes-e2e-05 | Rep B does not see edit/delete controls on Rep A note | AC-04 |
| notes-e2e-06 | Author (Rep A) can soft-delete their own note | AC-05 |
| notes-e2e-07 | Rep B cannot delete Rep A note (no delete button shown) | AC-06 |
| notes-e2e-08 | Admin sees delete button on others' notes and can remove them | AC-07 |
| notes-e2e-09 | Pinned note appears at top of Notes tab above unpinned | AC-08 |
| notes-e2e-10 | Unpin a note; it drops back to chronological position | AC-08 |
| notes-e2e-11 | Notes tab is visible on deal detail page | AC-01 (NotesFeed embed) |
| notes-e2e-12 | Notes tab is visible on contact detail page | AC-01 (NotesFeed embed) |
| notes-e2e-13 | Notes feed shows empty state when no notes exist | AC-01 |
| notes-e2e-14 | API error during note creation shows error toast | error state |
| notes-e2e-15 | 404 on note fetch handled gracefully in feed | error state |
| notes-e2e-16 | 403 response when non-author tries to edit note via API | AC-04 |

---

## 7. Coverage Summary

| Category | Covered | Total |
|----------|---------|-------|
| Acceptance Criteria | 8 | 8 |
| Business Rules | 5 | 5 |
| Permission matrix rows (allowed + denied) | 11 | 11 |
| Multi-tenancy isolation | 4 tests across unit + int + e2e | ✅ |
| Soft-delete verification | notes-int-13 (deleted_at check), int-14, int-15, unit-17 | ✅ |

---

## 8. To Run

```bash
# Unit tests
npm run test:unit -- notes

# Integration tests (requires DATABASE_URL pointing to a test Neon branch)
npm run test:integration -- notes

# E2E tests (requires running dev server)
npm run test:e2e -- notes
```
