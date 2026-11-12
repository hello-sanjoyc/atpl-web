Implement Phase 2 of the Aranax website transformation, following:
docs/website-transformation-audit.md
docs/website-transformation-roadmap.md

OBJECTIVE:
Redesign and rewrite the homepage to improve:

- Immediate clarity of the business offering
- Relevance to US, Canada, UK, and Europe startups and SaaS founders
- Relevance to agency partnership buyers
- AI search understanding
- Conversion to qualified project enquiries
- Mobile usability and accessibility

PRESERVE:

- Existing logo and brand identity
- Current framework and architecture
- Functional routes and integrations
- Relevant existing components
- Dark visual design, where applicable

CHANGE THE STRAPI CMS CONTENT AS REQUIRED.

HOMEPAGE STRUCTURE:

1. HERO

Eyebrow:
AI SaaS & Custom Software Engineering

H1:
Turn Your Ideas into Production-Ready AI & SaaS Products

Supporting headline:
Build Production-Ready AI Applications, Multi-Tenant SaaS Platforms and Intelligent Automation.

Body:
Aranax Technologies helps startups, growing businesses, and digital agencies build and launch AI-powered SaaS platforms, custom software, and web and mobile applications without the complexity of managing multiple development teams. From MVP development and multi-tenant architecture to AI integration, workflow automation, and cloud deployment, we provide end-to-end engineering expertise to shorten development cycles, reduce technical risks, and build scalable products for long-term growth.

Mention:

- Architecture-led engineering
- Full-stack development
- Secure and maintainable applications
- International client collaboration

Primary CTA:
Book a Free Discovery Call

Secondary CTA:
Explore Our Work

Add space for verified trust indicators.

2. WHO WE HELP

Create three buyer segments:

- Startups and SaaS founders
- Software and digital agencies
- Businesses and institutions

Each segment should explain:

- Typical business challenges
- Relevant Aranax services
- Expected deliverables
- Appropriate next action

3. CORE SERVICES

Create service cards for:

- AI SaaS Development
- Multi-Tenant SaaS Development
- RAG and AI Assistants
- AI Agents and Automation
- Custom Web and Mobile Development
- White-Label Engineering

Each card must have:

- Descriptive heading
- 40–70 words of unique copy
- Clear buyer benefit
- Link to its dedicated service page

4. WHY ARANAX

Explain actual differentiators:

- Architecture-first engineering
- SaaS and backend expertise
- AI integration capabilities
- Full-stack delivery
- Practical security and maintainability
- Flexible engagement discussions

Do not use unsupported claims such as:
"Best in India"
"Top-rated globally"
"Guaranteed success"
"Millions of customers served"

5. SELECTED WORK

Reuse existing real portfolio items.

Each item must show:

- Project name
- Product or application category
- Problem addressed
- Engineering contribution
- Actual technologies, if verified
- Link to detailed case study

Do not fabricate metrics.

6. HOW WE WORK

Discovery
Architecture
Implementation
Testing
Deployment
Ongoing Support

Write concise and human-centered explanations.

7. FAQ

Add 6–8 relevant questions about:

- Development services
- SaaS architecture
- AI integration
- Project engagement
- Technology choices
- Offshore collaboration
- Maintenance

8. FINAL CTA

Headline:
Have an AI or SaaS Product in Mind?

Body:
Tell us what you're building. We'll discuss your requirements, architecture, delivery approach and next steps.

CTA:
Book a Technical Discovery Call

IMPLEMENTATION REQUIREMENTS:

- Maintain a single meaningful H1.
- Use semantic heading hierarchy.
- Use accessible responsive components.
- Make CTA destinations functional.
- Do not use fake calendar URLs.
- Ensure important content is available in server-rendered HTML where supported.
- Add descriptive internal links.
- Optimize images and fonts.
- Preserve the existing contact mechanism until the new one works.
- Use reusable content components.

SEO:
Create a unique homepage title and meta description.

Suggested title:
AI SaaS Development Company | Aranax Technologies

Suggested description:
Aranax Technologies builds custom AI SaaS platforms, multi-tenant applications, RAG assistants and AI automation for startups, businesses and agencies.

VALIDATION:

- Run existing lint/typecheck/build commands.
- Check responsive layout.
- Verify navigation and CTA destinations.
- Check accessibility.
- Report changed files and any unresolved issues.
