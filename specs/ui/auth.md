# UI Spec: Auth Pages

> **Phase**: 6 — UI Specification
> **Feature**: Auth
> **Created**: 2026-06-13

Covers four screens: Login, Signup, Forgot Password, Reset Password, and Accept Invite.
All auth pages use `AuthLayout` — a centred card with no sidebar.

---

## Screen 1: Login (`/login`)

### 1. Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│             [CRM Logo / Name]               │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  Sign in to your workspace          │   │
│   │                                     │   │
│   │  Email ________________________     │   │
│   │  Password ______________________   │   │
│   │                     [Forgot?]       │   │
│   │                                     │   │
│   │  [Sign in]  (full-width button)     │   │
│   │                                     │   │
│   │  Don't have an account? Sign up     │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Email | email input | Yes | Valid email format |
| Password | password input | Yes | Non-empty |

### 3. Actions

| Action | Behaviour |
|--------|-----------|
| Sign in | POST /api/auth/login → store token → redirect to /deals |
| Forgot password? | Link → navigate to /forgot-password |
| Sign up | Link → navigate to /signup |

### 4. States

| State | UI |
|-------|----|
| Loading | Button shows spinner, disabled |
| Invalid credentials | Toast: "Invalid email or password." Fields not cleared |
| Deactivated account | Toast: "Your account has been deactivated." |
| Network error | Toast: "Could not connect. Check your connection." |

---

## Screen 2: Signup (`/signup`)

### 1. Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│             [CRM Logo / Name]               │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  Create your workspace              │   │
│   │                                     │   │
│   │  Company name __________________    │   │
│   │  Your name _____________________    │   │
│   │  Email _________________________    │   │
│   │  Password ______________________    │   │
│   │                                     │   │
│   │  [Create workspace]                 │   │
│   │                                     │   │
│   │  Already have an account? Sign in   │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Company name | text | Yes | 1–255 chars |
| Your name | text | Yes | 1–255 chars |
| Email | email | Yes | Valid email |
| Password | password | Yes | ≥ 8 chars |

### 3. Actions

| Action | Behaviour |
|--------|-----------|
| Create workspace | POST /api/auth/signup → store token → redirect to /deals |
| Sign in link | Navigate to /login |

### 4. States

| State | UI |
|-------|----|
| Loading | Button spinner, disabled |
| Email conflict | Toast: "An account with this email already exists." |
| Validation error | Inline field errors below each invalid field |

---

## Screen 3: Forgot Password (`/forgot-password`)

### 1. Layout

```
┌─────────────────────────────────────────────┐
│   ┌─────────────────────────────────────┐   │
│   │  Reset your password                │   │
│   │  Enter your email and we'll send    │   │
│   │  you a reset link.                  │   │
│   │                                     │   │
│   │  Email _________________________    │   │
│   │                                     │   │
│   │  [Send reset link]                  │   │
│   │                                     │   │
│   │  ← Back to login                    │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2. Actions

| Action | Behaviour |
|--------|-----------|
| Send reset link | POST /api/auth/forgot-password → always show success message (never reveal if email exists) |
| Back to login | Navigate to /login |

### 3. States

| State | UI |
|-------|----|
| Success | Replace form with: "If that email exists, a reset link is on its way." |
| Loading | Button spinner |

---

## Screen 4: Reset Password (`/reset-password?token=...`)

### 1. Layout

```
┌─────────────────────────────────────────────┐
│   ┌─────────────────────────────────────┐   │
│   │  Choose a new password              │   │
│   │                                     │   │
│   │  New password __________________    │   │
│   │  Confirm password ______________    │   │
│   │                                     │   │
│   │  [Save new password]                │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2. Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| New password | password | Yes | ≥ 8 chars |
| Confirm password | password | Yes | Must match new password |

### 3. Actions

| Action | Behaviour |
|--------|-----------|
| Save | POST /api/auth/reset-password → redirect to /login with toast "Password updated. Please log in." |

### 4. States

| State | UI |
|-------|----|
| Invalid token | Full-page error: "This link is invalid or has expired." + link to /forgot-password |
| Password mismatch | Inline error on confirm field: "Passwords do not match." |

---

## Screen 5: Accept Invite (`/accept-invite?token=...`)

### 1. Layout

```
┌─────────────────────────────────────────────┐
│   ┌─────────────────────────────────────┐   │
│   │  You've been invited to [Org Name]  │   │
│   │                                     │   │
│   │  Your name _____________________    │   │
│   │  Password ______________________    │   │
│   │  Confirm password ______________    │   │
│   │                                     │   │
│   │  [Accept invite]                    │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 2. Actions

| Action | Behaviour |
|--------|-----------|
| Accept invite | POST /api/auth/accept-invite → store token → redirect to /deals |

### 3. States

| State | UI |
|-------|----|
| Expired invite | Full-page error: "This invite link has expired. Ask your admin to resend it." |
| Already accepted | Redirect to /login |

---

## Shared Auth Conventions

- All auth pages use `AuthLayout` (centred card, no sidebar, no navigation)
- Token stored in `localStorage` on success
- `useAuth()` hook redirects to `/deals` if user is already logged in
- All password fields have a show/hide toggle icon
- Form submit is triggered by Enter key as well as button click
