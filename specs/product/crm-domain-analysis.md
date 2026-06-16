# CRM Domain Analysis

> **Agent**: Product Agent
> **Phase**: 1 — Product Discovery
> **Reference**: Pipedrive (primary), HubSpot, Zoho CRM
> **Status**: Draft
> **Created**: 2026-06-13

---

## 1. What is a CRM?

A Customer Relationship Management (CRM) system is the central record of a company's sales activity. It stores every person, company, and conversation a sales team interacts with, and gives managers visibility into pipeline health and revenue forecasts.

Pipedrive's core philosophy: **activity-based selling**. Salespeople win more deals by focusing on the right actions at the right time. The CRM makes those actions visible and trackable.

---

## 2. Core Entities

### 2.1 Entity Overview

| Entity | Purpose | Pipedrive equivalent |
|--------|---------|---------------------|
| Organization | The tenant — the company using the CRM | Account / Company |
| User | A team member with a role | User |
| Contact | An individual person (prospect or customer) | Person |
| Company | A business or organisation the team sells to | Organization |
| Lead | An unqualified inbound prospect | Lead (Leads Inbox) |
| Deal | A qualified sales opportunity with a value | Deal |
| Pipeline | An ordered set of stages for a sales process | Pipeline |
| Pipeline Stage | A single step inside a pipeline | Stage |
| Activity | A logged action that already happened (call, email, meeting) | Activity |
| Task | A future to-do item assigned to a user | Activity (scheduled) |
| Note | Free-text context attached to any record | Note |
| Tag | Label for filtering and segmenting records | Label / Filter |

### 2.2 Entity Field Inventory

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | FK — tenant scope |
| email | string | unique per org |
| name | string | display name |
| role | enum | admin, manager, sales_rep |
| avatar_url | string | optional |
| is_active | boolean | deactivated users cannot login |
| last_login_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Contact (Person)
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| company_id | UUID | FK, optional |
| owner_id | UUID | FK → users |
| first_name | string | |
| last_name | string | |
| email | string | primary email |
| phone | string | primary phone |
| job_title | string | |
| linkedin_url | string | optional |
| status | enum | active, inactive |
| source | enum | manual, import, web_form, api |
| created_by | UUID | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Company
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| owner_id | UUID | FK → users |
| name | string | |
| domain | string | e.g. acme.com |
| industry | string | |
| employee_count | int | optional |
| annual_revenue | decimal | optional |
| country | string | |
| city | string | |
| address | string | |
| website | string | |
| created_by | UUID | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Lead
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| owner_id | UUID | FK → users |
| contact_id | UUID | FK → contacts, optional |
| company_id | UUID | FK → companies, optional |
| title | string | describes the opportunity |
| value | decimal | estimated deal value |
| currency | string | ISO 4217, default USD |
| status | enum | new, contacted, qualified, disqualified |
| source | enum | manual, web_form, import, api |
| expected_close_date | date | optional |
| converted_deal_id | UUID | FK → deals, set on conversion |
| converted_at | timestamp | |
| created_by | UUID | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Pipeline
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| name | string | e.g. "Sales Pipeline" |
| is_default | boolean | one pipeline is the default |
| order | int | display order |
| created_by | UUID | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Pipeline Stage
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| pipeline_id | UUID | FK → pipelines |
| name | string | e.g. "Proposal Sent" |
| order | int | position in pipeline |
| probability | int | 0–100, win probability % |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Deal
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| pipeline_id | UUID | FK → pipelines |
| stage_id | UUID | FK → pipeline_stages |
| owner_id | UUID | FK → users |
| contact_id | UUID | FK → contacts |
| company_id | UUID | FK → companies, optional |
| lead_id | UUID | FK → leads, if converted |
| title | string | |
| value | decimal | deal size |
| currency | string | ISO 4217 |
| status | enum | open, won, lost |
| lost_reason | string | required if status = lost |
| expected_close_date | date | |
| won_at | timestamp | |
| lost_at | timestamp | |
| created_by | UUID | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Activity
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| owner_id | UUID | FK → users |
| deal_id | UUID | FK → deals, optional |
| contact_id | UUID | FK → contacts, optional |
| company_id | UUID | FK → companies, optional |
| lead_id | UUID | FK → leads, optional |
| type | enum | call, email, meeting, demo, lunch, other |
| subject | string | |
| note | text | optional |
| outcome | string | optional — what happened |
| done | boolean | |
| done_at | timestamp | |
| due_date | date | for tasks (scheduled activities) |
| due_time | time | optional |
| duration_minutes | int | optional |
| created_by | UUID | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

