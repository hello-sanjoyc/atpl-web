Create a content publishing and attribution system for Aranax Technologies using the existing website architecture.

FIRST:
Inspect whether the repository already uses a CMS.

If a CMS is present, extend it.
Otherwise, use the simplest maintainable content system that fits the existing project.

DO NOT introduce Strapi, WordPress or another CMS without a clear architectural reason.

CONTENT TYPES

Support:

- Technical articles
- Case studies
- FAQ content
- Service content
- Authors
- Categories and tags

ARTICLES

Fields:

- Title
- Slug
- Excerpt
- Content
- Featured image
- Author
- Category
- Related services
- Meta title
- Meta description
- Canonical URL
- Published date
- Updated date
- Publication status

FEATURES

1. Article listing page
2. Article detail pages
3. Categories
4. Related articles
5. Related services
6. SEO metadata
7. Sitemap inclusion
8. Article structured data
9. Author profile display
10. Draft and publish workflow

SOCIAL REPURPOSING

Create an internal workflow/template to prepare:

- LinkedIn post
- Short technical summary
- Carousel outline
- Video script outline
- Email newsletter summary

These should be derived from published articles.

Do not auto-publish to external social platforms unless actual credentials, APIs, authorization and approval workflows exist.

AI SEARCH VISIBILITY

Create configuration for a controlled set of target prompts related to:

- AI SaaS development
- Multi-tenant SaaS
- RAG development
- AI agent development
- White-label software engineering

Create an admin-facing reporting structure to record:

- Target query
- Platform
- Evaluation date
- Brand mentioned
- Domain cited
- Cited URL
- Competing domains
- Evidence/source
- Notes

Do not simulate AI search results or claim the site appears in a platform without actual observations.

ATTRIBUTION

Store and analyze available:

- Referral source
- UTM source
- UTM medium
- Campaign
- Landing page
- Form completion
- Qualified lead
- Booking
- Won opportunity, when CRM data exists

Ensure privacy-conscious analytics.

ACCEPTANCE:

- Content remains SEO-friendly.
- Draft content is not indexed.
- Authors and dates are accurate.
- Internal links work.
- Publishing changes update sitemap content.
- Tracking does not expose personal data.
- No fabricated AI search rankings.
