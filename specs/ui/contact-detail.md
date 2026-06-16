# UI Spec: Contact Detail

| Field | Value |
|-------|-------|
| Page name | Contact Detail |
| Route | `/contacts/:id` |
| Feature | Contact Management |
| Layout | AppLayout (sidebar + main) |

**Purpose**: Show everything known about a person — their info, which company they work for, every deal they're part of, and the full history of interactions.

---

## 1. Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Contacts    Alice Brown                      [Edit]  [⋮]        │
│  alice@acme.com · 555-0101 · Head of Procurement                   │
│  Acme Corp →                                                       │
├─────────────────────────────┬──────────────────────────────────────┤
│  CONTACT INFO               │  DEALS (2 open)                     │
│                             │                                      │
│  Email  alice@acme.com      │  SaaS deal · $5,000 · Lead In       │
│  Phone  555-0101            │  Renewal · $8,000 · Proposal Sent   │
│  Title  Head of Procurement │                                      │
│  Src    Manual              │                                      │
│  Owner  Sam Lee             │                                      │
│  Added  Jun 2, 2026         │                                      │
├─────────────────────────────┴──────────────────────────────────────┤
│  Activities (6)  │  Notes (3)                                      │
├────────────────────────────────────────────────────────────────────┤
│  [+ Log activity]  [+ Schedule task]                               │
│                                                                    │
│  ● Call · Jun 12 · "Discussed Q3 expansion"            [⋮]       │
│  ○ Task · Follow up · Due Jun 16 · ⚠ Overdue           [Done]    │
│  ✉ Email · Jun 10 · "Sent contract draft"              [⋮]       │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Contact Header

| Element | Detail |
|---------|--------|
| Back link | "← Contacts" → `/contacts` |
| Name | Large heading |
| Subheading | Email · Phone · Job title (only fields that are set) |
| Company link | "Acme Corp →" → `/companies/:id` |
| Edit button | Opens EditContactDrawer |
| Kebab | Reassign owner (manager/admin), Delete (admin) |

---

## 3. Contact Info Panel

| Field | Behaviour |
|-------|-----------|
| Email | `mailto:` link |
| Phone | `tel:` link |
| Job title | Plain text |
| LinkedIn | External link icon (if set) |
| Source | Badge |
| Owner | Name — click to reassign (manager/admin only) |
| Added | Absolute date |

---

## 4. Deals Panel (right)

Lists open deals linked to this contact. Shows title, value, current stage name. Each row links to `/deals/:id`. If no open deals: "No open deals." + "+ New deal" button.

---

## 5. Tabs

### Activities tab (same pattern as Deal Detail)

- All activities linked to this contact
- "+ Log activity" and "+ Schedule task" buttons (same modals as Deal Detail)
- Ordered by created_at desc, pending tasks pinned to top

### Notes tab

- All notes for this contact
- "+ Add note" inline form
- Pinned notes at top
- Edit/delete for author or admin

---

## 6. Edit Contact Drawer

Same fields as the Create Contact Drawer on the list page, but pre-filled.

---

## 7. States

| State | UI |
|-------|----|
| Loading | Skeleton for both panels, skeleton tabs |
| Not found | "Contact not found." + link back to /contacts |
| No activities | "No activities yet. Log the first one." + CTA |
| No notes | "No notes yet. Add one." + CTA |

---

## 8. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | Own only |
| Edit contact | ✅ | ✅ | Own only |
| Reassign owner | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |
| Log activity | ✅ | ✅ | Own contact |
| Edit any note | ✅ | ❌ | ❌ |

---

## 9. Navigation

- **Active nav item**: "Contacts"
- **Back link**: `/contacts`
- **Company link**: `/companies/:id`
- **Deal links**: `/deals/:id`

---

## 10. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/contacts/pages/ContactDetailPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1contacts~1{id}` |
