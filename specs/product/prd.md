# Product Requirements Document — CRM MVP

> **Agent**: Product Agent
> **Phase**: 2 — MVP Definition
> **Input**: specs/product/crm-domain-analysis.md
> **Status**: Draft
> **Created**: 2026-06-13

---

## 1. Executive Summary

We are building a lightweight, activity-based CRM for small-to-medium sales teams — modelled on Pipedrive's core workflow. The product gives sales reps a single place to manage contacts, companies, leads, and deals, while giving managers visibility into pipeline health and team activity.

**Core value proposition:** A sales rep opens the app in the morning, sees exactly what they need to do today (tasks, follow-ups, open deals), takes action, and logs it — all without switching tools.

**MVP scope:** 8 modules covering the full sales cycle from lead capture to deal closure. No email sync, no automations, no integrations — those are post-MVP. The MVP must be usable by a real 5-person sales team on day one.

**MVP decisions locked:**
- Single pipeline with customisable stages
- Contact email is optional
- USD only (no multi-currency)
- Leads Inbox is a list view (no Kanban)
- Flat roles: Admin, Manager, Sales Rep (no sub-teams)

---

## 2. User Personas

### Persona 1 — Alex (Admin)
- **Role**: Sales Operations Manager / CRM Admin
- **Goal**: Set up the workspace, onboard the team, keep data clean, and have full visibility into everything
- **Pain points**: Reps not logging activities, duplicate contacts, no clear pipeline definition
- **How they use the CRM**: Configures pipelines and stages, invites team members, assigns roles, reviews all reports, cleans up bad data

### Persona 2 — Jordan (Manager)
- **Role**: Sales Team Lead
- **Goal**: See how the team's pipeline is performing and coach reps on stuck deals
- **Pain points**: Not knowing which deals are at risk, not knowing which reps are most active
- **How they use the CRM**: Reviews pipeline board, checks deal stage history, reads activity logs, reassigns deals when reps leave

### Persona 3 — Sam (Sales Rep)
- **Role**: Account Executive / Business Development Rep
- **Goal**: Close deals. Spend as little time in the CRM as possible while keeping records up to date
- **Pain points**: CRM is too slow, too many required fields, can't find contacts quickly
- **How they use the CRM**: Logs calls and meetings, moves deals through stages, schedules follow-up tasks, looks up contact info

---

## 3. Module List

| # | Module | Priority | Phase |
|---|--------|----------|-------|
| 1 | Auth & User Management | P0 | MVP |
| 2 | Contact Management | P0 | MVP |
| 3 | Company Management | P0 | MVP |
| 4 | Lead Management | P0 | MVP |
| 5 | Deal & Pipeline Management | P0 | MVP |
| 6 | Activity & Task Tracking | P0 | MVP |
| 7 | Notes | P1 | MVP |
| 8 | Basic Reports | P1 | MVP |

---

## 4. Module Specifications

---

### Module 1: Auth & User Management

#### Business Goal
Allow team members to sign up, log in, and be assigned the right role. The Admin must be able to invite and manage the team. Every record in the system must be tied to the user who created it.

#### User Stories

**US-1.1 — Sign up**
As an Admin, I want to create a workspace for my organisation so that my team has a private CRM instance.

**US-1.2 — Invite team member**
As an Admin, I want to invite a team member by email so that they can access the CRM with the correct role.

**US-1.3 — Log in**
As any user, I want to log in with my email and password so that I can access my workspace securely.

**US-1.4 — Log out**
As any user, I want to log out so that my session is closed on shared devices.

**US-1.5 — Change password**
As any user, I want to change my password so that I can keep my account secure.

**US-1.6 — Reset forgotten password**
As any user, I want to reset my password via email so that I can regain access if I forget it.

**US-1.7 — Manage team members**
As an Admin, I want to deactivate a user so that a former team member can no longer access the CRM.

**US-1.8 — Change role**
As an Admin, I want to change a user's role so that their permissions match their current responsibilities.

#### Acceptance Criteria

