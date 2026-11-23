# MASTER TASK: GENERATE CRM DEMONSTRATION DATA AND

# PROFESSIONAL ROLE-BASED USER HELP GUIDES (PDF)

You are a Senior Full-Stack Software Architect, QA Automation Engineer,
Technical Documentation Specialist, and Product Training Expert.

You are working inside an EXISTING Lead Management and CRM application.

Your responsibility is to analyze the actual application, create a
comprehensive demonstration dataset, execute and document supported
business workflows, capture authentic application screenshots, and
generate professional, screenshot-rich PDF user manuals.

The final documents must be suitable for:

- CRM administrators
- Sales managers
- Sales representatives
- Marketing team members
- Finance and reporting users
- Read-only users
- Any other roles actually implemented in the application
- New client onboarding and product demonstrations

IMPORTANT:
Do not assume the above roles exist.
Discover the actual roles and permissions from the codebase.

Do not invent features, pages, actions, or workflows.

============================================================
PHASE 1: ANALYZE THE EXISTING APPLICATION
============================================================

Before modifying anything, study the complete repository.

1. Identify the application architecture:
    - Frontend framework and routing
    - Backend framework and REST APIs
    - Database and ORM
    - Authentication implementation
    - Authorization and RBAC implementation
    - Business modules
    - Dashboard and reporting components
    - Deployment and environment configuration

2. Inspect:
    - Frontend pages and navigation
    - Backend routes and controllers
    - Database schemas and migrations
    - Role and permission definitions
    - Existing tests and fixtures
    - Existing seed scripts
    - Forms, validation, and workflow actions
    - Feature flags and tenant-level restrictions

3. Create a module inventory.

For every module, identify:

- Module name
- Purpose
- Available pages
- Supported actions
- Required permissions
- Relevant API endpoints
- Dependencies on other modules
- Current implementation status

4. Identify all user roles.

For every discovered role, establish:

- Accessible modules
- Create permissions
- Read permissions
- Update permissions
- Delete permissions
- Export permissions
- Approval permissions
- Administrative privileges
- Record ownership or visibility restrictions

5. Generate:
   docs/crm-analysis/module-inventory.md
   docs/crm-analysis/role-permission-matrix.md
   docs/crm-analysis/workflow-inventory.md
   docs/crm-analysis/documentation-coverage-plan.md

Do not proceed to screenshot generation until the actual
module inventory and role-permission matrix are established.

============================================================
PHASE 2: CREATE A SAFE DEMONSTRATION ENVIRONMENT
============================================================

The documentation must use REAL running application pages
with SYNTHETIC demonstration data.

Never use actual customer information.

Safety requirements:

1. Never seed, reset, truncate, or delete production data.
2. Never run destructive operations on an unidentified database.
3. Use a dedicated local, staging, or test database.
4. Verify environment and database identity before writing.
5. Stop if the application points to production infrastructure.
6. Use reserved example domains for synthetic email addresses.
7. Avoid sending real emails, SMS, WhatsApp messages,
   webhooks, or external notifications during documentation runs.
8. Disable paid external actions in demonstration mode.
9. Never expose tokens, API keys, passwords, or private data
   in screenshots or PDFs.
10. Ensure all generated demonstration records can be identified
    and cleaned up safely.

Use a deterministic seed identifier and fixed random seed.

The seeding process must be:

- Repeatable
- Idempotent
- Transaction-safe where practical
- Compatible with database constraints
- Compatible with multi-tenancy if implemented
- Independent of production data

Create environment preflight checks that fail closed.

============================================================
PHASE 3: GENERATE REALISTIC CRM DEMONSTRATION DATA
============================================================

The application must contain enough data for useful
screenshots, reports, dashboards, filtering, pagination,
search, charts, and end-to-end business demonstrations.

First inspect the actual database schema and relationships.

Generate only data supported by implemented models.

Use the following target dataset, adjusting quantities
where necessary for actual application constraints.

DEMONSTRATION DATA TARGETS:

Organizations / Companies: 40
Contacts / Decision Makers: 150
Leads: 500
Qualified Leads: 120
Opportunities / Deals: 100
Converted / Won Deals: 35
Lost Deals: 20
Sales Activities: 350
Follow-up Tasks: 200
Notes and Interaction Records: 300
Campaigns: 12
Lead Sources: 10
Products / Services: 15
Quotes / Proposals: 40
Invoices / Payments: 30
Revenue History: 12 months
Users: At least 2 per supported role

