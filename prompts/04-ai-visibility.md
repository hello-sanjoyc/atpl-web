Act as a senior Technical SEO and AI Search Optimization engineer.

PROJECT:
https://aranax.tech/

OBJECTIVE:
Make public Aranax pages easily discoverable, crawlable, understandable and eligible for citation by search engines and AI-powered search assistants.

IMPORTANT:
Do not promise rankings or AI citations.
Follow verified crawler documentation.
Avoid unsupported AI SEO hacks.

1. CRAWLABILITY

Audit existing:

- robots.txt
- sitemap.xml
- HTTP status codes
- Canonical URLs
- Redirects
- Meta robots directives
- X-Robots-Tag headers
- CDN/WAF crawler restrictions
- Public route accessibility

Ensure legitimate public pages can be crawled.

Review support for:

- OAI-SearchBot
- Claude-SearchBot
- Claude-User
- PerplexityBot
- Googlebot
- Bingbot

Verify actual crawler names against current official documentation before making configuration changes.

Do not automatically enable training-oriented crawlers.
Do not weaken security controls.
Report WAF changes requiring manual configuration.

2. SITEMAP

Generate a dynamic sitemap using the actual framework.

Include:

- Homepage
- About
- Services
- Case studies
- Articles
- Contact
- Other indexable public pages

Exclude:

- Authentication pages
- Internal dashboards
- Thank-you pages
- Duplicate/filter URLs
- Private or restricted content

Use valid canonical absolute URLs.

3. METADATA

Create reusable metadata utilities.

Each indexable page should have:

- Unique title
- Meta description
- Canonical URL
- Open Graph title and description
- Social preview image, where available
- Appropriate robots directives

Avoid identical SEO titles across pages.

4. STRUCTURED DATA

Create reusable JSON-LD helpers for:

Organization
WebSite
Service
BreadcrumbList
Article or BlogPosting
Person, where applicable

Use FAQPage only when appropriate and consistent with current search engine guidance.

Important:

- Never fabricate ratings.
- Never fabricate reviews.
- Never fabricate customer counts.
- Never invent a physical address.
- Never create fake third-party sameAs links.
- Use verified company information.
- Validate the JSON-LD output.

5. SEMANTIC HTML

Audit and fix:

- Multiple unnecessary H1 elements
- Incorrect heading hierarchy
- Content hidden from crawlers
- Generic link labels
- Missing image alt text
- Client-only rendering of essential page content
- Inaccessible navigation
- Duplicate content

6. INTERNAL LINKS

Create meaningful links between:

- Homepage
- Services
- Case studies
- Technical articles
- Industry pages
- Contact page

Use descriptive anchor text.

7. AI ANSWER READINESS

For important pages, ensure:

- Clear direct-answer introductions
- Useful definitions
- Specific company capabilities
- Relevant technical explanations
- Real experience and evidence
- Helpful FAQs
- Named authors where appropriate
- Visible publication and update dates for articles

Avoid hidden AI-specific content and keyword stuffing.

8. LLMS.TXT

Do not treat llms.txt as a requirement or ranking factor.

If the repository already has llms.txt, review its accuracy.
Only add or update one if maintainable and useful as optional machine-readable documentation.

9. VALIDATION

Check:

- Sitemap generation
- robots.txt output
- Metadata
- Schema validity
- Canonicals
- Redirect loops
- Broken links
- Crawlable server-rendered content
- Indexability
- Build success

Create:
docs/technical-seo-audit.md
docs/ai-search-validation.md

Include exact verification steps for:

- Google Search Console
- Bing Webmaster Tools
- robots.txt
- Sitemap
- Structured data
- Crawler access

Do not mark production crawler access as verified unless actual external evidence exists.
