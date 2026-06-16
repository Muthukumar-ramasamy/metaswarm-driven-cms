# UI Spec: Notes

Notes do not have a standalone page. They are embedded as a "Notes" tab within:
- Deal detail (`/deals/:id`) — see `specs/ui/deal-detail.md`
- Contact detail (`/contacts/:id`) — see `specs/ui/contact-detail.md`
- Company detail (`/companies/:id`) — see `specs/ui/company-detail.md`
- Lead detail drawer — see `specs/ui/leads-inbox.md`

---

## Notes Tab Behaviour

- Create note: textarea at top of the Notes tab; "Add note" button
- Pinned notes appear first (is_pinned=true, sorted by created_at DESC)
- Unpinned notes below, sorted by created_at DESC
- Each note card shows: content, author name, relative timestamp ("2 hours ago")
- Hover on own note: pin/unpin toggle, edit pencil, delete trash
- Edit: inline textarea replaces the note card; save/cancel
- Delete: small inline confirmation ("Delete this note?")
- Admin sees edit/delete on all notes; others see only on their own

---

## Components

| Component | File |
|-----------|------|
| NotesTab | `frontend/src/features/notes/components/NotesTab.tsx` |
| NoteCard | `frontend/src/features/notes/components/NoteCard.tsx` |
| NoteForm | `frontend/src/features/notes/components/NoteForm.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| Deal detail UI | `specs/ui/deal-detail.md` |
| Contact detail UI | `specs/ui/contact-detail.md` |
| Feature spec | `specs/features/notes/feature-spec.md` |