#### Note
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| organization_id | UUID | tenant scope |
| author_id | UUID | FK → users |
| deal_id | UUID | optional |
| contact_id | UUID | optional |
| company_id | UUID | optional |
| lead_id | UUID | optional |
| content | text | markdown supported |
| is_pinned | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |
| deleted_at | timestamp | soft delete |

---

## 3. Core Workflows

### 3.1 Lead-to-Deal Conversion
```
Inbound lead arrives (web form / manual / import)
    ↓
Lead lands in Leads Inbox (status: new)
    ↓
Sales rep contacts the lead (activity logged)
    ↓
Lead is qualified — rep creates a Deal from the lead
    ↓
Lead marked converted, Deal created in default pipeline stage
    ↓
Deal moves through pipeline stages
    ↓
Deal marked Won or Lost
```

### 3.2 Deal Pipeline Management
```
Deal created (manually or from converted lead)
    ↓
Deal enters pipeline at a chosen stage
    ↓
Rep drags/moves deal to next stage (or loses it)
    ↓
Activities and notes logged against the deal
    ↓
Expected close date and value updated as info emerges
    ↓
Deal closed: Won (revenue recorded) or Lost (reason required)
```

### 3.3 Contact & Company Management
```
Contact created (manual, import, or from lead conversion)
    ↓
Optional: linked to a Company
    ↓
Activities, notes, and deals associated with the contact
    ↓
Contact record becomes the complete history of that relationship
```

### 3.4 Activity & Task Tracking
```
Rep schedules an activity (task) against a deal or contact
    ↓
Activity appears on rep's activity list and calendar view
    ↓
Rep completes the activity, marks it done, adds outcome
    ↓
Next activity scheduled (closing the loop)
```

---

## 4. User Roles & Permission Patterns

### 4.1 Role Definitions

| Role | Description |
|------|-------------|
| **Admin** | Full system access. Manages users, pipelines, settings, and integrations. Can see and edit all records regardless of owner. |
| **Manager** | Can see all records in their team. Can reassign deals and contacts. Cannot change system settings or manage billing. |
| **Sales Rep** | Can create and edit records they own. Limited visibility into other reps' data (configurable). Cannot manage users or system settings. |

### 4.2 Permission Matrix (default)

| Action | Admin | Manager | Sales Rep |
|--------|-------|---------|-----------|
| View any record | ✅ | ✅ | Own only |
| Create record | ✅ | ✅ | ✅ |
| Edit own record | ✅ | ✅ | ✅ |
| Edit any record | ✅ | ✅ | ❌ |
| Delete (soft) record | ✅ | ❌ | ❌ |
| Reassign owner | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Manage pipelines | ✅ | ❌ | ❌ |
| View all reports | ✅ | ✅ | Own only |
| Export data | ✅ | ✅ | ❌ |

