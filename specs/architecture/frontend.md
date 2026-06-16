# Architecture Spec: Frontend

> **Agent**: Architect Agent
> **Phase**: 3 — Architecture Specification
> **Input**: specs/product/prd.md, specs/architecture/system-context.md
> **Status**: Draft
> **Created**: 2026-06-13

---

## 1. Stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | React | 18 |
| Language | TypeScript | 5.x |
| Build tool | Vite | 5.x |
| Routing | React Router | v6 |
| Server state | TanStack Query | v5 |
| Forms | React Hook Form | v7 |
| Validation | Zod | v3 |
| UI components | MUI (@mui/material v5) + Emotion | latest |
| HTTP client | Axios | v1 |
| Auth token | localStorage | — |

---

## 2. Folder Structure

```
frontend/
├── public/
├── src/
│   ├── main.tsx                  # React entry, QueryClient + Router setup
│   ├── App.tsx                   # Route definitions
│   │
│   ├── lib/
│   │   ├── api.ts                # Axios instance with base URL + auth interceptor
│   │   ├── auth.ts               # localStorage token helpers (get/set/clear)
│   │   └── utils.ts              # cn(), date formatters, currency formatter
│   │
│   ├── components/
│   │   └── ui/                   # Shared MUI wrapper components (layout helpers, etc.)
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx        # Centred card — used for login, signup, reset
│   │   └── AppLayout.tsx         # Sidebar + topbar — used for all authenticated pages
│   │
│   ├── features/                 # One folder per CRM module
│   │   ├── auth/
│   │   │   ├── api.ts            # login(), signup(), resetPassword()
│   │   │   ├── hooks.ts          # useLogin, useSignup, useCurrentUser
│   │   │   ├── schemas.ts        # Zod schemas for auth forms
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx
│   │   │       ├── SignupPage.tsx
│   │   │       └── ResetPasswordPage.tsx
│   │   │
│   │   ├── contacts/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── schemas.ts
│   │   │   └── pages/
│   │   │       ├── ContactsPage.tsx      # List view
│   │   │       └── ContactDetailPage.tsx # Detail view
│   │   │
│   │   ├── companies/
│   │   │   └── ...               # Same structure as contacts
│   │   │
│   │   ├── leads/
│   │   │   └── ...               # List view only (no Kanban in MVP)
│   │   │
│   │   ├── deals/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── schemas.ts
│   │   │   └── pages/
│   │   │       ├── PipelinePage.tsx      # Kanban board by stage
│   │   │       └── DealDetailPage.tsx
│   │   │
│   │   ├── activities/
│   │   │   └── pages/
│   │   │       └── MyTasksPage.tsx       # Upcoming tasks for current user
│   │   │
│   │   ├── notes/                # No standalone page — rendered inside detail pages
│   │   │   ├── api.ts
│   │   │   └── components/
│   │   │       ├── NoteList.tsx
│   │   │       └── NoteForm.tsx
│   │   │
│   │   └── reports/
│   │       └── pages/
│   │           └── ReportsPage.tsx
│   │
│   ├── hooks/
│   │   └── useAuth.ts            # Returns current user + role, isAdmin, isManager helpers
│   │
│   └── types/
│       └── index.ts              # Shared TypeScript types (User, Contact, Deal, etc.)
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Routing

All routes are defined in `src/App.tsx`. Authenticated routes are wrapped in a `<ProtectedRoute>` component that redirects to `/login` if no valid token is present in localStorage.

```
/login                        → LoginPage          (public)
/signup                       → SignupPage         (public)
/reset-password               → ResetPasswordPage  (public)