These are documentation targets, not mandatory tables.
Skip unsupported modules and explain omissions.

Populate realistic CRM examples.

LEAD SOURCES:

- Website enquiry
- Contact form
- LinkedIn
- Google Ads
- Organic search
- Referral
- Cold outreach
- Email campaign
- Trade show
- Partner channel

LEAD STATUS EXAMPLES:

- New
- Contacted
- In progress
- Qualified
- Unqualified
- Converted
- Lost

Use the actual status values and transitions
defined in the application, not invented enums.

OPPORTUNITY STAGES:
Use the actual pipeline stages from the application.

Include records that represent:

- Newly created leads
- High-priority leads
- Assigned and unassigned leads
- Leads requiring immediate action
- Overdue follow-ups
- Leads with recent activities
- Leads with no activities
- Qualified prospects
- Successful conversions
- Lost opportunities with reasons
- Deals close to expected closing dates
- High-value opportunities
- Low-value opportunities

BUSINESS DATA QUALITY:

Use realistic:

- Company names
- Contact names
- Job titles
- Industry sectors
- Cities and countries
- Phone formats
- Lead descriptions
- Opportunity values
- Expected closing dates
- Notes and follow-up messages

Never use real individual contact details.

Use diverse sectors such as:

- Technology
- Retail
- Healthcare
- Education
- Manufacturing
- Real estate
- Logistics
- Financial services
- Hospitality
- Professional services

FINANCIAL DATA:

If supported, create:

- Monthly revenue
- Quarterly revenue
- Sales forecasts
- Won revenue
- Lost opportunity value
- Pipeline value
- Revenue by salesperson
- Revenue by customer
- Revenue by industry
- Conversion trends

Ensure financial values are internally consistent.

Revenue should not be counted twice.
Respect the application's actual revenue-recognition
logic and currency configuration.

DATASET DESIGN:

Generate sufficient records for:

- Populated dashboard statistics
- Charts with meaningful variation
- Search results
- Multi-page tables
- Sorting and filters
- Status-based views
- Owner-based views
- Date-range filters
- Empty-state demonstrations where appropriate
- Pagination
- Bulk actions where implemented

Make the dataset visually credible for a
commercial SaaS CRM product demonstration.

============================================================
PHASE 4: CREATE TEST USERS FOR ALL DISCOVERED ROLES
============================================================

Identify all actual roles and permissions.

Create at least two test users per role where supported.

For each test user:

- Assign the correct role
- Assign appropriate ownership and team relationships
- Populate profile information
- Provide realistic permissions
- Ensure the login workflow works
- Ensure visible data reflects role restrictions

Do not grant permissions beyond those allowed by RBAC.

Store demonstration credentials in a restricted, local,
gitignored test fixture or environment file.

Never embed passwords in generated PDF manuals.

Verify that each role:

- Can log in
- Sees the correct dashboard
- Can access permitted modules
- Cannot access forbidden modules
- Sees correctly scoped records
- Has appropriate action buttons
- Has appropriate navigation menus

Produce a role-access verification report.

============================================================
PHASE 5: GENERATE A COMPLETE WORKFLOW CATALOG
============================================================

Map every implemented CRM feature to step-by-step user actions.

For each supported business workflow, document:

1. Business objective
2. Required user role
3. Required permission
4. Prerequisites
5. Navigation path
6. Step-by-step instructions
7. Fields to complete
8. Validation rules
9. Save / Submit behavior
10. Expected successful result
11. Resulting status or data changes
12. Common errors
13. Troubleshooting guidance

Potential workflows to inspect include:

AUTHENTICATION:

- Login
- Logout
- Forgot password
- Reset password
- Update profile
- Change password
- Multi-factor authentication, if implemented

DASHBOARD:

- Dashboard overview
- KPI interpretation
- Date-range selection
- Chart interpretation
- Dashboard filtering
- Personal versus team metrics

LEAD MANAGEMENT:

- View leads
- Create lead
- Edit lead
- Lead detail view
- Assign lead
- Change lead status
- Set priority
- Add notes
- Add activities
- Schedule follow-up
- Filter leads
- Search leads
- Import leads
- Export leads
- Bulk lead actions
- Convert lead

CONTACT MANAGEMENT:

- Create contact
- Update contact
- Link contact to organization
- Contact history