**AC-1.1 — Workspace creation**
Given a valid email and password,
When a new user signs up,
Then an organisation record is created, the user is created as Admin, and a JWT is returned.

**AC-1.2 — Duplicate email**
Given a user already exists with an email,
When another user attempts to sign up with the same email in the same org,
Then the system returns a 409 error with message "A user with this email already exists."

**AC-1.3 — Team invite**
Given an Admin sends an invite to an email address with a role,
When the invited user accepts the invite and sets a password,
Then their account is created with the specified role and linked to the Admin's organisation.

**AC-1.4 — Login with valid credentials**
Given a user exists with a verified email and password,
When they submit correct credentials,
Then a JWT access token is returned and the user is logged in.

**AC-1.5 — Login with invalid credentials**
Given a user attempts to log in,
When the email or password is incorrect,
Then the system returns 401 with message "Invalid email or password."

**AC-1.6 — Deactivated user cannot log in**
Given an Admin has deactivated a user,
When the deactivated user attempts to log in,
Then the system returns 403 with message "Your account has been deactivated."

**AC-1.7 — Password reset**
Given a user requests a password reset,
When they submit a valid reset token and new password,
Then their password is updated and all existing sessions are invalidated.

#### Business Rules
- **BR-1.1**: Every organisation must have at least one Admin at all times.
- **BR-1.2**: An Admin cannot deactivate themselves if they are the last Admin.
- **BR-1.3**: Invite links expire after 72 hours.
- **BR-1.4**: Passwords must be at least 8 characters.

#### Out of Scope (MVP)
- SSO / OAuth (Google, Microsoft)
- Two-factor authentication
- Session management UI (view active sessions)
- Audit log of user actions

---

### Module 2: Contact Management

#### Business Goal
Give sales reps a searchable record of every person they sell to. A contact is the individual — the human — in every deal and conversation.

#### User Stories

**US-2.1 — Create contact**
As a Sales Rep, I want to create a contact record so that I have a permanent record of a person I'm selling to.

**US-2.2 — View contact list**
As a Sales Rep, I want to see a list of all contacts I own so that I can find who I need to follow up with.

**US-2.3 — Search contacts**
As a Sales Rep, I want to search contacts by name, email, or phone so that I can find a record quickly.

**US-2.4 — View contact detail**
As a Sales Rep, I want to open a contact and see all their associated deals, activities, and notes so that I have the full relationship history before a call.

**US-2.5 — Edit contact**
As a Sales Rep, I want to update a contact's details so that the record stays accurate.

**US-2.6 — Link contact to company**
As a Sales Rep, I want to link a contact to a company so that I can see all the people at a given account.

**US-2.7 — Delete contact**
As an Admin, I want to delete a contact so that I can remove records created by mistake.

**US-2.8 — Reassign contact owner**
As a Manager, I want to reassign a contact to a different rep so that accounts are covered when team members change.

#### Acceptance Criteria

**AC-2.1 — Create contact with name only**
Given a Sales Rep submits a contact with first name and last name,
When the form is submitted,
Then the contact is created and linked to the rep's organisation and user ID.

**AC-2.2 — Duplicate email check**
Given a contact with a given email already exists in the organisation,
When a new contact is created with the same email,
Then the system returns 409 with message "A contact with this email already exists."

**AC-2.3 — Contact list scoped to org**
Given a logged-in Sales Rep,
When they view the contact list,
Then they see only contacts belonging to their organisation.

**AC-2.4 — Contact list for Sales Rep shows own contacts**
Given a Sales Rep with role sales_rep,
When they view the contact list,
Then they see only contacts where owner_id = their user ID.

**AC-2.5 — Contact list for Manager shows all contacts**
Given a user with role manager or admin,
When they view the contact list,
Then they see all contacts in the organisation.

**AC-2.6 — Search by name**
Given contacts exist in the organisation,
When a user searches by partial name (e.g. "joh"),
Then all contacts whose first or last name contains that string are returned.

**AC-2.7 — Soft delete**
Given an Admin deletes a contact,
When the contact is retrieved,
Then it does not appear in list results, but the record exists with deleted_at set.