/                             → redirect to /deals (authenticated)
/contacts                     → ContactsPage       (authenticated)
/contacts/:id                 → ContactDetailPage  (authenticated)
/companies                    → CompaniesPage      (authenticated)
/companies/:id                → CompanyDetailPage  (authenticated)
/leads                        → LeadsPage          (authenticated)
/deals                        → PipelinePage       (authenticated)
/deals/:id                    → DealDetailPage     (authenticated)
/tasks                        → MyTasksPage        (authenticated)
/reports                      → ReportsPage        (authenticated, manager+)
/settings/pipeline            → PipelineSettingsPage (authenticated, admin only)
/settings/users               → UsersPage          (authenticated, admin only)
```

---

## 4. State Management

### 4.1 Server state — TanStack Query

All data fetched from the API is managed by TanStack Query. No Redux, Zustand, or Context is used for server-side data.

**Query key conventions:**
```ts
['contacts', { organizationId }]           // list
['contacts', contactId]                    // single record
['deals', { stageId, ownerId }]            // filtered list
['activities', { recordType, recordId }]   // activities for a record
```

**Mutation pattern** — every create/update/delete follows this shape:
```ts
const mutation = useMutation({
  mutationFn: (data) => api.post('/contacts', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
  },
})
```

### 4.2 Client state — React Context (minimal)

Only one piece of global client state is needed: the current authenticated user. This is stored in a `AuthContext` that wraps the whole app.

```ts
// AuthContext provides:
{
  user: User | null
  isLoading: boolean
  logout: () => void
}
```

The current user is fetched once on app load via `GET /api/auth/me` and cached by TanStack Query. It is NOT stored in localStorage beyond the JWT token.

---

## 5. API Client

All HTTP calls go through a single Axios instance defined in `src/lib/api.ts`.

```ts
// src/lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

Each feature's `api.ts` imports this instance and exports typed functions:
```ts
// features/contacts/api.ts
export const getContacts = (params) => api.get('/contacts', { params }).then(r => r.data)
export const createContact = (data) => api.post('/contacts', data).then(r => r.data)
```

---

## 6. Form Pattern

Every form uses React Hook Form with a Zod resolver. The Zod schema is the single source of truth for both TypeScript types and runtime validation.

```ts
// features/contacts/schemas.ts
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email().optional().or(z.literal('')),
  phone:     z.string().optional(),
  companyId: z.string().uuid().optional(),
})
export type CreateContactInput = z.infer<typeof createContactSchema>
```

```tsx
// In the form component
const form = useForm<CreateContactInput>({
  resolver: zodResolver(createContactSchema),
})
```

---

## 7. UI Layout

### AppLayout (authenticated pages)

```
┌────────────────────────────────────────────────┐
│  Sidebar (fixed left, 240px)  │  Main content  │
│                               │                │
│  Logo                         │  Page header   │
│  ─────────────                │  ─────────     │
│  Deals (active)               │                │
│  Contacts                     │  Page content  │
│  Companies                    │                │
│  Leads                        │                │
│  Tasks                        │                │
│  Reports                      │                │
│  ─────────────                │                │
│  Settings (admin)             │                │
│  ─────────────                │                │
│  User avatar + name           │                │
│  Logout                       │                │
└────────────────────────────────────────────────┘
```

### AuthLayout (login / signup)
Single centred card, no sidebar, no navigation.

---

## 8. Error Handling

- **Form errors**: Shown inline below each field via React Hook Form's `formState.errors`
- **API errors**: Caught in the mutation's `onError` callback, displayed as a toast notification
- **401 Unauthorized**: Handled by Axios interceptor — clears token, redirects to `/login`
- **403 Forbidden**: Shown as an inline "You don't have permission" message
- **Network error**: Toast with "Could not connect to the server. Check your connection."

---

## 9. Environment Variables

All env vars are prefixed `VITE_` (Vite convention — they are inlined at build time):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `http://localhost:3000` (dev) / `https://api.crm.example.com` (prod) |

---

## 10. Code Conventions

| Rule | Detail |
|------|--------|
| Components | PascalCase, one component per file |
| Hooks | camelCase, prefixed `use` |
| API functions | camelCase verbs: `getContacts`, `createContact`, `updateContact`, `deleteContact` |
| Zod schemas | camelCase, suffixed `Schema`: `createContactSchema` |
| Types | PascalCase, in `src/types/index.ts` for shared types |
| No barrel files | Import directly from the source file, not from index re-exports |
