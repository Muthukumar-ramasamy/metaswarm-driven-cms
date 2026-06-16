# Architecture Spec: System Context

> **Agent**: Architect Agent
> **Phase**: 3 — Architecture Specification
> **Input**: specs/product/prd.md
> **Status**: Draft
> **Created**: 2026-06-13

---

## 1. System Overview

A three-tier web application: a React SPA served as static files, a Fastify REST API running on Node.js, and a PostgreSQL database hosted on Neon. All three communicate over HTTPS. There are no microservices, no message queues, and no external integrations beyond SMTP in the MVP.

---

## 2. System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │          React SPA (Vite + TypeScript)              │  │
│   │                                                     │  │
│   │  TanStack Query ──► REST calls over HTTPS           │  │
│   └─────────────────────────────┬───────────────────────┘  │
└─────────────────────────────────┼───────────────────────────┘
                                  │ HTTPS / JSON
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      API SERVER                             │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │          Fastify + TypeScript (Node.js)             │  │
│   │                                                     │  │
│   │  Routes → Controllers → Services → Repositories    │  │
│   │  Zod validation │ JWT auth │ RBAC middleware        │  │
│   └──────────────────────────┬──────────────────────────┘  │
└─────────────────────────────┬┼───────────────────────────── │
                              ││
              SMTP (outbound) ││  Drizzle ORM / TLS
              (invites, reset)││
                              ▼▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │          Neon — PostgreSQL 16 (serverless)          │  │
│   │                                                     │  │
│   │  Connection pooling via Neon's built-in pooler      │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Frontend — React SPA

| Property | Value |
|----------|-------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Hosting | Static file host (Vercel / Netlify) |
| Entry point | `index.html` → `src/main.tsx` |
| Routing | React Router v6 (client-side) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| UI components | MUI (@mui/material v5) + Emotion |
| Auth token storage | `localStorage` (JWT access token) |

The SPA communicates exclusively with the API over HTTPS/JSON. It has no direct database access.

### 3.2 Backend — REST API

| Property | Value |
|----------|-------|
| Runtime | Node.js 20 LTS |
| Framework | Fastify v4 + TypeScript |
| Hosting | Node.js host (Railway / Render / Fly.io) |
| Port | 3000 (configurable via `PORT` env var) |
| ORM | Drizzle ORM |
| Validation | Zod (request schema validation) |
| Auth | JWT (jsonwebtoken) |
| Password hashing | bcrypt (12 rounds) |

The API is stateless. Every request must carry a valid JWT (except public auth endpoints). All responses use a standard envelope format (see Backend Spec).

### 3.3 Database — PostgreSQL on Neon

| Property | Value |
|----------|-------|
| Engine | PostgreSQL 16 |
| Host | Neon serverless (free tier) |
| Connection | Drizzle ORM via `@neondatabase/serverless` driver |
| Connection pooling | Neon's built-in HTTP pooler |
| Backups | Neon continuous backups (managed) |
| Schema migrations | Drizzle Kit (`drizzle-kit push` in dev, `drizzle-kit migrate` in CI) |

---

## 4. External Services (MVP)

| Service | Purpose | Provider | Required in MVP |
|---------|---------|----------|-----------------|
| SMTP | Password reset emails, team invitations | Any SMTP provider (Resend / SendGrid free tier) | Yes |
| Static host | Serve the React SPA | Vercel / Netlify | Yes |
| App host | Run the Fastify API | Railway / Render / Fly.io | Yes |
| Database | PostgreSQL | Neon | Yes |

No other external integrations exist in the MVP.

---

## 5. Environments

| Environment | Frontend URL | API URL | Database |
|-------------|-------------|---------|----------|
| Development | `http://localhost:5173` | `http://localhost:3000` | Neon dev branch |
| Production | `https://crm.example.com` | `https://api.crm.example.com` | Neon main branch |

---

## 6. Data Flow — Authenticated Request

```
1. User logs in → API returns JWT → frontend stores token in localStorage
2. Subsequent request:
   Browser → adds Authorization: Bearer <token> header
           → Fastify authenticate middleware verifies JWT
           → extracts { userId, organizationId, role } from token payload
           → passes context to controller
3. Controller → calls service → calls repository
4. Repository → ALL queries include WHERE organization_id = :organizationId
5. Response → wrapped in { data: ... } envelope → returned to browser
6. TanStack Query → caches response → updates React component
```

---

## 7. Key Architecture Decisions

| Decision | Choice | Rationale | ADR |
|----------|--------|-----------|-----|
| Backend framework | Fastify over Express | Better TypeScript support, schema-first, faster | ADR-001 |
| ORM | Drizzle over Prisma | Lightweight, SQL-close, no code generation overhead | ADR-002 |
| Auth storage | localStorage | Simple for MVP; httpOnly cookie + refresh token post-MVP | ADR-003 |
| Multi-tenancy | Row-level via organization_id | Simple, no schema-per-tenant complexity | ADR-004 |
| Deployment | Separate static + API hosts | Decoupled scaling; standard for SPA + REST | — |

Full ADRs are in `docs/adr/`.

---

## 8. Non-Functional Requirements (MVP)

| Property | Target |
|----------|--------|
| API response time (p95) | < 500ms |
| Concurrent users | 10–50 (small team) |
| Uptime | Best-effort (no SLA for personal project) |
| Data retention | All data retained indefinitely (soft delete) |
| Browser support | Chrome, Firefox, Safari (last 2 major versions) |