#### Business Rules
- **BR-2.1**: A contact's email, if provided, must be unique within the organisation.
- **BR-2.2**: A contact cannot be permanently deleted — only soft-deleted.
- **BR-2.3**: A Sales Rep can only edit contacts they own; Managers and Admins can edit any.

#### Out of Scope (MVP)
- Contact merge (deduplication)
- Custom fields on contacts
- Contact import (CSV)
- Email history sync
- Contact scoring

---

### Module 3: Company Management

#### Business Goal
Track the organisations that contacts work for and that deals are being sold into. Companies give context that a single contact record cannot — company size, industry, and all the people inside the account.

#### User Stories

**US-3.1 — Create company**
As a Sales Rep, I want to create a company record so that I can group related contacts and deals under one account.

**US-3.2 — View company list**
As a Sales Rep, I want to see a list of companies so that I can navigate to any account quickly.

**US-3.3 — View company detail**
As a Sales Rep, I want to open a company and see all its contacts, deals, and activities so that I have full account context.

**US-3.4 — Edit company**
As a Sales Rep, I want to update a company's details so that the information stays current.

**US-3.5 — Delete company**
As an Admin, I want to delete a company so that I can remove test or duplicate records.

#### Acceptance Criteria

**AC-3.1 — Create company**
Given a Sales Rep submits a company with a name,
When the form is submitted,
Then the company is created and linked to the rep's organisation.

**AC-3.2 — Company list scoped to org**
Given a logged-in user,
When they view the company list,
Then they see only companies belonging to their organisation.

**AC-3.3 — Soft delete**
Given an Admin deletes a company,
Then the company does not appear in list results, but the record is retained with deleted_at set.

**AC-3.4 — Contacts remain after company deletion**
Given a company with linked contacts is deleted,
When the contacts are retrieved,
Then they still exist; their company_id is set to null.

#### Business Rules
- **BR-3.1**: Company name must be unique within an organisation.
- **BR-3.2**: Deleting a company does not delete its contacts — it only unlinks them.
- **BR-3.3**: A Sales Rep can only edit companies they own; Managers and Admins can edit any.

#### Out of Scope (MVP)
- Company hierarchy (parent/subsidiary)
- Company enrichment (auto-fill from domain)
- Custom fields on companies

---

### Module 4: Lead Management

#### Business Goal
Capture incoming prospects before they are qualified into a deal. The Leads Inbox is the first stop for every new opportunity — it keeps unqualified prospects out of the deal pipeline and gives reps a clear qualification queue.

#### User Stories

**US-4.1 — Create lead**
As a Sales Rep, I want to create a lead manually so that I can capture a new prospect immediately.

**US-4.2 — View leads inbox**
As a Sales Rep, I want to see all my open leads in a list so that I can work through my qualification queue.

**US-4.3 — Update lead status**
As a Sales Rep, I want to change a lead's status so that I can track where it is in the qualification process.

**US-4.4 — Convert lead to deal**
As a Sales Rep, I want to convert a qualified lead into a deal so that it enters the sales pipeline.

**US-4.5 — Disqualify lead**
As a Sales Rep, I want to disqualify a lead so that it is removed from my active queue without being deleted.

**US-4.6 — Filter leads**
As a Manager, I want to filter leads by owner and status so that I can see which reps have unworked leads.

#### Acceptance Criteria

**AC-4.1 — Create lead**
Given a Sales Rep submits a lead with a title,
When the form is submitted,
Then the lead is created with status = "new" and owner = the submitting rep.

**AC-4.2 — Leads list scoped to org**
Given a logged-in user,
When they view the leads list,
Then they see only leads belonging to their organisation.

**AC-4.3 — Sales Rep sees own leads**
Given a user with role sales_rep,
When they view the leads list,
Then they see only leads where owner_id = their user ID.

**AC-4.4 — Lead conversion creates deal**
Given a Sales Rep selects "Convert to Deal" on a lead,
When they confirm the conversion with a pipeline stage,
Then a deal is created with the lead's title and value, the lead's converted_at is set, and the lead status becomes "converted".