DEAL / PIPELINE MANAGEMENT:

- Create opportunity
- Assign opportunity
- Move opportunity through pipeline
- Update deal amount
- Set closing date
- Mark deal won
- Mark deal lost
- View pipeline statistics

TASK MANAGEMENT:

- Create task
- Assign task
- Set priority
- Set due date
- Complete task
- View overdue tasks

COMMUNICATION:

- Record calls
- Record meetings
- Add follow-up notes
- Send emails, if implemented
- View communication history
- Use email templates, if implemented

CAMPAIGNS:

- Create campaign
- Associate leads
- View campaign statistics
- Track campaign conversion

REVENUE AND ANALYTICS:

- View revenue dashboard
- Interpret revenue KPIs
- View sales forecast
- Filter by date
- Compare sales performance
- View individual/team revenue
- Export reports

ADMINISTRATION:

- Create users
- Modify users
- Assign roles
- Manage permissions
- Manage team relationships
- Manage lead sources
- Configure pipelines
- Configure settings
- Review audit logs

Use this catalog as a discovery checklist only.

Document ONLY features that actually exist.

============================================================
PHASE 6: AUTOMATE SCREENSHOT CAPTURE
============================================================

Use Playwright where compatible with the application.

Install missing development dependencies only when needed.

Run the application in its actual browser environment.

Do not fabricate application screenshots.

Every screenshot must come from a real,
successfully loaded application page.

Recommended capture viewport:

- Desktop: 1440 x 900
- Mobile: 390 x 844 where responsive documentation is relevant

For each user role:

1. Log in with the corresponding test account.
2. Open the appropriate dashboard.
3. Navigate to each permitted module.
4. Capture populated list pages.
5. Capture detail pages.
6. Capture create/edit forms.
7. Execute supported actions.
8. Capture successful results.
9. Capture significant validations and errors.
10. Capture reports and charts, where permitted.

For each important workflow, capture:

SCREENSHOT A:
Navigation or module entry point.

SCREENSHOT B:
Relevant list or dashboard.

SCREENSHOT C:
Create/edit/detail form.

SCREENSHOT D:
Completed form or action.

SCREENSHOT E:
Success state or updated record.

Capture only screenshots that add instructional value.
Avoid redundant images.

SCREENSHOT QUALITY:

- Wait for API calls and loading states to settle.
- Ensure charts and tables render completely.
- Avoid browser error pages.
- Avoid empty data caused by failed API calls.
- Avoid excessive whitespace.
- Avoid obstructing modal dialogs.
- Avoid cursor or tooltip obstruction.
- Capture full-page screenshots only where appropriate.
- Use high-resolution screenshots.
- Use relevant demonstration records.

Annotate screenshots where useful:

- Numbered callouts
- Highlight boxes
- Arrows
- Field references
- Button references

Maintain consistent annotation styling.

Ensure all text and UI labels remain legible.

For every screenshot, record:

- Screenshot filename
- Role
- Module
- Workflow
- Step number
- Page URL or route
- Capture timestamp
- Associated documentation section

Use deterministic names, for example:

docs/assets/screenshots/admin/dashboard.png
docs/assets/screenshots/admin/create-user.png
docs/assets/screenshots/sales/create-lead.png
docs/assets/screenshots/sales/lead-details.png

Adapt folder names to actual roles.

============================================================
PHASE 7: GENERATE ROLE-SPECIFIC USER MANUALS
============================================================

Generate one comprehensive manual for EACH actual role.

The content must reflect that role's real access.

Do not show administrator-only functionality
inside ordinary user manuals.

Each role-specific manual must include:

COVER PAGE

- CRM product name
- Product logo if available
- User role
- "User Help Guide"
- Version number
- Generation date

DOCUMENT INFORMATION

- Intended audience
- Application version
- Document version
- Environment used for screenshots

TABLE OF CONTENTS

- Clickable entries
- Hierarchical sections
- Correct page references where supported

SECTION 1: INTRODUCTION

- Purpose of the CRM
- Role responsibilities
- Available features
- Typical daily workflow

SECTION 2: GETTING STARTED

- Application URL placeholder or configured public URL
- Login procedure
- Dashboard overview
- Navigation explanation
- User profile settings

SECTION 3: MODULE-BY-MODULE HELP

For each accessible module:

