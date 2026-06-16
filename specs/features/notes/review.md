# Feature Review: Notes

**Reviewed**: 2026-06-14
**Result**: ⚠️ Needs changes

---

## Spec compliance

### Backend

**Routes (`backend/src/modules/notes/routes.ts`)**

- [x] All 5 endpoints from api-spec.md are present: GET /notes, POST /notes, GET /notes/:id, PUT /notes/:id, DELETE /notes/:id
- [x] HTTP methods match exactly
- [x] Route paths match exactly
- [x] `authenticate` preHandler on every route
- [x] No extra routes not in the spec

**Controller (`backend/src/modules/notes/controller.ts`)**

- [x] Zero business logic — parse / call / respond only
- [x] `createNote` returns 201 (matches api-spec.md)
- [x] `deleteNote` returns 200 `{ data: { id } }` (matches api-spec.md)
- [x] All responses use the `{ data }` envelope

**Service (`backend/src/modules/notes/service.ts`)**

- [x] BR-01: `author_id` always set from `caller.sub` (JWT), never from request body — line 55
- [x] BR-02/AC-04: non-author, non-admin edit blocked with `ForbiddenError("You can only edit notes you created.")` — lines 95-97
- [x] BR-02/AC-06: non-author, non-admin delete blocked with `ForbiddenError("You can only delete notes you created.")` — lines 124-126
- [x] BR-03/AC-02: `ValidationError("A note must be linked to at least one record.")` on create — lines 49-51
- [x] BR-05: `ValidationError` when no filter param on list — lines 17-21
- [x] AC-07: admin role bypasses authorship check for edit and delete
- [x] NotFoundError thrown for missing note on getNoteById, updateNote, deleteNote
- [x] All typed error classes used — no `throw new Error(...)` in service.ts

**Repository (`backend/src/modules/notes/repository.ts`)**

- [x] `findMany`: scoped by `organizationId`, `isNull(notes.deletedAt)` on every query
- [x] `findById`: scoped by `organizationId`, `isNull(notes.deletedAt)`
- [x] `update`: scoped by `organizationId`, `isNull(notes.deletedAt)`
- [x] `softDelete`: uses `UPDATE SET deleted_at = new Date()` — no `DELETE FROM`
- [x] BR-04: default sort is `is_pinned DESC, created_at DESC` (pinned first)
- [x] Drizzle ORM only — no raw SQL strings (the `sql` tagged template is used only for the computed `authorName` column label, not for dynamic user input)
- [x] `organizationId` passed explicitly to all repo calls from service; never from body

**Drizzle schema (`backend/src/db/schema/notes.ts`)**

All db-spec.md fields present and correctly typed:

| db-spec.md field | Schema presence | Type match |
|-----------------|-----------------|------------|
| id | uuid PK | ✅ |
| organization_id | uuid NOT NULL FK → organizations CASCADE | ✅ |
| author_id | uuid NOT NULL FK → users RESTRICT | ✅ |
| content | text NOT NULL | ✅ |
| is_pinned | boolean NOT NULL default false | ✅ |
| deal_id | uuid nullable FK → deals SET NULL | ✅ |
| contact_id | uuid nullable FK → contacts SET NULL | ✅ |
| company_id | uuid nullable FK → companies SET NULL | ✅ |
| lead_id | uuid nullable FK → leads SET NULL | ✅ |
| created_at | TIMESTAMPTZ NOT NULL | ✅ |
| updated_at | TIMESTAMPTZ NOT NULL | ✅ |
| deleted_at | TIMESTAMPTZ nullable | ✅ |

Indexes from db-spec.md: all 8 indexes are declared (org, author, deal, contact, company, lead, deleted_at, is_pinned). The migration also adds the composite `notes_org_pin_created_idx` partial index (WHERE deleted_at IS NULL), which is good practice but is an addition beyond the spec — not a violation.

- [x] CHECK constraint (`notes_linked_record_check`) is in the migration SQL (line 20-27) and commented in the schema with rationale

**Migration SQL (`backend/drizzle/20260614000007_create_notes.sql`)**

