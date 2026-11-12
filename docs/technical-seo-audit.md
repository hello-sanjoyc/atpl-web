# Technical SEO audit

Date: 2026-11-06

## Current implementation

- Next.js 16 App Router serves the homepage and six statically generated service pages.
- Public content is server-rendered or statically generated; the contact endpoint is deliberately dynamic and excluded from discovery.
- `src/app/robots.ts` produces `/robots.txt`; `src/app/sitemap.ts` produces `/sitemap.xml` for the homepage and existing service routes.
- Each public page has a canonical URL, title, description, Open Graph metadata, and index/follow robots directives.
- Homepage JSON-LD supplies `Organization` and `WebSite`. Service pages supply `Service` and `BreadcrumbList`.

## Crawler policy

`Googlebot`, `Bingbot`, `OAI-SearchBot`, `Claude-SearchBot`, `Claude-User`, and `PerplexityBot` are allowed in the generated robots policy. `GPTBot`, `ClaudeBot`, and `Google-Extended` are disallowed because they are training-oriented or have broader model-use implications; Google Search remains crawlable through `Googlebot`.

This policy cannot confirm production access. CDN, firewall, rate limiting, DNS, TLS, or bot-management rules are **Not Verified** and must be checked by the deployment owner.

## Findings and actions

| Area | Status | Action |
| --- | --- | --- |
| Crawlable HTML | Implemented locally | Confirm production pages return HTTP 200 without authentication. |
| Sitemap | Implemented | Submit the deployed absolute sitemap URL to webmaster tools. |
| Robots | Implemented | Check production `https://aranax.tech/robots.txt`; do not leave the CMS robots file as the public frontend source. |
| Canonicals | Implemented | Confirm redirects enforce one HTTPS host/version. |
| Structured data | Implemented | Validate rendered JSON-LD after deployment. |
| Internal links | Partially implemented | Homepage links to service pages; case-study and article detail routes do not yet exist. |
| Article / author signals | Not Yet | Add when the content-publishing phase is implemented. |
| Performance / CWV | Not Verified | Run field-data and lab testing against production. |

## WAF and deployment checks

Manually verify that the edge/CDN does not challenge or block the permitted bots. Allowlisting must validate the crawler using each vendor's current verification guidance; never trust a user-agent string alone. Keep contact APIs rate-limited and separate from public content crawl policy.