- Purpose
- Page overview
- Explanation of visible elements
- Relevant screenshots
- Available operations
- Detailed procedures
- Important field descriptions

SECTION 4: STEP-BY-STEP BUSINESS WORKFLOWS

For each supported workflow:

- Workflow title
- Objective
- Prerequisites
- Numbered instructions
- Actual screenshots
- Expected result
- Common mistakes

SECTION 5: DASHBOARDS AND REPORTS

Explain:

- KPI definitions
- Chart descriptions
- Filters
- Report interpretation
- Export options
- Common reporting limitations

SECTION 6: FREQUENTLY ASKED QUESTIONS

Generate questions based on actual application behavior.

SECTION 7: TROUBLESHOOTING

Examples:

- Login failure
- Permission denied
- Record not appearing
- Validation failure
- Incorrect filter selection
- Missing required information
- Export failure
- Data access restriction

SECTION 8: GLOSSARY

Explain business terms such as:

- Lead
- Prospect
- Qualified Lead
- Opportunity
- Pipeline
- Forecast
- Conversion
- Revenue
- Follow-up
- Task
- Lead Source

Only define terms relevant to the application.

SECTION 9: SUPPORT

Include configured support contact information
only when it exists in the application settings.

Never invent support email addresses or phone numbers.

============================================================
PHASE 8: GENERATE MASTER CRM USER MANUAL
============================================================

Generate a separate MASTER USER MANUAL.

This manual must consolidate the application documentation
into a single professionally organized reference.

Include:

1. Product overview
2. Getting started
3. Complete module overview
4. Role and permission matrix
5. Explanation of navigation
6. Lead lifecycle
7. Sales pipeline lifecycle
8. Task and activity management
9. Communication management
10. Reporting and analytics
11. Administrative configuration
12. Role-specific workflows
13. Data import/export procedures
14. Troubleshooting
15. Frequently asked questions
16. Glossary
17. Documentation version information

Include clear labels identifying which roles are
authorized to perform each documented procedure.

Do not suggest that all roles have all permissions.

============================================================
PHASE 9: GENERATE QUICK START GUIDES
============================================================

Generate a short Quick Start PDF for every actual role.

Suggested contents:

- Login
- Dashboard orientation
- Main navigation
- Five most important daily tasks
- Important action buttons
- Common mistakes
- Help and support information

Target approximately 3-8 pages per Quick Start Guide,
depending on the role's actual functionality.

============================================================
PHASE 10: PROFESSIONAL PDF DESIGN
============================================================

Create polished documentation suitable for
commercial SaaS customer onboarding.

Design requirements:

PAGE:

- A4 portrait
- Consistent margins
- Readable typography
- Consistent section spacing
- Page numbers
- Headers and footers

BRANDING:

- Use application logo when available
- Use existing product branding
- Use the application's established color palette
- Do not invent branding assets

TYPOGRAPHY:

- Clear heading hierarchy
- Professional body font
- Readable captions
- Consistent list and table styling

SCREENSHOTS:

- High resolution
- Correct aspect ratio
- No stretching
- No clipping
- Consistent borders
- Descriptive figure captions
- Numbered references

LAYOUT:

- Well-spaced sections
- Page-break control
- No orphaned headings
- No cut-off tables
- No empty unnecessary pages
- No text overlapping screenshots

DOCUMENT NAVIGATION:

- Clickable table of contents
- PDF bookmarks where supported
- Hyperlinked cross-references
- Searchable/selectable text

Prefer maintainable HTML/CSS or another reliable
document-source workflow, then render to PDF.

Use Playwright PDF, a compatible PDF library, or an
existing documentation generator as appropriate.

Keep all documentation source files in the repository.

Do not flatten entire manual pages into images.

============================================================
PHASE 11: DOCUMENTATION ACCURACY AND QA
============================================================

Validate the documentation against the running CRM.

For every documented procedure:

1. Confirm that the feature exists.
2. Confirm the role has access.
3. Confirm navigation is correct.
4. Confirm button and field labels match the UI.
5. Confirm the workflow completes successfully.
6. Confirm the displayed result is accurate.
7. Confirm screenshots correspond to the instructions.
8. Confirm sensitive data is absent.
9. Confirm the content matches the application version.

Create automated tests where practical.

Create a traceability matrix mapping:

Role -> Module -> Permission -> Workflow ->
Test -> Screenshot -> PDF Section.

No workflow should be marked documented unless:

