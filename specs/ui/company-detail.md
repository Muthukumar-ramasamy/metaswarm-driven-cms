# UI Spec: Company Detail

| Field | Value |
|-------|-------|
| Page name | Company Detail |
| Route | `/companies/:id` |
| Feature | Company Management |
| Layout | AppLayout (sidebar + main) |

**Purpose**: Give a complete account view — everyone at a company, every deal being sold into it, and the activity history.

---

## 1. Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Companies   Acme Corp                          [Edit]  [⋮]     │
│  acme.com · SaaS · 150 employees                                   │
├─────────────────────────────┬──────────────────────────────────────┤
│  COMPANY INFO               │  OPEN DEALS (2)                     │
│                             │                                      │
│  Domain    acme.com         │  SaaS deal · $5,000 · Lead In       │
│  Industry  SaaS             │  Renewal   · $8,000 · Proposal      │
│  Website   acme.com →       │                                      │
│  Country   USA              │                                      │
│  City      San Francisco    │                                      │
│  Employees 150              │                                      │
│  Revenue   $12M             │                                      │
│  Owner     Sam Lee          │                                      │
├─────────────────────────────┴──────────────────────────────────────┤
│  Contacts (3)  │  Activities (8)  │  Notes (2)                     │
├────────────────────────────────────────────────────────────────────┤
│  Contacts tab:                                                     │
│  Alice Brown  Head of Procurement  alice@acme.com  →              │
│  Dave Evans   CTO                  dave@acme.com   →              │
│  Carol Kim    CFO                  —               →              │
│  [+ Add existing contact]  [+ New contact]                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Company Header

| Element | Detail |
|---------|--------|
| Back link | "← Companies" → `/companies` |
| Name | Large heading |
| Subheading | domain · industry · employee count |
| Edit button | Opens EditCompanyDrawer |
| Kebab | Reassign owner (manager/admin), Delete (admin) |

---

## 3. Company Info Panel

All fields shown only if set. Revenue formatted as "$XM" for millions.

---

## 4. Deals Panel

Lists open deals where `company_id` = this company. Same card pattern as Deal Detail. If none: "No open deals." + "+ New deal" button (pre-fills company).

---

## 5. Tabs

### Contacts tab

Table of contacts at this company:

| Column | Detail |
|--------|--------|
| Name | Link → `/contacts/:id` |
| Title | Job title |
| Email | mailto: link |
| Owner | Owning rep |

Two CTAs at bottom:
- "+ Add existing contact" → searchable select to link an existing contact to this company
- "+ New contact" → CreateContactDrawer with company pre-filled

### Activities tab

All activities linked to this company (same pattern as Deal Detail). Log/Schedule buttons.

### Notes tab

Notes for this company (same pattern as Contact Detail).

---

## 6. States

| State | UI |
|-------|----|
| Loading | Skeleton for panels and tabs |
| Not found | "Company not found." + back link |
| No contacts | "No contacts at this company yet." + CTA |
| No deals | "No open deals for this company." + CTA |

---

## 7. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | Own only |
| Edit company | ✅ | ✅ | Own only |
| Reassign owner | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |

---

## 8. Navigation

- **Active nav item**: "Companies"
- **Back link**: `/companies`
- **Contact links**: `/contacts/:id`
- **Deal links**: `/deals/:id`

---

## 9. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/companies/pages/CompanyDetailPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1companies~1{id}` |
