# UI Spec: Team Members

| Field | Value |
|-------|-------|
| Page name | Team Members |
| Route | `/settings/users` |
| Feature | Auth & User Management |
| Layout | AppLayout (sidebar + main) |
| Access | Admin only |

**Purpose**: Let an Admin see who is on the team, invite new members, change roles, and deactivate users who have left.

---

## 1. Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Settings › Team                          [+ Invite member] │
│  6 members (5 active · 1 deactivated)                       │
├──────────────────────────────────────────────────────────────┤
│  [Search members...]  [Role ▼]  [Status ▼]                  │
├──────────────────────────────────────────────────────────────┤
│  Name ↕         Email               Role          Status    │
│  ──────────────────────────────────────────────────────────  │
│  Alex Park      alex@co.com         Admin         Active    │
│  Sam Lee        sam@co.com          Sales Rep     Active    │
│  Jordan Kim     jordan@co.com       Manager       Active    │
│  Carol Davis    carol@co.com        Sales Rep  ↻ Pending   │
│  Dave Evans     —                   Sales Rep  ✕ Inactive  │
│  ──────────────────────────────────────────────────────────  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Page Header

| Element | Detail |
|---------|--------|
| Title | "Team" |
| Breadcrumb | Settings › Team |
| Subtitle | "{n} members ({n} active · {n} pending · {n} deactivated)" |
| Primary action | "+ Invite member" → opens InviteMemberModal |

---

## 3. Filter Bar

| Filter | Options | Default |
|--------|---------|---------|
| Search | Name, email | Empty |
| Role | All / Admin / Manager / Sales Rep | All |
| Status | All / Active / Pending / Deactivated | All |

---

## 4. Data Table

| Column | Detail |
|--------|--------|
| Name | Avatar initials + name — "—" if invite not yet accepted |
| Email | Email address |
| Role | Badge: Admin (purple), Manager (blue), Sales Rep (grey) |
| Status | Active (green) / Pending (amber, ↻ icon) / Deactivated (red, ✕ icon) |
| Actions | Kebab menu |

**Kebab menu options per status:**

| Status | Actions |
|--------|---------|
| Active | Change role, Deactivate |
| Pending | Resend invite, Cancel invite |
| Deactivated | Reactivate |

The current user's own row does not show "Deactivate" (cannot deactivate yourself).

---

## 5. Invite Member Modal

```
┌────────────────────────────────────┐
│  Invite a team member              │
│                                    │
│  Email  ________________________   │
│  Name   ________________________   │
│  Role   [Sales Rep ▼]              │
│                                    │
│  An invite email will be sent.     │
│  Link expires in 72 hours.         │
│                                    │
│  [Cancel]      [Send invite]       │
└────────────────────────────────────┘
```

| Field | Required | Validation |
|-------|----------|------------|
| Email | Yes | Valid email, not already in org |
| Name | No | Pre-fills the invite form for the recipient |
| Role | Yes | Defaults to Sales Rep |

**On success**: Modal closes, new row appears with status "Pending". Toast "Invite sent to {email}."
**On conflict**: Inline error "A user with this email already exists in your team."

---

## 6. Change Role Inline

Clicking "Change role" from the kebab opens a small inline select on the row:

```
  Sam Lee  [Sales Rep ▼ ✓]
```

Select updates immediately. PUT /api/users/:id fires on change. Toast "Role updated."

---

## 7. Deactivate Confirmation

```
┌────────────────────────────────────┐
│  Deactivate Sam Lee?               │
│                                    │
│  Sam will lose access immediately. │
│  Their records will be preserved.  │
│                                    │
│  [Cancel]      [Deactivate]        │
└────────────────────────────────────┘
```

On confirm: row status badge changes to "Deactivated". Toast "Sam Lee has been deactivated."

**Last admin guard**: If deactivating would remove the last admin, the confirm button is disabled with tooltip: "Cannot deactivate the last admin. Assign another admin first."

---

## 8. States

| State | UI |
|-------|----|
| Loading | Skeleton rows |
| No members (impossible — self always exists) | N/A |
| Invite sending | Modal button spinner |
| Role updating | Row shows inline spinner |
| Error | Toast with error message |

---

## 9. Permissions

Admin only. Non-admins navigating to `/settings/users` are redirected to `/deals`.

---

## 10. Navigation

- **Active nav item**: "Settings" (sub-item: Team)
- **Breadcrumb**: Settings › Team

---

## 11. Related Files

| File | Path |
|------|------|
| Component | `frontend/src/features/auth/pages/UsersPage.tsx` |
| API spec | `specs/api/openapi.yaml#/paths/~1api~1users` |