- Its instructions have been verified.
- Its screenshots are valid.
- Its applicable permissions are confirmed.

Inspect every generated PDF programmatically.

Verify:

- File opens successfully
- Correct page size
- Nonempty pages
- Extractable text
- Valid embedded screenshots
- No missing image references
- No clipped content
- No overlapping text
- No broken characters
- Correct page numbering
- Correct role labeling
- Working internal navigation where supported

Render the PDF pages to images and visually review
cover pages, complex tables, screenshot-heavy sections,
and any pages flagged by automated layout checks.

Do not falsely mark QA as passed.

============================================================
PHASE 12: AUTOMATE DOCUMENTATION REGENERATION
============================================================

Provide repeatable development commands.

Create appropriate scripts such as:

docs:seed
docs:seed:verify
docs:capture
docs:build
docs:verify
docs:all
docs:cleanup

These are suggested script names.
Adapt to the existing package manager and repository layout.

docs:all should:

1. Validate the test environment.
2. Verify and seed demonstration data.
3. Start or connect to the test application.
4. Run role-access verification.
5. Execute documentation workflows.
6. Capture fresh screenshots.
7. Generate role-specific manuals.
8. Generate the master manual.
9. Generate Quick Start Guides.
10. Validate the generated PDFs.
11. Produce a final generation report.

The process should be deterministic and repeatable.

If a step fails, report the error and do not
silently reuse stale screenshots as fresh evidence.

============================================================
PHASE 13: REQUIRED OUTPUT STRUCTURE
============================================================

Use the following proposed structure:

docs/
crm-analysis/
module-inventory.md
role-permission-matrix.md
workflow-inventory.md
documentation-coverage-plan.md

source/
master/
roles/
quick-start/

assets/
screenshots/
diagrams/
branding/

scripts/
seed-demo-data._
verify-demo-data._
verify-role-access._
capture-screenshots._
build-manuals._
validate-pdfs._

output/
CRM-Master-User-Manual.pdf
CRM-Quick-Start-Guide.pdf

    role-guides/
      <actual-role>-User-Guide.pdf

    quick-start/
      <actual-role>-Quick-Start.pdf

reports/
data-seeding-report.md
screenshot-capture-report.md
documentation-coverage-report.md
pdf-validation-report.md
final-generation-summary.md

Adapt the structure to repository conventions.

The master Quick Start Guide is optional if
the role-specific guides cover the required audience.

============================================================
PHASE 14: COMPLETION CRITERIA
============================================================

The task is complete only when:

1. The implemented CRM modules have been inventoried.
2. All actual user roles have been discovered.
3. A valid role-permission matrix exists.
4. Demonstration data has been safely populated.
5. Real workflows have been exercised.
6. Relevant genuine screenshots have been captured.
7. Every supported role has its own user manual.
8. Every supported role has its own Quick Start Guide.
9. A Master User Manual exists.
10. All generated PDFs pass structural QA.
11. Documentation generation is repeatable.
12. No production data has been modified.
13. All blockers and uncovered features are reported.

Do not use fake screenshots or generic placeholder pages.

If a module is inaccessible, unavailable, or broken,
record the exact reason in the final coverage report.

Do not claim the documentation is complete when
supported workflows remain undocumented.

============================================================
FINAL RESPONSE REQUIRED FROM CODING AGENT
============================================================

After execution, report:

A. APPLICATION ANALYSIS

- Frontend and backend stack
- Modules discovered
- Roles discovered
- Permission matrix location

B. DEMONSTRATION DATA

- Number of generated records by entity
- Test environment used
- Seed execution and verification status

C. DOCUMENTATION OUTPUT

- Master manual location
- Role-specific manual locations
- Quick Start Guide locations
- Number of screenshots
- PDF page counts
- Documentation coverage by role

D. QA RESULTS

- Tested workflows
- Passed and failed workflows
- Screenshot verification results
- PDF validation results

E. LIMITATIONS

- Unsupported features
- Blocked workflows
- Missing permissions
- Missing screenshots
- Documentation gaps

F. COMMANDS

- How to regenerate demo data
- How to regenerate screenshots
- How to regenerate PDFs
- How to validate documentation
- How to clean up demo data

Execute the work in logical phases.

Preserve existing application business logic,
security checks, and architecture.

Prioritize accuracy, authentic screenshots,
complete role coverage, and maintainability
over artificial document length.