- [x] CHECK constraint present: `deal_id IS NOT NULL OR contact_id IS NOT NULL OR company_id IS NOT NULL OR lead_id IS NOT NULL`
- [x] All FK ON DELETE actions match db-spec.md (CASCADE for org, RESTRICT for author, SET NULL for deal/contact/company/lead)
- [x] All indexes created

**Backend result**: ✅ All checks passed

---

### Frontend

**`frontend/src/features/notes/api.ts`**

- [x] All API calls go through `api` from `../../lib/api` — no hardcoded URLs, no direct `fetch()`
- [x] All 5 CRUD operations present (listNotes, getNote, createNote, updateNote, deleteNote)

**Issue FE-01 (minor): `deleteNote` comment says "returns 204 No Content" but api-spec.md specifies 200 `{ data: { id } }`**
File: `frontend/src/features/notes/api.ts`, line 25 (comment only — the implementation discards the body with `() => undefined`, which is functionally acceptable but the comment is misleading).

**`frontend/src/features/notes/types.ts`**

- [x] `Note` interface matches the backend response shape
- [x] `PaginatedNotes` envelope matches `{ data, pagination }`

**Issue FE-02 (minor): `search` field missing from `ListNotesFilters`**
File: `frontend/src/features/notes/types.ts` — `ListNotesFilters` does not include a `search?: string` field, even though the api-spec.md documents `&search=string` as a supported query parameter. The backend schema accepts and handles it. The frontend cannot currently send a search filter.

**`frontend/src/features/notes/schemas.ts`**

- [x] `createNoteSchema` mirrors api-spec.md request shape (content, isPinned, dealId, contactId, companyId, leadId)
- [x] `updateNoteSchema` mirrors api-spec.md (content, isPinned only — linked record IDs immutable)
- [x] No hardcoded role strings

**`frontend/src/features/notes/hooks/useNotes.ts` and `useNoteMutations.ts`**

- [x] All role checks via `useAuth()` (in NoteCard) — no hardcoded role strings in hooks
- [x] `useNotes` disabled until at least one record filter is populated (guard against unfiltered query)

**`frontend/src/features/notes/components/NoteCard.tsx`**

- [x] `canEditOrDelete` guard hides (not disables) edit/delete/pin controls for non-authors (line 61)
- [x] `useAuth()` used for permission decision — no hardcoded role string
- [x] Loading states: spinner shown during save and delete
- [x] Inline error displayed for edit and pin/delete API errors
- [x] Inline delete confirmation ("Delete this note?" text) present

**`frontend/src/features/notes/components/NotesFeed.tsx`**

- [x] Loading state: `CircularProgress` shown while `isLoading`
- [x] Error state: `Alert` with Retry link shown on `isError`
- [x] Empty state: icon + message shown when `notes.length === 0`
- [x] `NoteForm` at top of feed (create note inline)

**`frontend/src/features/notes/components/NoteForm.tsx`**

- [x] Linked record pre-populated from `recordType`/`recordId` props (AC-02 satisfied)
- [x] Inline validation error shown for empty content

**Issue FE-03 (blocking): Missing `data-testid` attributes required by E2E tests**

The E2E test file (`e2e/notes.spec.ts`) relies on the following `data-testid` selectors that do not exist in any frontend component:

| Selector used in E2E | Expected location | Status |
|----------------------|-------------------|--------|
| `data-testid="notes-feed"` | `NotesFeed.tsx` root `<Box>` | MISSING |
| `data-testid="note-card"` | `NoteCard.tsx` root `<Card>` | MISSING |
| `data-testid="note-author-badge"` with `data-own` attribute | `NoteCard.tsx` author element | MISSING |
| `data-testid="pin-indicator"` | `NoteCard.tsx` pin badge | MISSING |

Without these attributes, the E2E tests for AC-04 (notes-e2e-05), AC-06 (notes-e2e-07), AC-08 (notes-e2e-09/10) will either fail or pass vacuously (the `count === 0` short-circuit path in the test). This is a functional gap — the permission tests can never reach their assertion path.

