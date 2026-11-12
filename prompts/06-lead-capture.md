Implement a production-ready lead capture system for the Aranax website.

GOAL:
Convert qualified website visitors into trackable business enquiries.

FIRST:
Inspect existing contact forms, backend APIs, email configuration, data storage, privacy policies and deployment environment.

Do not replace working components without a clear reason.

IMPLEMENT THREE CONVERSION PATHS:

1. BOOK A DISCOVERY CALL

Create a reusable booking CTA on:

- Homepage
- Service pages
- Case studies
- Contact page

If an existing calendar provider is configured, integrate it.

If none is available:

- Support a configurable booking URL.
- Provide a working contact fallback.
- Do not invent a calendar link.

2. SUBMIT PROJECT REQUIREMENTS

Create an accessible project enquiry form.

Fields:

- Full name
- Work email
- Company name
- Country
- Required service
- Project description
- Approximate budget range (optional)
- Expected start date (optional)
- Consent to contact

Use server-side validation.
Apply spam protection and rate limiting.

3. AI/SAAS READINESS ASSESSMENT

Create a useful interactive assessment or downloadable checklist for prospective clients.

Focus on:

- Product requirements readiness
- SaaS architecture
- Authentication and security
- AI integration feasibility
- Deployment readiness
- Technical scalability
- Maintenance planning

Provide immediate value before requesting contact details where feasible.

Do not implement deceptive gated content.

LEAD DATA

Capture:

- Lead ID
- Timestamp
- Name
- Email
- Company
- Country
- Service interest
- Project description
- Form source
- Landing page
- UTM parameters
- Referrer, where available
- Consent status and timestamp
- Lead status

Do not collect unnecessary sensitive information.

BACKEND

Implement:

- Secure API endpoint
- Schema validation
- Duplicate detection
- Idempotent submission handling
- Configured storage
- Email notification
- Transactional acknowledgement
- Error logging
- Safe retry behavior

Do not send mail directly from the browser.

AUTOMATION

On successful submission:

1. Save the lead.
2. Send a transactional acknowledgement.
3. Notify the sales team.
4. Queue CRM synchronization when configured.
5. Display a meaningful confirmation page.
6. Include a valid booking link if available.

Send marketing follow-ups only where legally permitted and supported by appropriate consent.

ANALYTICS

Track:

- Form view
- Form start
- Form success
- Form validation error
- Booking CTA click
- Booking completion, when confirmable
- Readiness assessment completion

Avoid duplicate event firing and exposing personal data in analytics events.

ACCEPTANCE:

- All forms work on mobile.
- Validation works server-side.
- No public API keys.
- Email failure does not silently lose leads.
- Leads can be retrieved by authorized users.
- Tracking events are accurate.
- Existing contact functionality is preserved.
- Include integration tests where the project supports them.
