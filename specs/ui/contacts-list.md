# UI Spec: Contacts List

| Field | Value |
|-------|-------|
| Page name | Contacts |
| Route | `/contacts` |
| Feature | Contact Management |
| Layout | AppLayout (sidebar + main) |

**Purpose**: Show a searchable, filterable list of contacts the user can act on, and provide a quick path to create a new one.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Contacts                              [+ New contact]       │
│  142 contacts                                                │
├──────────────────────────────────────────────────────────────┤
│  [Search contacts...]  [Owner ▼]  [Company ▼]               │
├──────────────────────────────────────────────────────────────┤
│  Name ↕    Email ↕        Phone      Company       Owner  ↕  │
│  ──────────────────────────────────────────────────────────  │
│  Alice Bo… alice@acme.com  555-0101  Acme Corp    Sam Lee   │
│  Bob Chen  bob@beta.com    —         Beta Inc     Sam Lee   │
│  …                                                           │
├──────────────────────────────────────────────────────────────┤
│  ← 1  2  3 … 8 →                      Showing 1–20 of 142   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Page Header

| Element | Detail |
|---------|--------|
| Title | "Contacts" |
| Subtitle | "{n} contacts" — updates when filtered |
| Primary action | "+ New contact" → opens CreateContactDrawer |

---

## 3. Filter Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Search | Text input | Searches first name, last name, email | Empty |
| Owner | Select | All / Me / {user list} | All (manager/admin) or hidden (sales rep sees own) |
| Company | Select | All / {company list from org} | All |

Filters are applied on change (debounced 300 ms for search). Active filters shown as dismissible chips below the bar.

---

## 4. Data Table

| Column | Source | Sortable | Width |
|--------|--------|----------|-------|
| Name | `firstName + lastName` | Yes | auto |
| Email | `email` | Yes | 220px |
| Phone | `phone` | No | 140px |
| Company | `companyName` | Yes | 160px |
| Owner | `ownerName` | Yes | 140px |
| Created | `createdAt` | Yes | 110px |
| Actions | — | No | 56px |

- **Name cell**: avatar initials + full name, clickable → `/contacts/:id`
- **Email cell**: rendered as `mailto:` link
- **Actions cell**: kebab menu → Edit, Delete (admin only)
- **Row click**: navigate to `/contacts/:id`

**Empty state**:
- No contacts yet: "No contacts yet. Add your first contact to get started." + "+ New contact" button
- No results for filter: "No contacts match your search. Try different filters."

**Loading state**: 8 skeleton rows matching column layout.

**Error state**: "Failed to load contacts. [Try again]" banner.

---

## 5. Create Contact Drawer

Opens from the right side (not a modal) so the list remains visible.

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| First name | text | Yes | 1–255 chars |
| Last name | text | Yes | 1–255 chars |
| Email | email | No | Valid email format |
| Phone | text | No | Max 50 chars |
| Job title | text | No | Max 255 chars |
| Company | searchable select | No | Lists companies in org |
| Owner | select | No | Defaults to current user; manager/admin can change |

**Drawer actions**:
- "Create contact" — POST /api/contacts
- "Cancel" — close drawer, no confirmation needed

**On success**: Close drawer, prepend new contact to list, toast "Contact created."
**On error (conflict)**: Inline error under email: "A contact with this email already exists."
**On error (validation)**: Inline errors under each invalid field.

---

## 6. States

| State | Trigger | UI |
|-------|---------|-----|
| Loading | Initial load / filter change | Skeleton rows |
| Empty (no data) | Org has no contacts | Empty state + CTA |
| Empty (filtered) | Filters match nothing | "No results" message |
| Error | API failure | Error banner + retry |
| Creating | Drawer open, submitting | Button spinner, fields disabled |
| Success | Contact created | Toast "Contact created." Drawer closes. |
| Deleting | Admin clicks Delete | Confirmation dialog → row fades out on confirm |

---

## 7. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | ✅ |
| See all contacts | ✅ | ✅ | Own only |
| Owner filter | ✅ | ✅ | Hidden |
| "+ New contact" | ✅ | ✅ | ✅ |
| Edit any contact | ✅ | ✅ | ❌ |
| Edit own contact | ✅ | ✅ | ✅ (via detail page) |
| Delete (kebab) | ✅ | ❌ | ❌ |

---

## 8. Navigation

- **Active nav item**: "Contacts"
- **Row click**: `/contacts/:id`
- **Breadcrumb**: none (top-level page)

---

## 9. Responsive Behaviour

| Breakpoint | Change |
|-----------|--------|
| > 1280px | All columns visible |
| 1024–1280px | Hide "Phone" and "Created" columns |
| 768–1024px | Hide "Phone", "Created", "Owner" columns |
| < 768px | Card list: avatar, name, email, company per card |

---

## 10. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/contacts/pages/ContactsPage.tsx` |
| API | `frontend/src/features/contacts/api.ts` |
| Hooks | `frontend/src/features/contacts/hooks.ts` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1contacts` |