Additionally, the E2E test `notes-e2e-01` clicks `getByRole('button', { name: /add note/i })` then fills `getByLabel(/note content/i)`, but `NoteForm` renders a `TextField` with `label="Add a note"` and no separate trigger button — the form is always visible. The `getByRole('button', { name: /^save/i })` selector matches the "Add note" submit button text (`'Add note'`, not `'save'`) so notes-e2e-01 through notes-e2e-10 will fail on the save-button selector.

**Frontend result**: ⚠️ 3 issues found (1 blocking, 2 minor)

---

## Security invariants

**MULTI-TENANCY**

- [x] `findMany` — `eq(notes.organizationId, organizationId)` in `buildWhere` helper, applied to all queries including count
- [x] `findById` — `eq(notes.organizationId, organizationId)` in WHERE clause (line 114-116)
- [x] `update` — `eq(notes.organizationId, organizationId)` in WHERE clause (line 142-143)
- [x] `softDelete` — `eq(notes.organizationId, organizationId)` in WHERE clause (line 163-164)
- [x] `organizationId` always sourced from `caller.organizationId` (JWT), never from `req.body` or `req.params`
- [x] No query can return records from a different org

**SOFT DELETE**

- [x] Zero `DELETE FROM` statements in repository.ts (confirmed by grep — only comment on line 156)
- [x] `findMany` — `isNull(notes.deletedAt)` in `buildWhere`
- [x] `findById` — `isNull(notes.deletedAt)` in WHERE
- [x] `update` — `isNull(notes.deletedAt)` in WHERE
- [x] `softDelete` — sets `deletedAt: new Date()` via `UPDATE` (line 160)

**AUTH**

- [x] `authenticate` preHandler on all 5 routes — no route is reachable without a valid JWT

**ROLE CHECKS**

- [x] Role checks enforced in `service.ts`, not in routes or controller
- [x] Admin bypass on edit and delete uses `caller.role !== 'admin'` check
- [x] Manager role treated identically to non-admin for edit/delete of others' notes (correctly blocked)

**DATA EXPOSURE**

- [x] No `password_hash`, `invite_token`, or `reset_token` fields in Note entity or response shape
- [x] No sensitive fields in `service.ts` logger calls (no logger calls at all)

**INPUT SAFETY**

- [x] Only Drizzle ORM in repository.ts — no string interpolation into queries
- [x] The `ilike` call on line 38 uses a parameterised Drizzle expression, not a raw string

**Security result**: ✅ All invariants passed — no blocking violations

---

## Test coverage

**Unit tests (`notes.service.test.ts`)**

All 21 test IDs from test-spec.md are present and implemented (notes-unit-01 through notes-unit-21). Spot-checked:

- notes-unit-05: ValidationError when no linked record — correct
- notes-unit-12: ForbiddenError for non-author (sales_rep) edit — correct
- notes-unit-14: ForbiddenError for manager editing another's note — correct
- notes-unit-17: softDelete called, not hardDelete — correct assertion at line 376

**Integration tests (`notes.repository.test.ts`)**

All 16 test IDs from test-spec.md are present (notes-int-01 through notes-int-16). Multi-tenancy isolation tests at notes-int-04, notes-int-07, notes-int-12, notes-int-16 cover both list and findById endpoints.

**E2E tests (`e2e/notes.spec.ts`)**

All 16 E2E test IDs from test-spec.md are present (notes-e2e-01 through notes-e2e-16).

**Coverage gaps (per test-spec.md tracking):**

All ACs, BRs, and permission rows have test IDs assigned. However, due to FE-03 (missing `data-testid` attributes), the following tests will not reach their intended assertion paths at runtime:

- notes-e2e-05 (AC-04): loops over `note-card` elements — will find 0 and pass vacuously
- notes-e2e-07 (AC-06): same issue
- notes-e2e-09 (AC-08): pin indicator check via `data-testid="pin-indicator"` will fail
- notes-e2e-10 (AC-08): unpin button selector `getByRole('button', { name: /unpin/i })` depends on component rendering that text — currently the Tooltip label says "Unpin" but the `IconButton` has `aria-label="Unpin note"`, not "Unpin" — may work but not guaranteed