### 4.3 Visibility model
- All records are scoped by `organization_id` (tenant isolation — a rep from Company A never sees Company B's data)
- Within an org, visibility is controlled by the `owner_id` and the user's role

---

## 5. MVP Feature Set

These are the minimum features to make the CRM usable for a real sales team.

### Module 1: Auth & User Management
- Sign up / login / logout
- JWT-based session
- Invite team members
- Role assignment (admin, manager, sales_rep)
- Password reset

### Module 2: Contact Management
- Create, view, edit, delete (soft) contacts
- Link contact to a company
- Filter and search contacts
- Contact detail view: info + deals + activities + notes

### Module 3: Company Management
- Create, view, edit, delete (soft) companies
- Company detail view: info + contacts + deals + activities
- Filter and search companies

### Module 4: Lead Management
- Leads inbox (Kanban or list view)
- Create leads manually
- Qualify / disqualify leads
- Convert lead to deal (creates deal + optionally contact + company)
- Filter by status, owner, date

### Module 5: Deal & Pipeline Management
- Default pipeline with customisable stages
- Deal board (Kanban by stage)
- Create, edit, move, close (won/lost) deals
- Deal detail view: info + activities + notes + stage history
- Lost reason capture

### Module 6: Activity & Task Tracking
- Log a past activity (call, email, meeting, demo)
- Schedule a future task with due date
- Mark activity as done
- Activity feed per deal / contact / company
- My tasks view (rep's upcoming to-dos)

### Module 7: Notes
- Add notes to any record (deal, contact, company, lead)
- Pin important notes
- Markdown rendering

### Module 8: Basic Reports
- Deals won/lost by period
- Pipeline value by stage
- Activity count by rep
- Leads by source

---

## 6. Post-MVP / Enterprise Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Email sync (Gmail / Outlook) | High | Two-way email sync per contact |
| Calendar integration | High | Google Calendar / Outlook |
| Custom fields | High | Per-entity custom field builder |
| Multiple pipelines | Medium | Different processes per product/team |
| Workflow automations | Medium | Trigger → condition → action rules |
| Web forms (lead capture) | Medium | Embeddable lead capture forms |
| Products / Catalog | Medium | Line items on deals |
| Quotes / Proposals | Medium | PDF generation |
| Goals & forecasting | Medium | Revenue targets by period |
| Team visibility settings | Medium | Fine-grained visibility per role |
| Data import / export | Medium | CSV import for contacts, deals |
| API access | High | Public REST API for integrations |
| Webhooks | High | Real-time event notifications |
| Mobile app | Post-MVP | iOS / Android |
| AI lead scoring | AI phase | Score leads by conversion likelihood |
| AI deal insights | AI phase | Suggest next best action |
| AI email drafting | AI phase | Draft follow-up from activity context |
| Conversation intelligence | AI phase | Call recording transcription + analysis |

---

## 7. Key Business Rules

1. A deal must always belong to a pipeline stage
2. A lead can only be converted once — re-conversion is not allowed
3. When a lead is converted to a deal, the original lead record is preserved (not deleted)
4. A deal marked "Lost" must have a lost reason
5. Only Admins can permanently delete records (soft delete only for all other roles)
6. Every activity must be linked to at least one record (deal, contact, lead, or company)
7. A user can only belong to one organization
8. Email addresses must be unique per organization for contacts and users
9. Pipeline stages within a pipeline must have unique names
10. Deleting a pipeline stage is only allowed if no open deals are in that stage

---

## 8. Integration Touchpoints (MVP boundaries)

| Integration | In MVP | Notes |
|-------------|--------|-------|
| Email (SMTP outbound) | ✅ | Password reset, invitations |
| File storage | ❌ | Post-MVP — attachments on records |
| Calendar sync | ❌ | Post-MVP |
| Zapier / webhooks | ❌ | Post-MVP |
| Public API | ❌ | Post-MVP |

---

## 9. Open Questions

| # | Question | Decision | Status |
|---|----------|----------|--------|
| 1 | Do we support multiple pipelines in MVP? | **Single pipeline only.** Multiple pipelines post-MVP. | ✅ Resolved |
| 2 | Is email address required for a contact, or optional? | **Optional.** Contacts can be created with name only. | ✅ Resolved |
| 3 | What currencies should be supported at launch? | **USD only.** Multi-currency post-MVP. | ✅ Resolved |
| 4 | Should the Leads Inbox be a Kanban board or list view in MVP? | **List view.** Kanban post-MVP. | ✅ Resolved |
| 5 | Do we support team/group structures within an org in MVP? | **Flat roles only.** Admin / Manager / Sales Rep. Teams post-MVP. | ✅ Resolved |
