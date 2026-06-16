# UI Spec: Companies List

| Field | Value |
|-------|-------|
| Page name | Companies |
| Route | `/companies` |
| Feature | Company Management |
| Layout | AppLayout (sidebar + main) |

**Purpose**: Show all companies in the organisation so reps can navigate to any account and managers can see deal coverage across companies.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Companies                             [+ New company]       │
│  38 companies                                                │
├──────────────────────────────────────────────────────────────┤
│  [Search companies...]  [Owner ▼]  [Industry ▼]             │
├──────────────────────────────────────────────────────────────┤
│  Name ↕       Domain        Industry    Contacts  Owner  ↕  │
│  ──────────────────────────────────────────────────────────  │
│  Acme Corp    acme.com      SaaS         4         Sam Lee  │
│  Beta Inc     betainc.com   Finance      1         Sam Lee  │
│  …                                                          │
├──────────────────────────────────────────────────────────────┤
│  ← 1  2 →                              Showing 1–20 of 38   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Page Header

| Element | Detail |
|---------|--------|
| Title | "Companies" |
| Subtitle | "{n} companies" |
| Primary action | "+ New company" → opens CreateCompanyDrawer |

---

## 3. Filter Bar

| Filter | Type | Default |
|--------|------|---------|
| Search | Text | Searches name, domain |
| Owner | Select (manager/admin) | All |
| Industry | Select | All / distinct industry values in org |

---

## 4. Data Table

| Column | Source | Sortable | Width |
|--------|--------|----------|-------|
| Name | `name` | Yes | auto |
| Domain | `domain` | No | 160px |
| Industry | `industry` | Yes | 140px |
| Contacts | `contactCount` | Yes | 90px |
| Owner | `ownerName` | Yes | 140px |
| Created | `createdAt` | Yes | 110px |
| Actions | — | No | 56px |

- **Name cell**: company icon + name, clickable → `/companies/:id`
- **Domain cell**: rendered as external link if set
- **Contacts cell**: number badge, clickable → `/companies/:id` scrolled to Contacts tab
- **Actions cell**: kebab → Edit, Delete (admin only)

**Empty state**: "No companies yet. Add your first company." + "+ New company" CTA.

---

## 5. Create Company Drawer

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Company name | text | Yes | 1–255 chars, unique in org |
| Domain | text | No | e.g. acme.com |
| Industry | text | No | Free text (no enum) |
| Website | url | No | Valid URL |
| Country | text | No | |
| City | text | No | |
| Employee count | number | No | ≥ 0 |
| Annual revenue | number | No | ≥ 0 (USD) |
| Owner | select | No | Defaults to current user |

**On success**: Close drawer, prepend company to list, toast "Company created."
**On conflict**: Inline error under name: "A company with this name already exists."

---

## 6. States

| State | UI |
|-------|----|
| Loading | Skeleton rows |
| Empty (no data) | Empty state + CTA |
| Empty (filtered) | "No results" message |
| Error | Error banner + retry |
| Deleting | Confirmation dialog → row fades out |

---

## 7. Permissions

| Element | Admin | Manager | Sales Rep |
|---------|-------|---------|-----------|
| View page | ✅ | ✅ | ✅ |
| See all companies | ✅ | ✅ | Own only |
| "+ New company" | ✅ | ✅ | ✅ |
| Edit any | ✅ | ✅ | ❌ |
| Edit own | ✅ | ✅ | ✅ |
| Delete | ✅ | ❌ | ❌ |

---

## 8. Navigation

- **Active nav item**: "Companies"
- **Row click**: `/companies/:id`

---

## 9. Responsive Behaviour

| Breakpoint | Change |
|-----------|--------|
| > 1280px | All columns |
| 1024–1280px | Hide "Domain", "Created" |
| < 768px | Card list: name, industry, contact count per card |

---

## 10. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/companies/pages/CompaniesPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1companies` |