Additionally, the `getByRole('button', { name: /^save/i })` selector used in notes-e2e-04 will not match the "Add note" submit button in `NoteForm`. Tests e2e-01 through e2e-08 will fail on the submit step.

**Test coverage result**: ⚠️ Test IDs are fully mapped in spec, but E2E tests will fail at runtime due to missing `data-testid` attributes and mismatched button selectors in the components

---

## Code quality

**TypeScript**

- [x] No `any` types in `service.ts`, `repository.ts`, or `controller.ts` (confirmed by grep — zero matches)
- [x] No `any` types in frontend `hooks/`, `api.ts`, or `types.ts`
- [x] `NoteRow` explicitly typed as `Note & { authorName: string }` in repository.ts
- [x] All function parameters and return types explicitly typed

**Layer separation**

- [x] `controller.ts`: zero business logic
- [x] `service.ts`: zero DB queries — all via `repo.*`
- [x] `repository.ts`: zero business logic — Drizzle queries only
- [x] `routes.ts`: zero logic — registration only

**Frontend patterns**

- [x] All API calls via `src/lib/api` — no hardcoded URLs
- [x] No direct `fetch()` calls
- [x] Role checks via `useAuth()` in `NoteCard.tsx`
- [x] Zod schemas in `schemas.ts` match api-spec.md request bodies

**Error handling**

- [x] `ForbiddenError`, `NotFoundError`, `ValidationError` used throughout `service.ts`
- [x] No untyped `throw new Error(...)` in `service.ts`

**Issue QA-01 (minor): `deleteNote` comment in `api.ts` says "204 No Content"**
File: `frontend/src/features/notes/api.ts`, line 25. Comment is incorrect — the API returns 200 with `{ data: { id } }`. The implementation discards the body (`.then(() => undefined)`) which works but masks the response. This is a documentation-only issue, not a runtime bug, as the frontend does not consume the delete response body.

**Naming**

- [x] Module folder: `notes` (matches feature slug)
- [x] File names follow convention
- [x] Components PascalCase; hooks start with `use`

**Code quality result**: ✅ All checks passed (QA-01 is a comment inaccuracy, not a code defect)

---

## Required changes before merge

1. **[FE-03 — BLOCKING]** Add `data-testid` attributes to frontend components so E2E tests can locate elements:
   - `frontend/src/features/notes/components/NotesFeed.tsx`: add `data-testid="notes-feed"` to the root `<Box>`
   - `frontend/src/features/notes/components/NoteCard.tsx`: add `data-testid="note-card"` to the root `<Card>`; add `data-testid="note-author-badge"` and `data-own={String(canEditOrDelete && note.authorId === user?.sub)}` to the author `<Typography>` element; add `data-testid="pin-indicator"` to the "Pinned" badge `<Typography>`
   - Spec reference: `specs/features/notes/test-spec.md` — notes-e2e-05, notes-e2e-07, notes-e2e-09; E2E test file `e2e/notes.spec.ts` lines 157-163, 206-212, 282-286

2. **[FE-03 — BLOCKING continued]** Fix E2E button selector mismatch: the `NoteForm` submit button renders "Add note", but E2E tests (notes-e2e-01 through notes-e2e-08) expect `getByRole('button', { name: /^save/i })`. Either:
   - Change the submit button label in `NoteForm.tsx` to "Save" when the form is in edit mode vs. "Add note" for creation, OR
   - Update the E2E selectors in `e2e/notes.spec.ts` to use `/add note/i` instead of `/^save/i` for the creation flow
   - Spec reference: `specs/features/notes/test-spec.md` notes-e2e-01 through notes-e2e-08

3. **[FE-02 — minor]** Add `search?: string` to `ListNotesFilters` in `frontend/src/features/notes/types.ts` to match the api-spec.md query parameter contract (api-spec.md line: `&search=string`). Without this the frontend cannot use the backend's full-text search capability.

4. **[FE-01 — minor]** Correct the comment on line 25 of `frontend/src/features/notes/api.ts` from "returns 204 No Content" to "returns 200 `{ data: { id } }`" to match api-spec.md.

Fix items 1 and 2, then re-run `/review-feature Notes`.
