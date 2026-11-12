Implement a CRM-integrated lead management and follow-up workflow for Aranax Technologies.

FIRST:
Audit existing lead storage, CRM integration, email service, background jobs, database and authentication system.

Do not build a new CRM from scratch if an adequate integration already exists.

SUPPORT:

1. LEAD PIPELINE

Suggested stages:

- New Lead
- Contacted
- Qualified
- Discovery Scheduled
- Discovery Completed
- Proposal Sent
- Negotiation
- Won
- Lost
- Nurturing

Allow appropriate authorized users to change stages.

2. LEAD CLASSIFICATION

Store:

- Lead source
- Target service
- Company type
- Country
- Budget category
- Lead owner
- Lead stage
- Priority
- Last contact
- Next follow-up
- Consent status

3. AUTOMATED INITIAL RESPONSE

On receiving a valid lead:

- Send acknowledgement within a target of 5 minutes.
- Notify the responsible team.
- Add or sync lead to the CRM.
- Create follow-up task.
- Record each workflow outcome.

Use reliable background processing where necessary.

4. FOLLOW-UP SEQUENCES

Support configurable sequences for:

- AI SaaS prospects
- RAG and AI development prospects
- White-label agency prospects
- General software development prospects

Distinguish:

- Sales enquiries requiring a direct reply
- Marketing nurture requiring appropriate permission

Allow:

- Pausing
- Opting out
- Unsubscribing
- Manual sales takeover
- Suppression after a meeting or deal conversion

5. BACKGROUND JOBS

Use existing job infrastructure if available.

Requirements:

- Idempotency
- Retries with backoff
- Failure reporting
- Rate limits
- Audit logs
- No duplicate follow-up emails

6. CRM

Support integration with a configured provider such as HubSpot or Zoho CRM.

If no provider is configured, implement a clean integration adapter and local development mock.

Do not hardcode API keys or assume an active provider account.

7. TRACKING

Measure:

- New leads
- Response time
- Qualified leads
- Lead-to-meeting rate
- Meeting-to-proposal rate
- Proposal-to-client rate
- Follow-up completion
- Manual follow-up effort

8. ADMIN SECURITY

Use authentication and role-based authorization.
Do not expose lead information through public API endpoints.

ACCEPTANCE:

- Duplicate submissions cannot create duplicate workflows.
- Marketing suppression works.
- CRM sync failures are recoverable.
- Leads are never silently discarded.
- No invented success metrics.
- All secrets remain server-side.
- Include technical and operational documentation.