**AC-4.5 — Lead cannot be converted twice**
Given a lead with status = "converted",
When a user attempts to convert it again,
Then the system returns a 422 error with message "This lead has already been converted."

**AC-4.6 — Disqualify lead**
Given a Sales Rep sets a lead status to "disqualified",
When the leads inbox is viewed with default filters,
Then the disqualified lead does not appear.

#### Business Rules
- **BR-4.1**: A lead can only be converted once.
- **BR-4.2**: A converted lead record is never deleted — it is retained for audit.
- **BR-4.3**: A lead must have a title; all other fields are optional.
- **BR-4.4**: The Leads Inbox default view shows only status = "new" and "contacted".

#### Out of Scope (MVP)
- Web form / lead capture form (post-MVP)
- Lead import (CSV)
- Lead scoring
- Automatic lead assignment rules

---

### Module 5: Deal & Pipeline Management

#### Business Goal
The pipeline is the heart of the CRM. It gives sales reps and managers a visual, stage-by-stage view of every open opportunity, its value, and its expected close date. Deals are won or lost here.

#### User Stories

**US-5.1 — Create deal**
As a Sales Rep, I want to create a deal so that I can track a sales opportunity through the pipeline.

**US-5.2 — View pipeline board**
As a Sales Rep, I want to see all open deals on a Kanban board grouped by pipeline stage so that I can see the shape of my pipeline at a glance.

**US-5.3 — Move deal to next stage**
As a Sales Rep, I want to drag a deal to a different stage so that the pipeline reflects the deal's current progress.

**US-5.4 — View deal detail**
As a Sales Rep, I want to open a deal and see its contact, value, activities, notes, and stage history so that I have full context before a customer call.

**US-5.5 — Edit deal**
As a Sales Rep, I want to update a deal's value, expected close date, or stage so that the pipeline is always accurate.

**US-5.6 — Mark deal as won**
As a Sales Rep, I want to mark a deal as Won so that it is recorded as closed revenue.

**US-5.7 — Mark deal as lost**
As a Sales Rep, I want to mark a deal as Lost with a reason so that the team can learn from it.

**US-5.8 — Manage pipeline stages**
As an Admin, I want to add, rename, reorder, and delete pipeline stages so that the pipeline reflects our actual sales process.

**US-5.9 — Filter pipeline**
As a Manager, I want to filter the pipeline by owner so that I can see one rep's deals in isolation.

#### Acceptance Criteria

**AC-5.1 — Create deal**
Given a Sales Rep submits a deal with a title and a pipeline stage,
When the form is submitted,
Then the deal is created with status = "open" and entered into the selected stage.

**AC-5.2 — Pipeline board scoped to org**
Given a logged-in user,
When they view the pipeline board,
Then they see only deals belonging to their organisation.

**AC-5.3 — Sales Rep sees own deals**
Given a user with role sales_rep,
When they view the pipeline board,
Then they see only deals where owner_id = their user ID.

**AC-5.4 — Mark deal won**
Given a Sales Rep marks a deal as Won,
When confirmed,
Then the deal status = "won", won_at = current timestamp, and the deal no longer appears on the open pipeline board.

**AC-5.5 — Mark deal lost requires reason**
Given a Sales Rep attempts to mark a deal as Lost,
When they submit without a lost reason,
Then the system returns a validation error: "Lost reason is required."

**AC-5.6 — Stage deletion blocked by open deals**
Given a pipeline stage has open deals,
When an Admin attempts to delete the stage,
Then the system returns a 422 error: "Cannot delete a stage with open deals. Move or close them first."

**AC-5.7 — Stage history recorded**
Given a deal is moved from Stage A to Stage B,
When the deal detail is viewed,
Then the stage history shows the move with a timestamp and the user who moved it.

#### Business Rules
- **BR-5.1**: A deal must have a title and a pipeline stage.
- **BR-5.2**: A deal marked Lost must have a lost_reason.
- **BR-5.3**: Won and Lost deals are not shown on the open pipeline board.
- **BR-5.4**: A pipeline stage cannot be deleted if it has open deals.
- **BR-5.5**: There must always be at least one pipeline stage.
- **BR-5.6**: Deal value defaults to 0 if not provided.

