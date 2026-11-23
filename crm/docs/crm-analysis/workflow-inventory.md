# Workflow Inventory

Maps the "potential workflows" from the original documentation brief to what actually exists in this codebase today. This is a discovery checklist, not a feature wishlist — status reflects the real frontend + backend as of this analysis. Gaps are stated plainly so a later documentation pass doesn't describe features that don't exist.

**Status legend**: `exists-as-designed` (fully built and wired end to end) · `exists-but-partial` (backend and/or partial frontend exists but the workflow isn't a complete, dedicated UI action) · `does-not-exist` (no code for this at all).

## Authentication

| Workflow | Status | Notes |
|---|---|---|
| Login | exists-as-designed | `/login` → `POST /auth/login`. |
| Logout | exists-as-designed | Client-side token clear (stateless JWT, no server session to invalidate). |
| Forgot password | exists-as-designed | `/forgot-password` page present. |
| Update profile | — | Not separately inventoried in this pass. |
| Multi-factor authentication | does-not-exist | No MFA/2FA anywhere in the backend. |

## Lead management

| Workflow | Status | Notes |
|---|---|---|
| View / create / edit lead | exists-as-designed | `/leads`, `/leads/new`, `/leads/:id`. No dedicated lead-edit route — `LeadDetail.tsx` handles updates inline. |
| Change lead stage | exists-as-designed | Generic stage-select dropdown + "Update stage" button on `LeadDetail.tsx`, backed by `PATCH /leads/:id/stage`. |
| **Mark lead Won / Lost** | **exists-but-partial** | No dedicated "Mark Won"/"Mark Lost" button. `won` and `lost` are simply two of the ten selectable values in the same generic stage dropdown. |
| Assign lead | **exists-but-partial** | `POST /leads/:id/assign` exists on the backend but is **never called from the frontend**. `LeadDetail.tsx` shows an AI "Smart Assignment" panel with ranked rep suggestions, but it is read-only display — clicking a suggestion does not assign the lead. |
| Qualify lead | exists-as-designed | `POST /leads/:id/qualify`, auto-advances stage when score crosses threshold. |
| Add activity/note | exists-as-designed | `/leads/:id/activities`. |
| Filter / search leads | exists-as-designed | Stage, priority, and text search filters on `/leads`. |
| **Export leads** | **exists-but-partial** | `GET /exports/leads.csv` exists on the backend; no Export button exists anywhere in the frontend. Unreachable via the UI. |
| **Import leads** | **does-not-exist** | No file upload, no import endpoint, anywhere. |
| **Bulk lead actions** | **does-not-exist** | No row selection/checkboxes on the leads list; every action is single-row. |
| **Convert lead to opportunity** | **does-not-exist** | No "Convert" button, no conversion endpoint. Leads and opportunities are created entirely independently — an opportunity's optional `leadId` can link them, but there is no guided conversion workflow. |

## Deal / pipeline management

| Workflow | Status | Notes |
|---|---|---|
| Create / view opportunity | exists-as-designed | `/opportunities`, `/opportunities/new`, `/opportunities/:id`. No dedicated edit route — handled inline on the detail page. |
| Move opportunity through pipeline | exists-as-designed | Generic stage-select dropdown + "Update stage" button, same pattern as leads; backend enforces forward-only movement and blocks edits once terminal (won/lost). |
| **Mark deal Won / Lost** | **exists-but-partial** | Same as leads — no dedicated button; `won`/`lost` are stage-dropdown options. The backend state machine does real work on these transitions (sets `wonValue`/`lostReason`, creates a customer record on win, pushes the linked lead to a matching stage) even though the UI doesn't call it out specially. |
| View pipeline statistics | exists-as-designed | `/analytics/attribution` and the embedded `ForecastPanel` on the dashboard. |
| Generate AI proposal | exists-as-designed | "Generate proposal" action on `OpportunityDetail.tsx`. |

## Task management

| Workflow | Status | Notes |
|---|---|---|
| Create follow-up task | exists-as-designed | `/follow-ups/new`. |
| Complete task | exists-as-designed | Single-row "Complete" button on `/follow-ups`. |
| View overdue tasks | exists-as-designed | Supported via the task list and its `dueAt`/`status` fields. |
| **Bulk task actions** | **does-not-exist** | No bulk actions anywhere in the app. |

## Campaigns

| Workflow | Status | Notes |
|---|---|---|
| Create / view campaign | exists-as-designed | `/campaigns`, `/campaigns/new`, `/campaigns/:id`. |
| Record ad spend | exists-as-designed | Inline "Record cost" form on `CampaignDetail.tsx`. |
| View campaign/channel attribution | exists-as-designed | `/analytics/attribution`, tabbed Channels/Campaigns tables. |

## Revenue and analytics

| Workflow | Status | Notes |
|---|---|---|
| View revenue records | exists-as-designed | `/revenue`, `/revenue/new`. No detail/edit route. |
| View AI revenue forecast | exists-as-designed | `ForecastPanel.tsx`, embedded on the dashboard, manually triggered, real API call. |
| View attribution analytics | exists-as-designed | `AttributionPage.tsx` — the only dedicated analytics route beyond the dashboard. |
| **Export revenue reports** | **exists-but-partial** | `GET /exports/revenue-records.csv` exists on the backend; no Export button in the frontend. |
| **Main dashboard (KPIs, pipeline overview, agenda)** | **does-not-exist as real data** | `Dashboard.tsx` is **entirely hardcoded mock data** using mismatched real-estate terminology ("Active Leads" sparkline, "Pending Volume", "Avg Days on Market", "GCI · Year to Date" commission figure, a kanban "Pipeline" with stages "Qualified / Touring / Under offer / Closing" that do not correspond to this app's actual `LEAD_STAGES`/`OPPORTUNITY_STAGES`, a "Today's agenda" of home showings/inspections, and a "2026 goal" donut chart). None of it reads from the API. The only real, API-backed element on this page is the embedded `ForecastPanel`. |

## Administration

| Workflow | Status | Notes |
|---|---|---|
| Create/modify users, assign roles | exists-as-designed | `/users`, `/users/new`, `/users/:id`, `/users/:id/edit`. |
| Manage permissions (RBAC) | exists-as-designed | `/settings/rbac`. |
| Manage role labels/descriptions | exists-as-designed | `/settings/user-roles`. |
| Manage dropdown options (lead sources, budget ranges, currencies, etc.) | exists-as-designed | `/settings/general`. |
| Configure LLM/AI provider | exists-as-designed | `/settings/llm`. |
| Review security/access logs | exists-as-designed | `/settings/security` (built this session). |
| **Bulk/import tooling** | **does-not-exist** | No admin-facing import tooling anywhere. |

## Navigation gap (not a missing feature, but worth noting)

`/users`, `/settings/llm`, `/settings/user-roles`, `/settings/rbac`, `/settings/general`, and `/settings/security` are all real, working routes, but **none of them appear in the top-level navigation** (`navConfig.ts`) except the single `/settings` hub link — which itself is further restricted to the `super_admin` *role* (not just the `users.manage` *permission* the routes themselves check). They're reachable only via links inside `SettingsHome.tsx` or by typing the URL directly.
