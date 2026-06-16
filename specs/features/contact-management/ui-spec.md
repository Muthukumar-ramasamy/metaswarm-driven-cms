# UI Spec: Contact Management

Full page-level UI specs:
- `specs/ui/contacts-list.md` — contacts list page
- `specs/ui/contact-detail.md` — contact detail page

---

## Pages

| Page | Route | Access |
|------|-------|--------|
| Contacts list | `/contacts` | All roles |
| Contact detail | `/contacts/:id` | All roles |

---

## Key UI Behaviours

### Contacts list
- Table with search bar (name/email), owner filter (Manager/Admin only)
- Sales Reps see only their own contacts (ownerId filter applied automatically)
- "+ New contact" opens a right-side drawer (not a modal)
- Row click navigates to `/contacts/:id`
- Delete action in kebab menu (Admin only, hidden for other roles)

### Contact detail
- Two-panel layout: left panel (contact info + edit inline), right panel (open deals summary)
- Tabs below: Activities tab, Notes tab
- Activities and Notes are loaded lazily when tab is selected
- Edit fields inline; save button appears on change

---

## Components

| Component | File |
|-----------|------|
| ContactsPage | `frontend/src/features/contacts/pages/ContactsPage.tsx` |
| ContactDetailPage | `frontend/src/features/contacts/pages/ContactDetailPage.tsx` |
| ContactTable | `frontend/src/features/contacts/components/ContactTable.tsx` |
| ContactForm | `frontend/src/features/contacts/components/ContactForm.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| List page UI | `specs/ui/contacts-list.md` |
| Detail page UI | `specs/ui/contact-detail.md` |
| Feature spec | `specs/features/contact-management/feature-spec.md` |