#### Out of Scope (MVP)
- Multiple pipelines
- Deal products / line items
- Deal probability override
- Deal rotation / round-robin assignment
- Forecasting / weighted pipeline value

---

### Module 6: Activity & Task Tracking

#### Business Goal
Sales is activity-based. Reps win deals by doing the right things at the right times. Activities record what happened; tasks record what needs to happen. Together they give a complete picture of the relationship and ensure nothing falls through the cracks.

#### User Stories

**US-6.1 — Log an activity**
As a Sales Rep, I want to log a completed activity (call, email, meeting) against a deal or contact so that the interaction history is preserved.

**US-6.2 — Schedule a task**
As a Sales Rep, I want to create a future task with a due date so that I am reminded to follow up.

**US-6.3 — View my tasks**
As a Sales Rep, I want to see all my upcoming tasks in a single list so that I know exactly what to do today.

**US-6.4 — Mark task as done**
As a Sales Rep, I want to mark a task as done so that it is cleared from my task list.

**US-6.5 — View activity feed on a record**
As a Sales Rep, I want to see all activities linked to a deal or contact so that I have the full relationship history in one place.

**US-6.6 — View team activity**
As a Manager, I want to see all activities logged by my team so that I can assess who is most active.

#### Acceptance Criteria

**AC-6.1 — Log past activity**
Given a Sales Rep submits an activity with type, subject, and a linked record,
When the form is submitted,
Then the activity is created with done = true and done_at = the submitted or current timestamp.

**AC-6.2 — Schedule task**
Given a Sales Rep submits an activity with a due_date in the future,
When the form is submitted,
Then the activity is created with done = false.

**AC-6.3 — Activity must link to at least one record**
Given a Sales Rep submits an activity with no linked deal, contact, company, or lead,
When the form is submitted,
Then the system returns a validation error: "An activity must be linked to at least one record."

**AC-6.4 — My tasks list**
Given a logged-in Sales Rep,
When they view their task list,
Then they see only tasks where owner_id = their user ID and done = false, ordered by due_date ascending.

**AC-6.5 — Overdue tasks flagged**
Given a task has a due_date in the past and done = false,
When it appears in the task list,
Then it is visually marked as overdue.

**AC-6.6 — Mark task done**
Given a Sales Rep marks a task as done,
When confirmed,
Then done = true and done_at = current timestamp, and the task no longer appears in the open task list.

#### Business Rules
- **BR-6.1**: An activity must be linked to at least one of: deal, contact, company, or lead.
- **BR-6.2**: An activity with done = true cannot have its done_at changed after saving.
- **BR-6.3**: Activity type must be one of: call, email, meeting, demo, lunch, other.

#### Out of Scope (MVP)
- Calendar view for tasks
- Recurring tasks
- Email activities auto-logged from inbox sync
- Activity templates

---

### Module 7: Notes

#### Business Goal
Free-text context that doesn't fit a structured field. Notes are attached to deals, contacts, companies, or leads and give reps a place to capture meeting summaries, key insights, or reminders.

#### User Stories

**US-7.1 — Add a note**
As a Sales Rep, I want to add a note to a deal or contact so that I can capture context from a conversation.

**US-7.2 — Pin a note**
As a Sales Rep, I want to pin an important note to the top of a record so that critical information is always visible.

**US-7.3 — Edit a note**
As a Sales Rep, I want to edit a note I wrote so that I can correct mistakes.

**US-7.4 — Delete a note**
As a Sales Rep, I want to delete a note I wrote so that outdated information is removed.

#### Acceptance Criteria

**AC-7.1 — Create note**
Given a user submits a note with content and a linked record,
When the form is submitted,
Then the note is saved with author_id = the submitting user.

**AC-7.2 — Note must link to a record**
Given a user attempts to save a note with no linked record,
Then the system returns a validation error.

