# UI Spec: Company Management

Full page-level UI specs:
- `specs/ui/companies-list.md`
- `specs/ui/company-detail.md`

---

## Pages

| Page | Route | Access |
|------|-------|--------|
| Companies list | `/companies` | All roles |
| Company detail | `/companies/:id` | All roles |

---

## Key UI Behaviours

- All roles see all companies (no owner-scoped filtering like contacts)
- "+ New company" opens right-side create drawer
- Company detail: three tabs (Contacts, Activities, Notes) + deals sidebar
- Contacts tab shows contacts with company_id = this company
- Delete (Admin only) — hidden for non-admins

---

## Components

| Component | File |
|-----------|------|
| CompaniesPage | `frontend/src/features/companies/pages/CompaniesPage.tsx` |
| CompanyDetailPage | `frontend/src/features/companies/pages/CompanyDetailPage.tsx` |
| CompanyTable | `frontend/src/features/companies/components/CompanyTable.tsx` |
| CompanyForm | `frontend/src/features/companies/components/CompanyForm.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| List page UI | `specs/ui/companies-list.md` |
| Detail page UI | `specs/ui/company-detail.md` |
| Feature spec | `specs/features/company-management/feature-spec.md` |
