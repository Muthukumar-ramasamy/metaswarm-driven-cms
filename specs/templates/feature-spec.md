# Feature Spec: {FeatureName}

> **Template instructions**: Replace all `{placeholders}`. Delete this line when the spec is complete.
> Every section is mandatory. "N/A" is not acceptable — if a section doesn't apply, explain why.

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | {FeatureName} |
| Module | {Module} |
| Priority | P0 / P1 / P2 |
| Status | Draft / Review / Approved |
| Author | {Name} |
| Created | {YYYY-MM-DD} |
| Last updated | {YYYY-MM-DD} |

---

## 2. Business Goal

> One paragraph. What problem does this feature solve? Why does it exist?

{Describe the business problem and the value this feature delivers.}

---

## 3. User Roles Affected

- [ ] Admin
- [ ] Manager
- [ ] Sales Rep

---

## 4. User Stories

Format: `As a {role}, I want to {action} so that {outcome}.`

### 4.1 {Story title}
**As a** {role},
**I want to** {action},
**So that** {outcome}.

### 4.2 {Story title}
**As a** {role},
**I want to** {action},
**So that** {outcome}.

> Add as many stories as needed. Each story maps to at least one acceptance criterion.

---

## 5. Acceptance Criteria

Format: `Given {context}, when {action}, then {expected result}.`

### AC-01: {Criterion title}
**Given** {context},
**When** {action},
**Then** {expected result}.

### AC-02: {Criterion title}
**Given** {context},
**When** {action},
**Then** {expected result}.

> Each AC becomes a test case in the test spec. Number them sequentially — AC-01, AC-02, etc.

---

## 6. Out of Scope (MVP)

List anything explicitly excluded from this feature in the current sprint.

- {Excluded capability 1}
- {Excluded capability 2}

---

## 7. Data Requirements

### Entities involved
- {Entity 1}: {what changes or is created}
- {Entity 2}: {what changes or is created}

### New fields (if any)

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| {entity} | {field} | string / uuid / timestamp / boolean / int | Yes / No | {notes} |

---

## 8. API Requirements

List the endpoints this feature needs. Full spec lives in `specs/api/openapi.yaml`.

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| GET | /api/{resource} | List {resources} | Yes |
| POST | /api/{resource} | Create {resource} | Yes |
| GET | /api/{resource}/:id | Get {resource} by ID | Yes |
| PUT | /api/{resource}/:id | Update {resource} | Yes |
| DELETE | /api/{resource}/:id | Delete {resource} | Yes |

---

## 9. UI Requirements

List the pages / components this feature needs. Full spec lives in `specs/ui/{feature}.md`.

| Page / Component | Description |
|-----------------|-------------|
| {Page name} | {What it shows and does} |
| {Component name} | {What it renders} |

---

## 10. Business Rules

List rules the code must enforce.

- **BR-01**: {Rule — e.g., "A lead cannot be converted unless it has a contact email."}
- **BR-02**: {Rule}
- **BR-03**: {Rule}

---

## 11. Error Cases

| Scenario | Expected behaviour |
|----------|-------------------|
| {e.g., Duplicate email} | {e.g., Return 409 with message "Contact with this email already exists"} |
| {Scenario} | {Expected behaviour} |

---

## 12. Permissions Matrix

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View list | ✅ | ✅ | ✅ |
| View detail | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ |
| Edit own | ✅ | ✅ | ✅ |
| Edit any | ✅ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| UI spec | `specs/ui/{feature}.md` |
| API spec | `specs/api/openapi.yaml#{feature}` |
| DB spec | `specs/database/schema.md#{entity}` |
| Test spec | `specs/features/{feature}/test-spec.md` |

---

## 14. Open Questions

| # | Question | Owner | Due | Status |
|---|----------|-------|-----|--------|
| 1 | {Question} | {Name} | {date} | Open / Resolved |
