# Documentation Coverage Plan

This document is forward-looking only. It proposes how a **later** documentation/screenshot phase should handle the gaps identified in `workflow-inventory.md`. Nothing in this file has been executed — no screenshots, no PDFs, no Playwright automation. That work is explicitly out of scope for this session.

## How to handle each gap

### Stage transitions (mark won/lost, convert)
There is no dedicated "Mark Won", "Mark Lost", or "Convert" UI anywhere — both leads and opportunities use one generic stage-select dropdown. Recommendation: document this dropdown as the de facto mechanism for these outcomes. Screenshots should show the dropdown open with `won`/`lost` highlighted as the relevant choice, with a note explaining the real side effects that happen on the backend when these are selected (e.g. winning an opportunity auto-creates a customer record and pushes the linked lead to a matching stage) — these consequences are real and worth documenting even though the UI doesn't call them out specially.

### Main dashboard
`Dashboard.tsx` is hardcoded mock data in a different business domain (real estate) from this CRM's actual model. **This needs a product decision before any dashboard screenshot is taken** — pick one:
- (a) Fix the dashboard to show real, API-backed CRM metrics (lead counts by stage, pipeline value, this-period revenue, etc.), matching the actual domain, then screenshot it normally; or
- (b) Leave it as-is and document it explicitly as a known placeholder, directing users instead to the two real analytics surfaces (`ForecastPanel`, embedded on the dashboard, and the standalone `AttributionPage`) for genuine KPIs.

Do not screenshot the current mock dashboard and present it as real functionality — that would misrepresent the product.

### Export (leads.csv, revenue-records.csv)
Both endpoints exist and work on the backend but have no frontend button. Recommendation: document these as API capabilities in a developer/integration reference (e.g. "the backend exposes a CSV export endpoint for leads and revenue records, reachable at `GET /exports/leads.csv` with the appropriate bearer token and `leads.export`/`revenue.export` permission") rather than as an end-user walkthrough step, since there is currently no button to click.

### Lead assignment
The assign endpoint exists; the Smart Assignment panel shows ranked suggestions but isn't wired to act on them. Recommendation: same treatment as export — document the AI suggestion panel as a real, working read-only feature ("the system recommends which rep should take this lead, based on score, current load, and win rate"), and separately note that programmatic assignment via the API is possible even though no UI button currently exists for it.

### Bulk actions and import
Neither exists anywhere in the codebase — no checkboxes, no file upload, no bulk-action bar on any list page. Recommendation: do not attempt to document these. Flag them as a product backlog item for engineering, not a documentation gap to paper over.

## Suggested order for the later phase

1. Resolve the dashboard decision first (it blocks a meaningful set of screenshots for every role, since the dashboard is usually the first thing a new user sees).
2. Capture the stage-dropdown interaction once, well-annotated, and reuse the same explanation for both leads and opportunities rather than duplicating screenshots.
3. Treat export/assign as API reference material, not user walkthrough steps.
4. Skip bulk actions and import entirely until they're built.
