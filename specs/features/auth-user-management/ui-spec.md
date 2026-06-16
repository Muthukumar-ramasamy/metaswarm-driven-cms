# UI Spec: Auth & User Management

Full page-level UI specs:
- `specs/ui/auth.md` — Login, Signup, Forgot Password, Reset Password, Accept Invite pages
- `specs/ui/team-members.md` — Team members settings page (`/settings/users`)

---

## Pages in this module

| Page | Route | Access |
|------|-------|--------|
| Login | `/login` | Public |
| Sign up | `/signup` | Public |
| Forgot password | `/forgot-password` | Public |
| Reset password | `/reset-password` | Public (via token) |
| Accept invite | `/accept-invite` | Public (via token) |
| Team members | `/settings/users` | Admin only |

---

## Key UI Behaviours

### Auth pages
- Centered card layout (AuthLayout) — no sidebar
- On successful login/signup: JWT stored in localStorage, redirect to `/deals`
- On 401/403 error: inline form error (not toast)
- Token in URL (/accept-invite?token=..., /reset-password?token=...): extracted by the page, not stored

### Team members page
- AppLayout (sidebar + main)
- Table: Name, Email, Role (badge), Status (badge), Actions (kebab menu)
- Kebab options: Change role (inline select), Deactivate, Resend invite, Reactivate
- Invite modal: email (required), name (optional), role (required, default Sales Rep)
- Last-admin guard: deactivate button disabled + tooltip if target is last admin
- Non-admins navigating to `/settings/users` redirect to `/deals`

---

## Components

| Component | File |
|-----------|------|
| LoginPage | `frontend/src/features/auth/pages/LoginPage.tsx` |
| SignupPage | `frontend/src/features/auth/pages/SignupPage.tsx` |
| ForgotPasswordPage | `frontend/src/features/auth/pages/ForgotPasswordPage.tsx` |
| ResetPasswordPage | `frontend/src/features/auth/pages/ResetPasswordPage.tsx` |
| AcceptInvitePage | `frontend/src/features/auth/pages/AcceptInvitePage.tsx` |
| UsersPage | `frontend/src/features/auth/pages/UsersPage.tsx` |
| InviteMemberModal | `frontend/src/features/auth/components/InviteMemberModal.tsx` |
| DeactivateConfirmDialog | `frontend/src/features/auth/components/DeactivateConfirmDialog.tsx` |

---

## Related Specs

| Spec | Path |
|------|------|
| Auth pages | `specs/ui/auth.md` |
| Team members page | `specs/ui/team-members.md` |
| Feature spec | `specs/features/auth-user-management/feature-spec.md` |
