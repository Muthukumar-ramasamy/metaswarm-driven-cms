# UI Spec: {PageName}

> This template defines the UI contract for one page or major component.
> The frontend agent reads this file to generate React components.

---

## 1. Page Overview

| Field | Value |
|-------|-------|
| Page name | {PageName} |
| Route | `/app/{route}` |
| Feature | {FeatureName} |
| Layout | Sidebar + Main / Full width / Modal |

**Purpose**: {One sentence — what does this page do for the user?}

---

## 2. Layout

```
┌─────────────────────────────────────────────┐
│  Page header                                │
│  Title          [Primary action button]     │
├──────────────┬──────────────────────────────┤
│              │                              │
│  Filters /   │   Main content area          │
│  Sidebar     │   (table / kanban / detail)  │
│              │                              │
└──────────────┴──────────────────────────────┘
```

> Replace the ASCII layout with an accurate representation of this page.

---

## 3. Components

### 3.1 Page Header

| Element | Type | Description |
|---------|------|-------------|
| Page title | Text | e.g., "Leads" |
| Subtitle | Text (optional) | e.g., "142 total" |
| Primary action | Button | e.g., "+ New lead" |
| Secondary actions | Button group (optional) | e.g., Import, Export |

---

### 3.2 Filter Bar

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| Search | Text input | Full-text on name, email | Empty |
| Status | Select | All / {Status values} | All |
| Assigned to | Select | All / Me / {Users} | All |
| Date range | Date picker | Custom range | Last 30 days |

---

### 3.3 Data Table / List

**Columns**:

| Column | Source field | Sortable | Width |
|--------|-------------|----------|-------|
| {Column 1} | {field} | Yes / No | auto / fixed |
| {Column 2} | {field} | Yes / No | auto / fixed |
| Status | status | Yes | 100px |
| Owner | assignedTo.name | Yes | 140px |
| Created | createdAt | Yes | 120px |
| Actions | — | No | 80px |

**Row actions** (shown on hover or in kebab menu):
- Edit
- Delete (Admin only)
- {Feature-specific action}

**Empty state**: "No {resources} yet. {CTA to create first one.}"

**Loading state**: Skeleton rows (match column count)

**Error state**: "Failed to load {resources}. [Retry]"

---

### 3.4 Create / Edit Form (Modal or Drawer)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| {Field 1} | Text | Yes | Min 2, max 100 chars |
| {Field 2} | Email | Yes | Valid email format |
| {Field 3} | Select | No | One of: {options} |
| Notes | Textarea | No | Max 2000 chars |

**Form actions**:
- Primary: Save / Create
- Secondary: Cancel

**On success**: Close modal, refresh list, show toast "Lead created"
**On error**: Show inline field errors, keep form open

---

## 4. States

| State | Trigger | UI behaviour |
|-------|---------|-------------|
| Loading | Page mount / filter change | Skeleton loader in table |
| Empty | No data matching filters | Empty state illustration + CTA |
| Error | API failure | Error banner with retry |
| Success | Create / update / delete | Toast notification |
| Optimistic | Delete action | Row grays out immediately |

---

## 5. Permissions

| UI element | Admin | Manager | Sales Rep |
|-----------|-------|---------|-----------|
| View page | ✅ | ✅ | ✅ |
| Create button | ✅ | ✅ | ✅ |
| Edit any row | ✅ | ✅ | ❌ |
| Edit own row | ✅ | ✅ | ✅ |
| Delete action | ✅ | ❌ | ❌ |

> Elements the user cannot access should be hidden, not disabled.

---

## 6. Navigation

- **Breadcrumb**: {e.g., "Home > Leads"}
- **Active nav item**: {e.g., "Leads" in sidebar}
- **On row click**: Navigate to `{/app/resource/:id}`

---

## 7. Responsive Behaviour

| Breakpoint | Layout change |
|-----------|---------------|
| > 1024px | Full table with all columns |
| 768–1024px | Hide secondary columns (e.g., Created date) |
| < 768px | Card list instead of table |

---

## 8. Related Files

| File | Path |
|------|------|
| Feature spec | `specs/features/{feature}/feature-spec.md` |
| API spec | `specs/api/openapi.yaml` |
| Component | `frontend/src/features/{feature}/pages/{PageName}.tsx` |