**AC-7.3 — Only author can edit/delete**
Given a note was created by User A,
When User B (not Admin) attempts to edit or delete it,
Then the system returns 403.

**AC-7.4 — Admin can delete any note**
Given an Admin attempts to delete a note they did not write,
When confirmed,
Then the note is soft-deleted.

#### Business Rules
- **BR-7.1**: Notes are soft-deleted — never hard-deleted.
- **BR-7.2**: Only the note's author or an Admin can edit or delete it.

#### Out of Scope (MVP)
- Note attachments (files)
- Note mentions (@user)
- Rich text editor beyond markdown

---

### Module 8: Basic Reports

#### Business Goal
Give managers and admins a high-level view of pipeline health, revenue, and team activity without requiring a BI tool. These reports answer the four questions every sales leader asks every Monday morning.

#### User Stories

**US-8.1 — Deals won/lost report**
As a Manager, I want to see how many deals were won and lost in a given period so that I can track team performance.

**US-8.2 — Pipeline value report**
As a Manager, I want to see the total value of open deals by stage so that I can forecast revenue.

**US-8.3 — Activity report**
As a Manager, I want to see the number of activities logged per rep in a given period so that I can identify the most and least active reps.

**US-8.4 — Leads by source report**
As an Admin, I want to see how many leads came from each source so that I can assess lead generation channels.

#### Acceptance Criteria

**AC-8.1 — Deals report filters**
Given a Manager views the deals report,
When they apply a date range filter,
Then only deals with won_at or lost_at within that range are shown.

**AC-8.2 — Pipeline value scoped to org**
Given a user views the pipeline value report,
Then only deals from their organisation are included.

**AC-8.3 — Activity report by rep**
Given a Manager views the activity report,
When they select a specific rep,
Then only activities where owner_id = that rep are counted.

**AC-8.4 — Reports accessible by role**
Given a Sales Rep views reports,
Then they see only their own data.
Given a Manager or Admin views reports,
Then they see all data for the organisation.

#### Business Rules
- **BR-8.1**: Reports are always scoped by organisation_id.
- **BR-8.2**: Sales Reps can only see their own data in reports.
- **BR-8.3**: Report data is read-only — no mutations via the reports module.

#### Out of Scope (MVP)
- Custom report builder
- Scheduled email reports
- Revenue forecasting
- Funnel / conversion rate charts
- CSV export of report data

---

## 5. Success Metrics

### Adoption
- A new team of 5 can sign up, invite all members, and have first data entered within 30 minutes
- A Sales Rep can log an activity in under 30 seconds

### Data completeness
- 100% of deals have an owner and a stage
- 100% of activities are linked to a record

### Pipeline health
- Managers can see total pipeline value by stage without clicking more than twice
- Deals with no activity in the last 7 days are surfaced as "stale"

### Framework validation
- Every module was implemented from an approved spec — zero "code first" exceptions
- Every acceptance criterion has a corresponding test case
- Code generation time (spec → working feature) is under 2 hours per module

---

## 6. Out of Scope — MVP

The following are explicitly excluded from the MVP build:

- Email sync (Gmail, Outlook)
- Calendar integration
- File attachments on any record
- Custom fields
- Multiple pipelines
- Workflow automations
- CSV import / export
- Public REST API
- Webhooks
- Mobile application
- Multi-currency
- Two-factor authentication
- SSO / OAuth
- AI features (lead scoring, smart suggestions, email drafting)

---

## 7. Related Specs

| Spec | Path | Status |
|------|------|--------|
| Domain analysis | `specs/product/crm-domain-analysis.md` | ✅ Complete |
| System architecture | `specs/architecture/system-context.md` | 🔲 Phase 3 |
| Frontend architecture | `specs/architecture/frontend.md` | 🔲 Phase 3 |
| Backend architecture | `specs/architecture/backend.md` | 🔲 Phase 3 |
| Security spec | `specs/architecture/security.md` | 🔲 Phase 3 |
| Database schema | `specs/database/schema.md` | 🔲 Phase 4 |
| API spec | `specs/api/openapi.yaml` | 🔲 Phase 5 |
