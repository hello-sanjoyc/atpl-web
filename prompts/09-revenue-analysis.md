Extend Aranax's lead management system into a measurable sales and revenue reporting workflow.

FIRST:
Inspect existing data models and integrations.
Reuse the current database and CRM structures.
Do not duplicate existing business records.

OBJECTIVE:
Provide reliable reporting for:

- Lead conversion
- Sales pipeline
- Revenue
- Client retention
- Referrals
- Follow-up performance

1. SALES PIPELINE

Define explicit stages with configurable probabilities.

Track:

- Opportunity ID
- Company
- Contact
- Owner
- Service
- Estimated deal value
- Currency
- Expected close date
- Stage
- Stage history
- Actual close date
- Actual won value
- Lost reason
- Lead source

2. REVENUE DASHBOARD

Create cards/charts for:

- Leads by source
- Qualified leads
- Discovery meetings
- Proposals sent
- Won deals
- Lost deals
- Pipeline value
- Won revenue
- Lead-to-client conversion
- Proposal win rate
- Average deal size

3. CAC AND LTV

Calculate Customer Acquisition Cost only when valid acquisition cost data is available.

Calculate Customer Lifetime Value only from an explicitly defined method and sufficient revenue/cost data.

Do not produce fabricated, zero-filled or misleading metrics when data is missing.

Show "Insufficient data" where appropriate.

4. REFERRAL SYSTEM

Support:

- Referral source
- Referring customer or partner
- Referred company
- Referral date
- Related opportunity
- Won revenue
- Referral attribution

Calculate:
Referral-sourced won deals / total won deals

Use a consistent reporting period.

5. EXISTING CUSTOMER GROWTH

Support:

- Client account reviews
- Maintenance renewal reminders
- Support opportunities
- Upgrade opportunities
- Cross-sell opportunities
- Follow-up tasks

Do not send unsolicited promotional emails without appropriate permission.

6. REPORTING

Provide:

- Monthly view
- Quarterly view
- Date filters
- Service filters
- Country filters
- Source filters
- Authorized CSV export

7. ACCESS CONTROL

Protect internal financial and customer information.
Use existing authentication and authorization patterns.

ACCEPTANCE:

- Metrics have documented definitions.
- Date and currency handling is correct.
- No duplicate revenue counting.
- Missing data is handled clearly.
- Lead attribution remains traceable.
- Reports distinguish estimated pipeline from actual revenue.
- Automated tests cover essential calculations.
