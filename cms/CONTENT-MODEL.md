# CMS content required by the website

The frontend intentionally has no editorial fallback copy. Publish every required
entry in Strapi before deploying the site.

## Home Page JSON fields

`buyerSegments`

```json
{
  "eyebrow": "Who We Help",
  "heading": "Engineering support shaped around *how you deliver.*",
  "items": [{ "title": "Startups", "challenge": "...", "service": "...", "deliverable": "...", "cta": "Talk to us", "href": "#contact" }]
}
```

`processSection`

```json
{
  "eyebrow": "How We Work",
  "heading": "A practical path to an *operating product.*",
  "steps": [{ "number": "01", "title": "Discovery", "description": "..." }]
}
```

`faqSection`

```json
{
  "eyebrow": "FAQ",
  "heading": "Questions teams *ask early.*",
  "items": [{ "question": "...", "answer": "..." }]
}
```

`finalCta`

```json
{
  "eyebrow": "Start a conversation",
  "heading": "Have a product in mind?",
  "description": "...",
  "cta": { "label": "Book a discovery call", "href": "#contact" }
}
```

## Service `pageContent`

```json
{
  "eyebrow": "Aranax services",
  "cta": { "label": "Book a discovery call", "href": "#contact" },
  "audienceTitle": "Who this service is for", "audience": ["..."],
  "problemsTitle": "Problems we help address", "problems": ["..."],
  "deliverablesTitle": "What we can deliver", "deliverables": ["..."],
  "capabilitiesTitle": "Technical capabilities", "capabilities": ["..."],
  "architectureTitle": "Architecture considerations", "architecture": "...",
  "processTitle": "How an engagement works", "process": [{ "title": "Discovery", "description": "..." }],
  "workTitle": "Relevant work", "caseStudies": [{ "name": "...", "url": "...", "description": "..." }],
  "faqTitle": "FAQs", "faqs": [{ "question": "...", "answer": "..." }],
  "relatedTitle": "Related services", "related": [{ "name": "...", "href": "/services/..." }]
}
```

## Case Study `pageContent`

Each of `context`, `challenge`, `contribution`, and `outcome` uses `label`,
`title`, and `copy`. `context` also includes `audience`. Add `cta` with `label`,
`title`, `description`, and `button` (`label`, `href`).

## SEO / AEO

The shared `SEO` component now provides standard metadata, social metadata,
custom JSON-LD (`structuredData`), an answer-first summary (`answerSummary`),
and FAQ question/answer pairs (`questions`). The website emits the CMS JSON-LD,
an answer summary WebPage entity, and FAQPage JSON-LD when those fields exist.
