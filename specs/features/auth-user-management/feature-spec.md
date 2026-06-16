# Feature Spec: Auth & User Management — Phase 1

---

## 1. Overview

| Field | Value |
|-------|-------|
| Feature name | Auth & User Management — Phase 1 |
| Module | Module 1 |
| Priority | P0 |
| Status | Approved |
| Phase | Phase 1: Signup, Login, Logout |
| Author | Product Agent |
| Created | 2026-06-13 |
| Last updated | 2026-06-16 |

> **Scope decision (2026-06-16)**: Phase 1 is limited to signup, login, and logout only.
> Invite flow, password reset, and team management are deferred to Phase 2.
> Reason: Narrowed to prove the metaswarm pipeline end-to-end with minimal complexity.

---

## 2. Business Goal

Allow an admin to create a workspace, log in, and log out. Every record in the system must be tied to the user who created it and the organisation it belongs to. Without this module, no other module can function — authentication is the gateway to all CRM data.

---

## 3. User Roles Affected

- [x] Admin (created on signup — only role created in Phase 1)
- [ ] Manager — Phase 2 (created via invite)
- [ ] Sales Rep — Phase 2 (created via invite)

---

## 4. User Stories (Phase 1)

### 4.1 Workspace sign-up
**As an** Admin,
**I want to** create a workspace for my organisation,
**So that** my team has a private, isolated CRM instance.

### 4.2 Log in
**As any** user,
**I want to** log in with my email and password,
**So that** I can access my workspace securely.

### 4.3 Log out
**As any** user,
**I want to** log out,
**So that** my session is closed on shared or public devices.

---

## 5. Acceptance Criteria (Phase 1)

### AC-01: Workspace creation
**Given** a valid email, password, organisation name, and first name,
**When** a new user submits the sign-up form,
**Then** an organisation record is created, the user is created with role Admin and status Active, a JWT is returned, and the user is redirected to the pipeline board.

### AC-02: Duplicate signup email
**Given** a user with the email `sam@co.com` already exists,
**When** another sign-up is attempted with the same email,
**Then** the system returns 409 with message "A user with this email already exists."

### AC-03: Login with valid credentials
**Given** an Active user with verified email and password,
**When** they submit correct credentials,
**Then** a JWT access token is returned, stored in localStorage, and the user is redirected to the pipeline board.

### AC-04: Login with invalid credentials
**Given** a user submits an incorrect password,
**When** the login form is submitted,
**Then** the system returns 401 with message "Invalid email or password."

### AC-05: Deactivated user blocked
**Given** a user account has status `deactivated`,
**When** the user attempts to log in,
**Then** the system returns 403 with message "Your account has been deactivated. Contact your admin."

### AC-06: Logout
**Given** a logged-in user with a valid JWT,
**When** they click logout,
**Then** the JWT is cleared from localStorage and the user is redirected to /login.

---

## 6. Out of Scope

### Phase 1 exclusions (deferred to Phase 2)
- Invite team member (POST /api/users/invite)
- Accept invite and set password (POST /api/auth/accept-invite)
- Resend invite (POST /api/users/:id/resend-invite)
- Forgot password (POST /api/auth/forgot-password)
- Reset password (POST /api/auth/reset-password)
- List users (GET /api/users)
- Update user role or status (PUT /api/users/:id)
- Deactivate user (DELETE /api/users/:id)
- Team members page (/settings/users)
- GET /api/auth/me

### Out of scope (all phases — MVP)
- SSO / OAuth (Google, Microsoft)
- Two-factor authentication (2FA)
- Session management UI
- Audit log of user actions
- Password strength meter
- Email change flow

---

## 7. Data Requirements

### Entities involved
- **Organization**: created on sign-up; all other entities scoped to it
- **User**: created on sign-up with role Admin and status Active

### Fields used in Phase 1

| Entity | Field | Type | Required | Notes |
|--------|-------|------|----------|-------|
| Organization | name | VARCHAR(255) | Yes | Workspace display name |
| Organization | slug | VARCHAR(100) | Yes | Globally unique, URL-safe |
| User | first_name | VARCHAR(255) | Yes | |
| User | email | VARCHAR(255) | Yes | Globally unique in Phase 1 |
| User | password_hash | VARCHAR(255) | Yes | bcrypt, 12 rounds |
| User | role | ENUM | Yes | Always `admin` on signup |
| User | status | ENUM | Yes | Always `active` on signup |

> **Note**: Users table also contains `invite_token`, `password_reset_token`, `deactivated_at` fields for Phase 2. These are created in the migration but unused in Phase 1.

---

## 8. API Requirements (Phase 1)

| Method | Path | Description | Auth required |
|--------|------|-------------|---------------|
| POST | /api/auth/signup | Create organisation + admin user | No |
| POST | /api/auth/login | Authenticate, return JWT | No |
| POST | /api/auth/logout | Clear session (client-side) | Yes |

---

## 9. UI Requirements (Phase 1)

| Page / Component | Description |
|-----------------|-------------|
| Login page | Email + password form |
| Signup page | Org name, first name, email, password |

> All other auth UI pages (forgot-password, reset-password, accept-invite, team members) are Phase 2.

---

## 10. Business Rules (Phase 1)

- **BR-04**: Passwords must be at least 8 characters.
- **BR-05**: Email must be globally unique (only one org per email in Phase 1).
- **BR-06**: A deactivated user cannot log in.
- **BR-08**: organisation_id is always derived from the JWT, never from the request body.

> Phase 2 business rules (deferred): BR-01 (last admin guard), BR-02 (self-deactivation block), BR-03 (invite expiry), BR-07 (reset token expiry).

---

## 11. Error Cases (Phase 1)

| Scenario | HTTP | Error code | Message |
|----------|------|------------|---------|
| Signup with duplicate email | 409 | CONFLICT | "A user with this email already exists." |
| Login with wrong password | 401 | UNAUTHORIZED | "Invalid email or password." |
| Login with unknown email | 401 | UNAUTHORIZED | "Invalid email or password." (no enumeration) |
| Login as deactivated user | 403 | FORBIDDEN | "Your account has been deactivated. Contact your admin." |
| Login as pending user | 401 | UNAUTHORIZED | "Invalid email or password." |
| Logout with missing/invalid JWT | 401 | UNAUTHORIZED | "Missing or invalid token." |
| Password shorter than 8 chars | 400 | VALIDATION_ERROR | Zod validation details |

---

## 12. Permissions Matrix (Phase 1)

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| Sign up (create org) | ✅ | ✅ | ✅ |
| Log in | ✅ | ✅ | ✅ |
| Log out | ✅ | ✅ | ✅ |

---

## 13. Related Specs

| Spec | Path |
|------|------|
| DB spec | `specs/features/auth-user-management/db-spec.md` |
| API spec | `specs/features/auth-user-management/api-spec.md` |
| Test spec | `specs/features/auth-user-management/test-spec.md` |

---

## 14. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Should JWT refresh tokens be implemented in MVP or rely solely on 24h access tokens? | Resolved: 24h access token only (ADR-003) |
