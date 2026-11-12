Perform a complete technical, SEO, AI-search-readiness, accessibility, security and conversion audit of the updated Aranax Technologies website.

TARGET:
https://aranax.tech/

FIRST:
Read the original audit and roadmap documents.
Review all changes introduced in previous implementation phases.

DO NOT redesign or rewrite completed features unnecessarily.

A. WEBSITE QUALITY

Verify:

- Homepage messaging
- All navigation links
- Mobile responsiveness
- Service pages
- Case studies
- Articles
- Contact forms
- Booking CTAs
- Accessibility
- Error pages

B. PERFORMANCE

Measure where tooling allows:

- Lighthouse mobile performance
- Largest Contentful Paint
- Interaction to Next Paint
- Cumulative Layout Shift
- JavaScript bundle size
- Image optimization
- Font loading
- Caching

Targets:

- LCP <= 2.5 seconds
- INP <= 200ms
- CLS <= 0.1
- Lighthouse mobile score >= 90

Treat these as targets, not guaranteed results.

C. SEO / AI SEARCH

Validate:

- robots.txt
- sitemap.xml
- Canonical URLs
- Page metadata
- Structured data
- Semantic heading hierarchy
- Indexable content
- Internal linking
- Author profiles
- Service descriptions
- Crawlable case studies
- FAQ quality
- Important crawler access

Distinguish local checks from actual production checks.

D. LEAD GENERATION

Test:

- Contact submissions
- Server validation
- Spam controls
- Email acknowledgements
- CRM integration
- Booking flow
- Conversion events
- Consent handling
- Lead tracking

E. AUTOMATION

Test:

- Workflow triggers
- Retries
- Deduplication
- Failure handling
- Follow-up suppression
- Unsubscribe behavior
- CRM synchronization
- Audit logging

F. BUSINESS ANALYTICS

Verify:

- Lead reporting
- Conversion calculations
- Revenue calculations
- CAC/LTV data handling
- Referral attribution
- Monthly reports

G. SECURITY

Check:

- Exposed secrets
- API validation
- Authentication
- Authorization
- Rate limiting
- XSS protection
- CSRF protection where relevant
- Webhook signature verification
- Logging of sensitive information
- Consent and data retention

H. FINAL 20-QUESTION ASSESSMENT

For each question, report:

- Question number
- Requirement
- Evidence
- Status
- Remaining action

Use:
Not Yet
Sometimes
Most of the Time
Absolutely
Not Verified

Do not mark business outcomes as Absolutely without real operational evidence.

I. TESTING

Run available:

- Lint
- Typecheck
- Unit tests
- Integration tests
- Production build

Do not claim successful execution for tests that were not run.

J. DOCUMENTATION

Create:
docs/final-website-audit.md
docs/ai-search-readiness-report.md
docs/lead-conversion-test-report.md
docs/production-release-checklist.md

OUTPUT:

- Overall findings
- Files changed
- Tests executed
- Remaining blockers
- External services requiring configuration
- Security risks
- Production release recommendations

Do not deploy automatically.
