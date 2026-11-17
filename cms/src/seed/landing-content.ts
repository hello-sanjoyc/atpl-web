import type { Core } from '@strapi/strapi';
import { stat } from 'node:fs/promises';
import path from 'node:path';

type SeedEntry = Record<string, unknown> & { slug: string };

const textItems = (items: string[]) => items.map((text) => ({ text }));

const homepageSeo = {
  metaTitle: 'AI SaaS, RAG & AI Agent Development | Aranax Technologies',
  metaDescription:
    'Build AI SaaS products, RAG assistants, voice agents, web and mobile apps with Aranax. Explore founder MVP sprints and white-label engineering for agencies.',
  focusKeyword: 'AI product development company',
  keywords: textItems([
    'AI SaaS development',
    'RAG and AI assistants',
    'AI agents and voice automation',
    'custom web and mobile development',
    'founder MVP development',
    'white-label engineering',
  ]),
  canonicalUrl: 'https://aranax.tech/',
  preventIndexing: false,
  preventFollowing: false,
  openGraphTitle:
    'AI SaaS, RAG & AI Agent Development | Aranax Technologies',
  openGraphDescription:
    'Build AI SaaS products, RAG assistants, voice agents, web and mobile apps with Aranax. Explore founder MVP sprints and white-label engineering for agencies.',
  openGraphType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'AI SaaS, RAG & AI Agent Development | Aranax Technologies',
  twitterDescription:
    'Build AI SaaS products, RAG assistants, voice agents, web and mobile apps with Aranax. Explore founder MVP sprints and white-label engineering for agencies.',
  answerSummary:
    'Aranax Technologies builds AI SaaS platforms, RAG assistants, tool-calling and voice agents, and custom web and mobile apps. It also offers fixed-scope founder MVP sprints and white-label engineering for digital agencies.',
  questions: [
    {
      question: 'What does Aranax Technologies build?',
      answer:
        'Aranax builds AI SaaS platforms, RAG assistants, tool-calling and voice agents, custom web and mobile apps, founder MVPs and white-label engineering projects.',
    },
    {
      question: 'Can Aranax support an AI SaaS MVP?',
      answer:
        'Yes. Engagements can begin with discovery and a focused MVP scope before progressing to a production-ready application.',
    },
    {
      question: 'What is included in Founder MVP Sprints?',
      answer:
        'A fixed-scope sprint covers discovery, architecture, core product features, an initial AI capability where needed, deployment and a working version for first users.',
    },
    {
      question: 'Does Aranax build voice AI agents?',
      answer:
        'Yes. We build voice agents for calls and bookings alongside tool-calling agents, with integration, approval steps and execution logs matched to the workflow.',
    },
    {
      question: 'What happens during product discovery?',
      answer:
        'We clarify the users, key workflows, success measures, technical constraints and the smallest useful release, then turn those decisions into a practical delivery plan.',
    },
    {
      question: 'Can you work with an existing product or engineering team?',
      answer:
        'Yes. We can work alongside your team with agreed responsibilities, communication routines, delivery standards and handover expectations.',
    },
    {
      question: 'Do you build RAG assistants from our company knowledge?',
      answer:
        'Yes. We can build retrieval-augmented assistants that use approved documents, websites and business data, with source-aware answers, access controls and evaluation.',
    },
    {
      question: 'How do you approach AI reliability and human oversight?',
      answer:
        'We design AI workflows around grounded information, clear boundaries, evaluations, review or approval steps where appropriate, and visibility into failures or uncertain results.',
    },
    {
      question: 'Can you integrate with our existing tools and APIs?',
      answer:
        'Yes. Integrations are planned around the systems, data flows, authentication requirements and operational workflows that the product needs to support.',
    },
    {
      question: 'How do you approach security and user permissions?',
      answer:
        'Security considerations begin during architecture. We account for access controls, user roles, data boundaries, authentication, sensitive workflows and operational requirements.',
    },
    {
      question: 'Can you build a multi-tenant SaaS application?',
      answer:
        'Yes. We design SaaS products with tenant-aware data models, roles and permissions, account administration, data isolation and foundations for reliable growth.',
    },
    {
      question: 'Do you provide web and mobile application development?',
      answer:
        'Yes. Our work includes web applications, mobile experiences, backend APIs, databases and integrations for new products, internal tools and modernisation programmes.',
    },
    {
      question: 'Can agencies engage Aranax as a white-label engineering partner?',
      answer:
        'Yes. We support agencies with configurable engineering capacity while aligning to their client relationship, delivery process, technical standards and ownership model.',
    },
    {
      question: 'What support is available after launch?',
      answer:
        'We can provide ongoing maintenance, monitoring, improvements and feature delivery based on the product roadmap and the needs of the operating team.',
    },
  ],
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Aranax Technologies',
    url: 'https://aranax.tech/',
    email: 'hello@aranax.tech',
    areaServed: 'Worldwide',
    knowsAbout: [
      'AI SaaS Development',
      'RAG and AI Assistants',
      'AI Agents, Automation and Voice',
      'Custom Web and Mobile',
      'Founder MVP Sprints',
      'White-Label Engineering',
    ],
  },
};

const relevantWorkByService: Record<string, Array<{ name: string; url: string; description: string }>> = {
  'AI SaaS Development': [
    { name: 'EMA - Smarter Inbox Management', url: 'https://ema.aranax.tech', description: 'AI email productivity and workflow support.' },
    { name: 'DocuNova - Understand Contracts Faster', url: 'https://docunova.app', description: 'Document intelligence and structured knowledge workflows.' },
  ],
  'Founder MVP Sprints': [
    { name: 'Gloziia - Salon Marketplace and Management Platform', url: 'https://gloziia.com', description: 'Marketplace and operations workflows for beauty businesses.' },
    { name: 'GlamSync - SaaS for Independent Makeup Artists', url: 'https://glamsync.app', description: 'A focused business workspace for independent professionals.' },
  ],
  'RAG and AI Assistants': [
    { name: 'DocuNova - Understand Contracts Faster', url: 'https://docunova.app', description: 'Structured analysis and document-grounded answers.' },
    { name: 'UniEcho - AI Student Assistant', url: 'https://uniecho.io', description: 'A multilingual student-information assistant.' },
  ],
  'AI Agents, Automation and Voice': [
    { name: 'EMA - Smarter Inbox Management', url: 'https://ema.aranax.tech', description: 'Email prioritisation and follow-up workflows.' },
    { name: 'UniEcho - AI Student Assistant', url: 'https://uniecho.io', description: 'Conversational assistance across student service questions.' },
  ],
  'Custom Web and Mobile': [
    { name: 'Gloziia - Salon Marketplace and Management Platform', url: 'https://gloziia.com', description: 'Customer discovery, booking and operational workflows.' },
    { name: 'DoubtAce - Exam-Ready Doubt Resolution', url: 'https://doubtace.com', description: 'Learning support built around photographed and printed content.' },
  ],
  'White-Label Engineering': [
    { name: 'Selected product work', url: '/#case-studies', description: 'Explore the product categories and engineering contributions shown on the homepage.' },
  ],
};

type ServicePageDetail = {
  architecture: string;
  process: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
};

const servicePageDetails: Record<string, ServicePageDetail> = {
  'AI SaaS Development': {
    architecture:
      'We balance the speed of an MVP with the foundations needed for a SaaS product: tenant boundaries, roles, billing and usage controls, API contracts, observability, model costs and a deployment path that will not block the next stage of growth.',
    process: [
      { title: 'Product discovery', description: 'Map the customer workflow, product boundary and smallest paid-for outcome before estimating features.' },
      { title: 'Platform design', description: 'Define tenant model, permissions, core data, AI touchpoints, integrations and the operational foundations.' },
      { title: 'Incremental build', description: 'Deliver the application in reviewable slices, prioritising the workflows users need to adopt first.' },
      { title: 'Launch readiness', description: 'Test critical journeys, production configuration, monitoring and the handover needed to operate the product.' },
    ],
    faqs: [
      { question: 'What is included in an AI SaaS MVP?', answer: 'An MVP is scoped around a clear customer workflow and typically includes the application experience, essential roles and data model, selected AI capability, APIs and a production deployment path.' },
      { question: 'How do you control AI usage and model costs?', answer: 'We plan model selection, request limits, usage visibility, fallback behaviour and the product controls needed to keep costs understandable as usage grows.' },
      { question: 'Can subscriptions and billing be added?', answer: 'Yes. Billing, plans, trials and usage-aware entitlements can be designed as part of the account and product architecture.' },
      { question: 'How do you avoid building too much before launch?', answer: 'Discovery identifies the narrowest valuable workflow, technical dependencies and deferred capabilities so the first release can be tested with real users sooner.' },
      { question: 'Can you take over an existing prototype?', answer: 'Yes. We assess the current workflow, codebase, data model and deployment setup, then recommend whether to stabilise, extend or replace specific parts.' },
      { question: 'What happens after the first release?', answer: 'We can support product iteration, reliability work, new integrations and the architecture changes that follow customer feedback and adoption.' },
      { question: 'Which AI models should an AI SaaS product use?', answer: 'Model choice depends on the task, quality requirements, latency, privacy, cost and provider constraints. We evaluate these trade-offs against the product workflow rather than choosing a model first.' },
      { question: 'Can the product support different user roles?', answer: 'Yes. Roles, permissions and account administration are designed around the actions each user type needs to take, including customer and internal support roles.' },
      { question: 'How is the SaaS product deployed?', answer: 'We plan the hosting, environments, secrets, monitoring and release process to suit the product’s expected traffic, integrations and operational ownership.' },
      { question: 'What do you need from us to begin?', answer: 'A clear business problem, access to the relevant stakeholders and any existing prototype, workflow or technical material are enough to start a productive discovery conversation.' },
    ],
  },
  'Founder MVP Sprints': {
    architecture:
      'The sprint starts with an agreed first-user workflow and a fixed scope. We choose a lean architecture, define the AI feature and its boundaries, prioritise the core experience, and prepare a deployment and handover path that supports learning after launch.',
    process: [
      { title: 'Scope the first release', description: 'Agree on the target users, core workflow, constraints and what is outside the initial build.' },
      { title: 'Design the foundation', description: 'Choose the application architecture, data model, AI integration and deployment approach.' },
      { title: 'Build and review', description: 'Deliver the essential features in reviewable increments, using feedback to clarify the first-user experience.' },
      { title: 'Launch and hand over', description: 'Verify the main journeys, deploy the working version and prepare the next iteration.' },
    ],
    faqs: [
      { question: 'How long is a Founder MVP Sprint?', answer: 'The timeline is agreed after discovery and depends on the scope, integrations and readiness of the inputs. We do not assume a fixed number of weeks before those are clear.' },
      { question: 'What does fixed scope mean?', answer: 'The initial release has an agreed set of user journeys, deliverables and assumptions. New ideas can be prioritised for a later iteration.' },
      { question: 'Can the MVP include an AI feature?', answer: 'Yes. We define one useful AI workflow with clear input, output, reliability and cost expectations for the first release.' },
      { question: 'Will it be usable by real customers?', answer: 'The goal is a working version for first users, with deployment and essential operational considerations included in the agreed scope.' },
      { question: 'What happens after launch?', answer: 'We review feedback and usage, then plan the next product increment around what users actually need.' },
    ],
  },
  'RAG and AI Assistants': {
    architecture:
      'A useful RAG assistant depends on more than a chat interface. We design ingestion, document structure, retrieval quality, permissions, citations, evaluation and escalation around the knowledge sources people are actually allowed to use.',
    process: [
      { title: 'Knowledge audit', description: 'Identify the approved sources, owners, update patterns, user groups and questions the assistant must handle.' },
      { title: 'Retrieval design', description: 'Plan ingestion, chunking, metadata, access filters, citations and evaluation criteria for the knowledge base.' },
      { title: 'Assistant build', description: 'Implement the assistant experience, retrieval pipeline and source-aware responses around real user tasks.' },
      { title: 'Quality review', description: 'Evaluate answer quality, unsupported-answer behaviour, feedback loops and the process for keeping sources current.' },
    ],
    faqs: [
      { question: 'What content can a RAG assistant use?', answer: 'It can use approved documents, knowledge bases, websites and connected business sources, subject to the access and ingestion approach agreed during discovery.' },
      { question: 'Will answers show their sources?', answer: 'Yes. Source links or citations can be included where the underlying content and user experience support them.' },
      { question: 'How do you prevent answers from using restricted information?', answer: 'Access controls and metadata filters are designed into retrieval so users receive material they are authorised to see.' },
      { question: 'How do you measure whether the assistant is useful?', answer: 'We define representative questions and quality criteria, then evaluate retrieval, grounding, answer usefulness and unsupported-answer behaviour before and after launch.' },
      { question: 'Can our team update the knowledge base?', answer: 'Yes. We can define an ingestion and review workflow that fits the systems and content owners your team already uses.' },
      { question: 'When should the assistant hand off to a person?', answer: 'We design escalation for low-confidence, sensitive or action-required cases, with the context a human needs to continue the conversation.' },
      { question: 'What if the source documents are poorly structured?', answer: 'We assess the material first, then improve extraction, metadata and chunking where needed. Some sources may need a preparation step to produce dependable retrieval.' },
      { question: 'Can a RAG assistant work across multiple languages?', answer: 'Yes, provided the source material, user needs and evaluation set are planned for the required languages and terminology.' },
      { question: 'How quickly do new documents become available to the assistant?', answer: 'That depends on the selected ingestion workflow. We can support scheduled, event-driven or reviewed updates based on how current the knowledge needs to be.' },
      { question: 'Can the assistant be embedded in our existing product?', answer: 'Yes. We can design an embedded experience or integrate the retrieval capability with your existing application, authentication and support workflows.' },
    ],
  },
  'AI Agents, Automation and Voice': {
    architecture:
      'Tool-calling and voice agents are designed as controlled systems. We define which tools and data they can access, when a caller or operator needs a human handoff, approval gates for consequential actions, retry and failure paths, execution logs and monitoring.',
    process: [
      { title: 'Workflow mapping', description: 'Identify the repeated work, input quality, decision points, tools and human owners involved today.' },
      { title: 'Control design', description: 'Set permissions, tool boundaries, approvals, exceptions and observability for each automated action.' },
      { title: 'Integration build', description: 'Connect the necessary systems and implement the agent or orchestration flow around a focused operational use case.' },
      { title: 'Safe rollout', description: 'Validate outcomes with real scenarios, begin with appropriate review, and monitor failures and improvement opportunities.' },
    ],
    faqs: [
      { question: 'What kinds of work are suitable for AI automation?', answer: 'Repeatable workflows with clear inputs, useful system access and definable review points are usually strong candidates, especially where manual handoffs create delay.' },
      { question: 'Can an agent take actions in our business tools?', answer: 'Yes, when the required APIs and permissions exist. We define exactly which actions are allowed and where a human approval is required.' },
      { question: 'How do you prevent an agent from taking the wrong action?', answer: 'We use constrained tool access, validation, approval steps, exception handling and logs rather than treating a model response as an unchecked instruction.' },
      { question: 'Can the automation include a human review step?', answer: 'Yes. Review and approval can be placed before sensitive, irreversible or low-confidence actions.' },
      { question: 'Will we be able to see what the agent did?', answer: 'We can provide workflow status, action logs and the context needed to investigate a failed or unexpected run.' },
      { question: 'Can you automate a process that spans several systems?', answer: 'Yes. We map the systems, handoffs and data requirements first, then build the integrations and orchestration around the practical workflow.' },
      { question: 'Do we need clean data before automating a workflow?', answer: 'Reliable inputs matter. Discovery identifies data-quality issues, missing system access and exceptions that should be addressed before automation is trusted with production work.' },
      { question: 'Can an agent use our internal knowledge as well as tools?', answer: 'Yes. An agent can combine approved knowledge retrieval with constrained tool use when both are needed to complete a workflow safely.' },
      { question: 'How do you handle failed integrations or API outages?', answer: 'We design retries, error handling, alerts and human fallback paths so a failed dependency does not silently create an incomplete or incorrect outcome.' },
      { question: 'Can we start with one small automation?', answer: 'Yes. A focused workflow is often the best way to validate value, controls and operating requirements before expanding automation to adjacent processes.' },
      { question: 'Can a voice agent handle calls and bookings?', answer: 'Yes, where the phone and booking systems support integration. We define the call flow, confirmation steps, human transfer and logging before rollout.' },
    ],
  },
  'Custom Web and Mobile': {
    architecture:
      'We choose the application shape around the problem: web, mobile, backend APIs, integrations, offline needs, data ownership and the maintenance capacity of the team that will run it. The goal is a useful system with a supportable technical footprint.',
    process: [
      { title: 'Problem framing', description: 'Understand users, existing systems, operational constraints and the outcome the new application must improve.' },
      { title: 'Solution design', description: 'Define application surfaces, APIs, data flows, integrations and the release approach before build begins.' },
      { title: 'Product delivery', description: 'Build and review the highest-value user journeys in increments, with testing alongside implementation.' },
      { title: 'Release and handover', description: 'Prepare deployment, documentation and the support path for the people who will use and maintain the application.' },
    ],
    faqs: [
      { question: 'Should we build a web app, mobile app or both?', answer: 'That decision follows the user context, device needs, workflow complexity and budget. We help define the smallest product surface that serves the intended users well.' },
      { question: 'Can you modernise an existing internal tool?', answer: 'Yes. We can assess the current workflow, technical debt, data dependencies and migration risks before proposing a staged modernisation plan.' },
      { question: 'Can you connect the application to our existing systems?', answer: 'Yes. APIs, identity providers, databases and third-party services are evaluated as part of the solution design.' },
      { question: 'How do you handle changing requirements?', answer: 'We work in reviewable increments so new information can be weighed against scope, delivery impact and the product outcome before it is added.' },
      { question: 'Will we own the code and deployment?', answer: 'Ownership, repository access, infrastructure access and handover expectations are agreed as part of the engagement model.' },
      { question: 'Can you support the application after launch?', answer: 'Yes. Support can include maintenance, performance work, security updates, integrations and subsequent feature releases.' },
      { question: 'Can you work from our designs or help shape the user experience?', answer: 'Yes. We can work with established designs and product specifications or collaborate on user flows and interface decisions where those are still being defined.' },
      { question: 'How do you protect an application that handles sensitive data?', answer: 'We identify the sensitive data, access requirements, integrations and regulatory constraints early so appropriate controls are built into the application and delivery plan.' },
      { question: 'Can the application work with unreliable connectivity?', answer: 'Where users need it, we can assess offline behaviour, sync conflicts, device constraints and the additional complexity needed for a dependable mobile or field workflow.' },
      { question: 'How do you estimate a custom software project?', answer: 'After understanding the scope and technical dependencies, we break the work into meaningful milestones with assumptions and risks visible rather than relying on a feature list alone.' },
    ],
  },
  'White-Label Engineering': {
    architecture:
      'White-label delivery is organised around the agency’s standards and client commitments. We establish responsibilities, technical decision rights, communication cadence, environments, code ownership and review practices so engineering extends the agency rather than creating a parallel delivery track.',
    process: [
      { title: 'Delivery alignment', description: 'Agree the client context, scope, tools, technical standards, communication rhythm and points of contact.' },
      { title: 'Technical onboarding', description: 'Review the repository, environments, backlog, quality expectations and any delivery risks before taking on work.' },
      { title: 'Embedded delivery', description: 'Contribute defined engineering work through the agency’s preferred planning, review and reporting process.' },
      { title: 'Handover or continuation', description: 'Document decisions, complete agreed handover and continue as an embedded capacity partner where required.' },
    ],
    faqs: [
      { question: 'Will you work under our agency brand?', answer: 'Yes. We can operate as a white-label delivery partner while you retain the client relationship and lead the commercial conversation.' },
      { question: 'How do you fit into an existing agency workflow?', answer: 'We align with your planning, communication, project-management and code-review practices at the start of the engagement.' },
      { question: 'Can you join a project already in progress?', answer: 'Yes. We begin with technical and delivery onboarding to understand the current state, priorities, risks and ownership boundaries.' },
      { question: 'Who owns the code and client work?', answer: 'Ownership, repository access and handover arrangements are agreed clearly so the agency and client retain the appropriate control.' },
      { question: 'Can you communicate with our client directly?', answer: 'That is your choice. We can work entirely through your team or join selected technical discussions when it helps delivery.' },
      { question: 'What engagement models are available?', answer: 'Support can be arranged for a defined project, a focused capability gap or continuing engineering capacity, with responsibilities agreed up front.' },
      { question: 'Can you follow our existing technical standards?', answer: 'Yes. We review your stack, coding conventions, testing practices, documentation and release process during onboarding, then work within the agreed standards.' },
      { question: 'How do you keep agency delivery visible?', answer: 'We agree reporting cadence, work tracking, review points and escalation routes so your delivery leads have clear visibility without unnecessary meetings.' },
      { question: 'Can you provide a dedicated engineer or a wider team?', answer: 'The engagement can be shaped around the capability needed, from focused specialist support to a coordinated team covering the required disciplines.' },
      { question: 'How do you handle confidentiality?', answer: 'We work with agreed confidentiality arrangements, least-necessary access to client systems and clear boundaries around project material and communication.' },
    ],
  },
};

const servicePage = (name: string, summary: string, audience: string[], problems: string[], deliverables: string[], capabilities: string[], related: Array<{ name: string; href: string }>) => ({
  eyebrow: 'AI SaaS & Custom Software Engineering',
  cta: { label: 'Book a Free Discovery Call', href: '#contact' },
  audienceTitle: `Who ${name} is for`, audience,
  problemsTitle: 'Business problems we help address', problems,
  deliverablesTitle: 'What we can deliver', deliverables,
  capabilitiesTitle: 'Technical capabilities', capabilities,
  architectureTitle: 'Architecture and security considerations', architecture: servicePageDetails[name]?.architecture ?? summary,
  processTitle: 'How an engagement works', process: servicePageDetails[name]?.process ?? [
    { title: 'Discovery', description: 'Clarify users, outcomes, constraints and the first useful scope.' },
    { title: 'Architecture', description: 'Agree the technical approach, dependencies and delivery plan.' },
    { title: 'Implementation', description: 'Build and review focused increments with clear communication.' },
    { title: 'Testing and deployment', description: 'Verify important workflows and prepare a controlled release.' },
  ],
  workTitle: 'Relevant work', caseStudies: relevantWorkByService[name] ?? [],
  faqTitle: `${name} FAQs`, faqs: servicePageDetails[name]?.faqs ?? [
    { question: `What does ${name} include?`, answer: summary },
    { question: 'Can you support an MVP?', answer: 'Yes. Discovery can define a focused release around the workflow and technical decisions that matter first.' },
    { question: 'How do you approach security?', answer: 'Access, data boundaries, failure states and operational requirements are considered during architecture.' },
    { question: 'Can you work with an existing team?', answer: 'Yes. Collaboration, responsibilities and handover can be agreed around the delivery model.' },
    { question: 'How are technology choices made?', answer: 'Technology follows product requirements, integration needs, operating constraints and maintenance expectations.' },
    { question: 'What happens after launch?', answer: 'Ongoing support, improvement and maintenance can be planned based on the product’s needs.' },
  ],
  relatedTitle: 'Related services', related,
});

const serviceSearchTerms: Record<string, string[]> = {
  'ai-saas-development': ['AI SaaS development', 'multi-tenant SaaS development', 'AI SaaS subscriptions'],
  'rag-ai-development': ['RAG assistant development', 'AI knowledge assistants', 'RAG evaluation'],
  'ai-agent-development': ['AI agent development', 'voice AI agents', 'business workflow automation'],
  'custom-software-development': ['custom web development', 'mobile app development', 'backend API development'],
  'founder-mvp-sprints': ['AI MVP development', 'founder MVP sprint', 'fixed-scope product development'],
  'white-label-development': ['white-label engineering', 'agency development partner', 'engineering capacity for agencies'],
};

const serviceSeo = (slug: string, name: string, description: string) => ({
  ...homepageSeo,
  metaTitle: `${name} | Aranax Technologies`,
  metaDescription: description,
  focusKeyword: serviceSearchTerms[slug][0],
  keywords: textItems(serviceSearchTerms[slug]),
  canonicalUrl: `https://aranax.tech/services/${slug}`,
  openGraphTitle: `${name} | Aranax Technologies`,
  openGraphDescription: description,
  twitterTitle: `${name} | Aranax Technologies`,
  twitterDescription: description,
  answerSummary: description,
  questions: servicePageDetails[name]?.faqs ?? [],
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    serviceType: name,
    description,
    url: `https://aranax.tech/services/${slug}`,
    provider: { '@type': 'Organization', name: 'Aranax Technologies', url: 'https://aranax.tech/' },
  },
});

const promptServices: SeedEntry[] = [
  {
    slug: 'ai-saas-development', number: '01', name: 'AI SaaS Development',
    description: 'End-to-end AI SaaS products, including multi-tenant architecture, role-based access, subscriptions, and production operations.',
    tags: textItems(['Multi-tenant', 'RBAC', 'Subscriptions']), icon: 'spark', sortOrder: 1,
    pageContent: servicePage('AI SaaS Development', 'Build an AI SaaS product from architecture through production operations.',
      ['Founders building an AI SaaS product', 'Teams preparing a multi-tenant product for launch'],
      ['A prototype needs a reliable production foundation', 'Roles, subscriptions and tenant boundaries need to work together'],
      ['Multi-tenant product architecture', 'Role-based access and account workflows', 'Subscription-ready application', 'Deployment and production operations'],
      ['Tenant isolation', 'RBAC', 'Subscriptions', 'Operational monitoring'],
      [{ name: 'Founder MVP Sprints', href: '/services/founder-mvp-sprints' }, { name: 'RAG and AI Assistants', href: '/services/rag-ai-development' }]),
    seo: serviceSeo('ai-saas-development', 'AI SaaS Development', 'End-to-end AI SaaS development with multi-tenant architecture, RBAC, subscriptions and production operations.'),
  },
  {
    slug: 'rag-ai-development', number: '02', name: 'RAG and AI Assistants',
    description: 'Assistants that answer from your approved documents and business knowledge, with source citations, access control, evaluation, and human handoff.',
    tags: textItems(['RAG', 'Evals', 'Human escalation']), icon: 'chat', sortOrder: 2,
    pageContent: servicePage('RAG and AI Assistants', 'Grounded answers from approved business knowledge, with citations and controlled access.',
      ['Teams with approved documents and knowledge', 'Products that need a dependable assistant'],
      ['Knowledge is spread across sources', 'Answers need evidence, access rules and review'],
      ['Source ingestion and retrieval', 'Citation-aware answers', 'Access controls and evaluations', 'Human handoff'],
      ['RAG', 'Source citations', 'Evaluation', 'Escalation workflows'],
      [{ name: 'AI Agents, Automation and Voice', href: '/services/ai-agent-development' }, { name: 'AI SaaS Development', href: '/services/ai-saas-development' }]),
    seo: serviceSeo('rag-ai-development', 'RAG and AI Assistants', 'RAG assistants grounded in approved documents with citations, access control, evaluation and human handoff.'),
  },
  {
    slug: 'ai-agent-development', number: '03', name: 'AI Agents, Automation and Voice',
    description: 'Tool-calling agents that connect your business systems, plus voice agents for calls and bookings, with approval steps and full execution logs.',
    tags: textItems(['Tool calling', 'Voice AI', 'Observability']), icon: 'grid', sortOrder: 3,
    pageContent: servicePage('AI Agents, Automation and Voice', 'Tool-calling and voice agents with approval checkpoints and observable execution.',
      ['Teams automating connected business workflows', 'Businesses exploring voice support for calls and bookings'],
      ['Manual handoffs slow down work', 'Voice interactions and automated actions need clear controls'],
      ['Agent and tool integration', 'Voice agent workflows for calls and bookings', 'Human approval steps', 'Execution logs and monitoring'],
      ['Tool calling', 'Voice AI', 'Human approval', 'Observability'],
      [{ name: 'RAG and AI Assistants', href: '/services/rag-ai-development' }, { name: 'Custom Web and Mobile', href: '/services/custom-software-development' }]),
    seo: serviceSeo('ai-agent-development', 'AI Agents, Automation and Voice', 'Tool-calling and voice AI agents with business integrations, approvals, execution logs and monitoring.'),
  },
  {
    slug: 'custom-software-development', number: '04', name: 'Custom Web and Mobile',
    description: 'Web apps, mobile experiences, and backend APIs, from discovery through ongoing improvement.',
    tags: textItems(['Web', 'Mobile', 'APIs']), icon: 'chat', sortOrder: 4,
    pageContent: servicePage('Custom Web and Mobile', 'Custom digital products from discovery through ongoing improvement.',
      ['Teams building web or mobile products', 'Businesses modernising internal systems'],
      ['Existing workflows do not fit off-the-shelf software', 'Apps and APIs need to evolve together'],
      ['Product discovery and UX', 'Web and mobile applications', 'Backend APIs and integrations', 'Ongoing improvement'],
      ['Web engineering', 'Mobile experiences', 'APIs', 'Integrations'],
      [{ name: 'Founder MVP Sprints', href: '/services/founder-mvp-sprints' }, { name: 'White-Label Engineering', href: '/services/white-label-development' }]),
    seo: serviceSeo('custom-software-development', 'Custom Web and Mobile', 'Custom web apps, mobile experiences and backend APIs from discovery through ongoing improvement.'),
  },
  {
    slug: 'founder-mvp-sprints', number: '05', name: 'Founder MVP Sprints',
    description: 'A fixed-scope build that takes an AI product from idea to a working version with first users, covering architecture, core features, and deployment.',
    tags: textItems(['Fixed scope', 'Fast launch', 'Startup-ready']), icon: 'spark', sortOrder: 5,
    pageContent: servicePage('Founder MVP Sprints', 'A focused first release for founders ready to validate an AI product with real users.',
      ['Founders with a defined AI product idea', 'Startups preparing to test a first version'],
      ['The idea has not yet become a usable product', 'A broad roadmap makes the first release hard to scope'],
      ['Discovery and fixed-scope plan', 'Core architecture and features', 'Working product for first users', 'Deployment and handover'],
      ['MVP scoping', 'Product architecture', 'AI integration', 'Deployment'],
      [{ name: 'AI SaaS Development', href: '/services/ai-saas-development' }, { name: 'Custom Web and Mobile', href: '/services/custom-software-development' }]),
    seo: serviceSeo('founder-mvp-sprints', 'Founder MVP Sprints', 'Fixed-scope AI product MVP development, from idea and architecture to core features, deployment and first users.'),
  },
  {
    slug: 'white-label-development', number: '06', name: 'White-Label Engineering',
    description: 'Engineering capacity for digital agencies, aligned to their delivery process, standards, and client relationships.',
    tags: textItems(['Agency partners', 'Capacity', 'Delivery']), icon: 'grid', sortOrder: 6,
    pageContent: servicePage('White-Label Engineering', 'Dependable engineering capacity that fits an agency’s delivery model and client relationships.',
      ['Digital agencies extending engineering capacity', 'Delivery teams needing specialist support'],
      ['Project demand exceeds available capacity', 'External engineers need to fit existing standards and communication'],
      ['Embedded engineering support', 'Delivery planning and implementation', 'Code review and documentation', 'Handover aligned to agency process'],
      ['Agency collaboration', 'Web and mobile delivery', 'AI and backend engineering', 'Quality practices'],
      [{ name: 'Custom Web and Mobile', href: '/services/custom-software-development' }, { name: 'AI SaaS Development', href: '/services/ai-saas-development' }]),
    seo: serviceSeo('white-label-development', 'White-Label Engineering', 'Engineering capacity for digital agencies aligned with their delivery process, standards and client relationships.'),
  },
];

const caseStudies: SeedEntry[] = [
  {
    slug: 'ema-smarter-inbox-management',
    category: 'AI Email Productivity',
    name: 'EMA - Smarter Inbox Management',
    tagline: 'From a crowded inbox to a prioritised workday',
    description:
      'An AI-powered email assistant that prioritises messages, prepares contextual replies, identifies follow-ups and turns inbox activity into an organised workflow.',
    tags: textItems(['Agentic AI', 'Email Automation', 'Productivity SaaS']),
    challenge:
      'Professionals need to prioritise emails, understand requests, respond, schedule meetings and track follow-ups - work traditional inboxes largely leave to the user.',
    outcome:
      'EMA turns a passive inbox into an organised workflow, helping users move from messages to meaningful next actions.',
    contribution:
      'Product strategy, UI/UX design, AI workflow engineering, web and mobile development, backend systems, integrations and deployment.',
    websiteUrl: 'https://ema.aranax.tech',
    visual: 'ema',
    sortOrder: 1,
  },
  {
    slug: 'docunova-understand-contracts-faster',
    category: 'AI Document Intelligence',
    name: 'DocuNova - Understand Contracts Faster',
    tagline: 'Turning dense agreements into decision-ready information',
    description:
      'Transforms complex contracts into structured summaries, important obligations, renewal dates, potential risks and document-grounded answers.',
    tags: textItems(['RAG', 'Document AI', 'B2B SaaS']),
    challenge:
      'Important obligations, deadlines and risks can be difficult to locate quickly across long, complex business documents.',
    outcome:
      'DocuNova makes contract information easier to review, discuss and act on without losing document context.',
    contribution:
      'Product design and engineering for document ingestion, retrieval workflows, structured analysis and a secure SaaS experience.',
    websiteUrl: 'https://docunova.app',
    visual: 'docunova',
    sortOrder: 2,
  },
  {
    slug: 'uniecho-ai-student-assistant',
    category: 'Conversational AI for Education',
    name: 'UniEcho - AI Student Assistant',
    tagline: 'One reliable assistant across the entire student journey',
    description:
      'A multilingual university assistant that answers questions about admissions, examinations, fees, results and student services.',
    tags: textItems(['Conversational AI', 'Multilingual', 'Education']),
    challenge:
      'Students need clear answers across admissions, examinations, fees, results and services - often across more than one language.',
    outcome:
      'UniEcho gives students a single, accessible starting point for navigating essential university information.',
    contribution:
      'Conversational product design, multilingual knowledge experiences and scalable assistant engineering for student services.',
    websiteUrl: 'https://uniecho.io',
    visual: 'uniecho',
    sortOrder: 3,
  },
  {
    slug: 'doubtace-exam-ready-doubt-resolution',
    category: 'AI-Powered Learning',
    name: 'DoubtAce - Exam-Ready Doubt Resolution',
    tagline: 'Helping students understand how an answer should be solved and presented',
    description:
      'Turns photographed questions and textbook content into board-aware, step-by-step explanations designed around examination requirements.',
    tags: textItems(['EdTech', 'OCR', 'Generative AI']),
    challenge:
      'Students need help turning printed and photographed study material into explanations that reflect their examination requirements.',
    outcome:
      'DoubtAce makes complex questions more approachable with structured, step-by-step learning support.',
    contribution:
      'Learning experience design, OCR workflows and generative AI engineering for contextual explanations.',
    websiteUrl: 'https://doubtace.com',
    visual: 'doubtace',
    sortOrder: 4,
  },
  {
    slug: 'gloziia-salon-marketplace-and-management-platform',
    category: 'Beauty Marketplace & Operations',
    name: 'Gloziia - Salon Marketplace and Management Platform',
    tagline: 'Connecting customer discovery with salon operations',
    description:
      'A two-sided platform that helps customers discover and book beauty services while enabling salon partners to manage appointments, branches, employees and revenue.',
    tags: textItems(['Marketplace', 'Mobile App', 'Operations SaaS']),
    challenge:
      'Beauty businesses need to serve customers while coordinating appointments, branches, employees and everyday operations.',
    outcome:
      'Gloziia connects salon discovery and booking with the operational tools partners need to run their businesses.',
    contribution:
      'Marketplace product design, mobile experiences and operational SaaS workflows for beauty service partners.',
    websiteUrl: 'https://gloziia.com',
    visual: 'gloziia',
    sortOrder: 5,
  },
  {
    slug: 'glamsync-saas-for-independent-makeup-artists',
    category: 'Vertical SaaS for Beauty Professionals',
    name: 'GlamSync - SaaS for Independent Makeup Artists',
    tagline: 'Giving artists one calm system for running the business behind their craft',
    description:
      'Combines appointments, client records, invoicing, reminders, portfolios, marketing and inventory in one workspace for beauty professionals.',
    tags: textItems(['Vertical SaaS', 'CRM', 'Business Automation']),
    challenge:
      'Beauty professionals often manage appointments, clients, payments, marketing and inventory across disconnected tools.',
    outcome:
      'GlamSync brings the day-to-day business behind beauty services into one focused workspace.',
    contribution:
      'Vertical SaaS product design, CRM workflows and business automation engineering for independent professionals.',
    websiteUrl: 'https://glamsync.app',
    visual: 'glamsync',
    sortOrder: 6,
  },
];

const caseStudiesWithPages: SeedEntry[] = caseStudies.map((entry) => ({
  ...entry,
  pageContent: {
    context: { label: 'Project context', title: 'Built around a real user need.', audience: `Intended users: ${String(entry.category)} audiences with a defined workflow to improve.`, copy: 'This case study describes the product and delivery scope using available project material. It does not claim unverified commercial or performance results.' },
    challenge: { label: 'The challenge', title: 'What needed to change', copy: 'The work required a coherent product workflow, clear information and an implementation approach that can support the people expected to use it.' },
    contribution: { label: 'Aranax contribution', title: 'How we supported the product', copy: 'The contribution combined product and engineering work around the stated scope, considering user experience alongside systems, integrations and operational details.' },
    outcome: { label: 'The outcome', title: 'Designed for a more useful workflow.', copy: 'The outcome is presented as a qualitative product benefit based on available project material. No unverified traffic, revenue or adoption metrics are claimed.' },
    cta: { label: 'Start a conversation', title: 'Have a similar product challenge?', description: 'Discuss the users, workflows and delivery considerations behind your product with our engineering team.', button: { label: 'Book a Free Discovery Call', href: '#contact' } },
  },
  seo: {
    ...homepageSeo,
    metaTitle: `${String(entry.name).slice(0, 42)} | Aranax Case Study`,
    metaDescription: String(entry.description),
    focusKeyword: String(entry.name),
    keywords: textItems([String(entry.name), String(entry.category), ...((entry.tags as Array<{ text: string }> | undefined)?.map(({ text }) => text) ?? [])]),
    canonicalUrl: `https://aranax.tech/case-studies/${entry.slug}`,
    openGraphTitle: `${String(entry.name).slice(0, 42)} | Aranax Case Study`,
    openGraphDescription: String(entry.description),
    openGraphType: 'article',
    twitterTitle: `${String(entry.name).slice(0, 42)} | Aranax Case Study`,
    twitterDescription: String(entry.description),
    answerSummary: String(entry.description),
    questions: [],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: String(entry.name),
      description: String(entry.description),
      url: `https://aranax.tech/case-studies/${entry.slug}`,
      author: { '@type': 'Organization', name: 'Aranax Technologies' },
    },
  },
}));

const teamMembers: SeedEntry[] = [
  {
    slug: 'sanjoy-chowdhury',
    initials: 'SC',
    name: 'Sanjoy Chowdhury',
    role: 'Founder & AI SaaS Architect',
    avatarStyle: 'av1',
    profileUrl: 'https://www.linkedin.com/in/sanjoyc/',
    sortOrder: 1,
  },
  {
    slug: 'kausik-pan',
    initials: 'KP',
    name: 'Kausik Pan',
    role: 'Product Manager & Web Solutions Lead',
    avatarStyle: 'av2',
    profileUrl: 'https://www.linkedin.com/in/kousik-pan-395a21116/',
    sortOrder: 2,
  },
  {
    slug: 'sabyasachi-tripathi',
    initials: 'ST',
    name: 'Sabyasachi Tripathi',
    role: 'Full-Stack & AI Engineer',
    avatarStyle: 'av3',
    profileUrl: 'https://www.linkedin.com/in/sabyasachi-tripathy-a402381a9/',
    sortOrder: 3,
  },
  {
    slug: 'avigyan-das',
    initials: 'AD',
    name: 'Avigyan Das',
    role: 'Head of Design',
    avatarStyle: 'av4',
    profileUrl: 'https://www.linkedin.com/in/avigyandas/',
    sortOrder: 4,
  },
];

async function seedCollection(
  strapi: Core.Strapi,
  uid: string,
  entries: SeedEntry[]
) {
  const documents = strapi.documents(uid as never) as any;
  return Promise.all(entries.map(async (entry) => {
    const existing = await documents.findFirst({ filters: { slug: entry.slug } });
    const document = existing
      ? await documents.update({
          documentId: existing.documentId,
          data: entry,
          status: 'published',
        })
      : await documents.create({ data: entry, status: 'published' });
    return document;
  }));
}

async function seedSingleType(
  strapi: Core.Strapi,
  uid: string,
  data: Record<string, unknown>
) {
  const documents = strapi.documents(uid as never) as any;
  const existing = await documents.findFirst();

  if (!existing) return documents.create({ data, status: 'published' });
  return documents.update({
    documentId: existing.documentId,
    data,
    status: 'published',
  });
}

async function enablePublicRead(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) return;

  const actions = [
    'api::service.service.find',
    'api::service.service.findOne',
    'api::case-study.case-study.find',
    'api::case-study.case-study.findOne',
    'api::team-member.team-member.find',
    'api::team-member.team-member.findOne',
    'api::site-setting.site-setting.find',
    'api::home-page.home-page.find',
    'api::hero-section.hero-section.find',
    'api::hero-section.hero-section.findOne',
    'api::services-section.services-section.find',
    'api::services-section.services-section.findOne',
    'api::why-aranax-section.why-aranax-section.find',
    'api::why-aranax-section.why-aranax-section.findOne',
    'api::case-studies-section.case-studies-section.find',
    'api::case-studies-section.case-studies-section.findOne',
    'api::about-section.about-section.find',
    'api::about-section.about-section.findOne',
    'api::contact-section.contact-section.find',
    'api::contact-section.contact-section.findOne',
  ];

  const permissions = strapi.db.query('plugin::users-permissions.permission');

  for (const action of actions) {
    const existing = await permissions.findOne({
      where: { action, role: publicRole.id },
    });

    if (!existing) {
      await permissions.create({ data: { action, role: publicRole.id } });
    }
  }
}

async function ensureHomePageComposition(
  strapi: Core.Strapi,
  sections: Record<string, { documentId: string }>
) {
  const documents = strapi.documents('api::home-page.home-page') as any;
  const homePage = await documents.findFirst({
    populate: Object.fromEntries(Object.keys(sections).map((field) => [field, true])),
  });
  const storedHomePage = homePage
    ? await strapi.db.query('api::home-page.home-page').findOne({
        where: { documentId: homePage.documentId, publishedAt: null },
      })
    : null;

  const sectionsChanged = Object.entries(sections).some(
    ([field, section]) => homePage?.[field]?.documentId !== section.documentId
  );

  if (homePage && (storedHomePage?.title !== 'Homepage' || sectionsChanged)) {
    await documents.update({
      documentId: homePage.documentId,
      data: {
        title: 'Homepage',
        ...Object.fromEntries(
          Object.entries(sections).map(([field, section]) => [field, section.documentId])
        ),
      },
      status: 'published',
    });
  }
}

async function ensureHomePageMainField(strapi: Core.Strapi) {
  const contentTypeService = strapi
    .plugin('content-manager')
    .service('content-types') as any;
  const contentType = contentTypeService.findContentType('api::home-page.home-page');
  const configuration = await contentTypeService.findConfiguration(contentType);

  if (
    configuration.settings.mainField !== 'title' ||
    configuration.settings.defaultSortBy !== 'title'
  ) {
    await contentTypeService.updateConfiguration(contentType, {
      ...configuration,
      settings: {
        ...configuration.settings,
        mainField: 'title',
        defaultSortBy: 'title',
      },
    });
  }
}

async function ensureHomePageSeo(strapi: Core.Strapi) {
  const documents = strapi.documents('api::home-page.home-page') as any;
  const homePage = await documents.findFirst({
    populate: { seo: { populate: { keywords: true } } },
  });
  const currentSeo = homePage?.seo;

  if (!homePage || !currentSeo || currentSeo.canonicalUrl) return;

  const mergedScalarSeo = Object.fromEntries(
    Object.entries(homepageSeo)
      .filter(([field]) => field !== 'keywords')
      .map(([field, value]) => [field, currentSeo[field] ?? value])
  );

  await documents.update({
    documentId: homePage.documentId,
    data: {
      seo: {
        ...currentSeo,
        ...mergedScalarSeo,
        id: currentSeo.id,
        keywords:
          currentSeo.keywords?.length > 0
            ? currentSeo.keywords.map(({ text }: { text: string }) => ({ text }))
            : homepageSeo.keywords,
      },
    },
    status: 'published',
  });
}

const serviceHeroImages = {
  'ai-saas-development': {
    filename: 'ai-saas-architecture.png',
    alternativeText: 'Layered AI SaaS application architecture illustration',
    caption: 'AI SaaS platform architecture',
  },
  'founder-mvp-sprints': {
    filename: 'founder-mvp-sprints-light.png',
    alternativeText: 'Founder MVP journey from idea and architecture to a working product',
    caption: 'Founder MVP product sprint',
  },
  'rag-ai-development': {
    filename: 'rag-ai-assistant-architecture.png',
    alternativeText: 'RAG AI assistant and knowledge retrieval illustration',
    caption: 'Retrieval-augmented AI assistant',
  },
  'ai-agent-development': {
    filename: 'ai-agents-automation-voice.png',
    alternativeText: 'Voice AI and tool-calling agent workflow with approval and execution logs',
    caption: 'AI agents, automation and voice',
  },
  'custom-software-development': {
    filename: 'custom-web-mobile-development.png',
    alternativeText: 'Custom web and mobile product development illustration',
    caption: 'Custom web and mobile development',
  },
  'white-label-development': {
    filename: 'white-label-engineering.png',
    alternativeText: 'White-label software engineering delivery illustration',
    caption: 'White-label engineering delivery',
  },
} as const;

async function ensureServiceHeroImage(
  strapi: Core.Strapi,
  image: (typeof serviceHeroImages)[keyof typeof serviceHeroImages]
) {
  const { filename } = image;
  const existing = await strapi.db.query('plugin::upload.file').findOne({
    where: { name: filename },
  });

  if (existing) return existing;

  const filepath = path.join(process.cwd(), 'public', 'seed-assets', filename);
  const file = await stat(filepath);
  const [uploaded] = await (strapi.plugin('upload').service('upload') as any).upload({
    data: {
      fileInfo: {
        name: filename,
        alternativeText: image.alternativeText,
        caption: image.caption,
      },
    },
    files: {
      filepath,
      originalFilename: filename,
      mimetype: 'image/png',
      size: file.size,
    },
  });

  return uploaded;
}

export async function seedLandingContent(strapi: Core.Strapi) {
  const heroImages = Object.fromEntries(
    await Promise.all(
      Object.entries(serviceHeroImages).map(async ([slug, image]) => [
        slug,
        await ensureServiceHeroImage(strapi, image),
      ])
    )
  ) as Record<string, { id: number }>;
  const seededServices = await seedCollection(
    strapi,
    'api::service.service',
    promptServices.map((service) => ({
      ...service,
      heroImage: heroImages[service.slug].id,
    }))
  );
  const seededCaseStudies = await seedCollection(
    strapi,
    'api::case-study.case-study',
    caseStudiesWithPages
  );
  const seededTeamMembers = await seedCollection(
    strapi,
    'api::team-member.team-member',
    teamMembers
  );

  await seedSingleType(strapi, 'api::site-setting.site-setting', {
    siteName: 'Aranax Technologies',
    siteUrl: 'https://aranax.tech',
    logoAssetPath: '/assets/images/logo.png',
    logoAlternativeText: 'Aranax Technologies',
    navigation: [
      { label: 'Services', href: '#services', style: 'default' },
      { label: 'Case Studies', href: '#case-studies', style: 'default' },
      { label: 'About', href: '#about', style: 'default' },
      { label: "Let's Talk", href: '#contact', style: 'primary' },
    ],
    expertiseTicker: textItems([
      'AI Strategy',
      'Chatbot Development',
      'Custom AI Tools',
      'LLM Integration',
      'Data Intelligence',
      'Process Automation',
      'Voice AI',
      'RAG Systems',
    ]),
    footerText: '© 2026 Aranax Technologies. All rights reserved.',
  });

  const [heroSection] = await seedCollection(strapi, 'api::hero-section.hero-section', [
    {
      name: 'Homepage Hero',
      slug: 'homepage-hero',
      eyebrow: 'AI SaaS & Custom Software Engineering',
      heading: 'Turn Your Ideas into\n*Production-Ready* AI & SaaS Products',
      description:
        'Aranax helps founders and teams **build and launch AI-powered SaaS products, custom software, and web and mobile applications**. From MVP and architecture to AI integration and launch, we provide focused engineering support.',
      primaryCta: {
        label: 'Book a Free Discovery Call',
        href: '#contact',
        style: 'primary',
      },
      secondaryCta: {
        label: 'Explore Our Work',
        href: '#case-studies',
        style: 'secondary',
      },
      trustItems: textItems([
        'Architecture-led engineering',
        'Full-stack product delivery',
        'Secure, maintainable applications',
        'International collaboration',
      ]),
    },
  ]);

  const [servicesSection] = await seedCollection(
    strapi,
    'api::services-section.services-section',
    [
      {
        name: 'Homepage Services',
        slug: 'homepage-services',
        eyebrow: 'What We Build',
        heading: 'Product engineering for\nevery stage of growth',
        description:
          'From AI SaaS and grounded assistants to voice agents, custom apps, founder MVPs and agency engineering, we build products around your workflows and business goals.',
        services: seededServices.map(({ documentId }) => documentId),
      },
    ]
  );

  const [whyAranaxSection] = await seedCollection(
    strapi,
    'api::why-aranax-section.why-aranax-section',
    [
      {
        name: 'Homepage Why Aranax',
        slug: 'homepage-why-aranax',
        eyebrow: 'Why Aranax',
        heading: 'Architecture first.\nAI second.\nBusiness outcome always.',
        description:
          'Many AI prototypes look impressive during a demonstration but fail when exposed to real customers, unreliable data, high usage and security requirements.\nAranax approaches AI development as product engineering.',
        listHeading: 'We consider',
        considerations: textItems([
          'Multi-tenant architecture',
          'Data privacy and user permissions',
          'Retrieval quality and hallucination controls',
          'AI evaluation and observability',
          'Human review and escalation',
          'Token consumption and infrastructure costs',
          'API reliability and failure handling',
          'Product analytics and usage limits',
          'Security, deployment and long-term maintainability',
        ]),
        outcome:
          'The result is not simply an AI feature. It is a product designed to operate reliably in production.',
      },
    ]
  );

  const [caseStudiesSection] = await seedCollection(
    strapi,
    'api::case-studies-section.case-studies-section',
    [
      {
        name: 'Homepage Case Studies',
        slug: 'homepage-case-studies',
        eyebrow: 'Selected Case Studies',
        heading: 'Products engineered around real business problems.',
        description:
          'From AI assistants to industry-specific SaaS platforms, we help founders and businesses turn complex ideas into secure, scalable and production-ready digital products.',
        caseStudies: seededCaseStudies.map(({ documentId }) => documentId),
      },
    ]
  );

  const [aboutSection] = await seedCollection(strapi, 'api::about-section.about-section', [
    {
      name: 'Homepage About',
      slug: 'homepage-about',
      eyebrow: 'Our Story',
      heading: 'We build beyond the AI prototype.',
      description:
        'Founded in 2015, Aranax Technologies helps startups, agencies and enterprises design, build and scale AI SaaS, RAG, web and mobile products.\n\nLed by more than 25 years of software architecture experience, our team combines strategic thinking with practical engineering to create secure, scalable systems built for real-world use.',
      teamHeading: 'Core Team',
      statistics: [
        { value: 25, suffix: '+', label: 'Years in Software Architecture' },
        { value: 10, suffix: '+', label: 'Years Building Products' },
        { value: 32, suffix: '+', label: 'Projects Delivered' },
        { value: 14, suffix: '', label: 'Team Members' },
      ],
      teamMembers: seededTeamMembers.map(({ documentId }) => documentId),
      pageContent: {
        eyebrow: 'About Aranax',
        title: 'Engineering products for real-world use.',
        workTitle: 'How we work',
        workDescription: 'Aranax brings product thinking and engineering together around the practical decisions that shape a useful, maintainable application: users, workflows, architecture, delivery, deployment and ongoing improvement.',
        teamTitle: 'Core team',
        profileLabel: 'Professional profile',
      },
      seo: {
        ...homepageSeo,
        metaTitle: 'About Aranax Technologies | AI & SaaS Product Engineering',
        metaDescription: 'Meet Aranax Technologies, a Kolkata-based team building AI SaaS products, RAG and voice agents, custom apps and digital products for founders and agencies.',
        focusKeyword: 'Aranax Technologies',
        keywords: textItems(['Aranax Technologies', 'AI product engineering team', 'SaaS development company Kolkata']),
        canonicalUrl: 'https://aranax.tech/about',
        openGraphTitle: 'About Aranax Technologies | AI & SaaS Product Engineering',
        openGraphDescription: 'Meet the team behind Aranax Technologies and its AI, SaaS, web and mobile product engineering work.',
        twitterTitle: 'About Aranax Technologies | AI & SaaS Product Engineering',
        twitterDescription: 'Meet the team behind Aranax Technologies and its AI, SaaS, web and mobile product engineering work.',
        answerSummary: 'Aranax Technologies is a product engineering team based in Kolkata, India. It works with founders, businesses and agencies on AI SaaS, RAG and voice agents, web and mobile apps, MVPs and white-label engineering.',
        questions: [],
        structuredData: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About Aranax Technologies', url: 'https://aranax.tech/about' },
      },
    },
  ]);

  const [contactSection] = await seedCollection(
    strapi,
    'api::contact-section.contact-section',
    [
      {
        name: 'Homepage Contact',
        slug: 'homepage-contact',
        eyebrow: 'Get in Touch',
        heading: "Let's build\nsomething\nextraordinary.",
        description:
          "Whether you have a clear brief or just a spark of an idea, we'd love to hear from you. Our team typically responds within 24 hours.",
        email: 'hello@aranax.tech',
        location: 'Kolkata, India - Richmond, USA',
      },
    ]
  );

  const homePageSections = {
    heroSection,
    servicesSection,
    whyAranaxSection,
    caseStudiesSection,
    aboutSection,
    contactSection,
  };

  await seedSingleType(strapi, 'api::home-page.home-page', {
    title: 'Homepage',
    seo: homepageSeo,
    ...Object.fromEntries(
      Object.entries(homePageSections).map(([field, section]) => [field, section.documentId])
    ),
    buyerSegments: {
      eyebrow: 'Who We Help', heading: 'Engineering support shaped around *how you deliver.*',
      items: [
        { title: 'Startups and SaaS founders', challenge: 'Turn a product concept or early prototype into an application customers can use and the team can operate.', service: 'Founder MVP sprints, AI SaaS development and multi-tenant product engineering.', deliverable: 'A clear technical approach and a scoped path from discovery to release.', cta: 'Discuss a product build', href: '#contact' },
        { title: 'Software and digital agencies', challenge: 'Add engineering capacity without losing control of the client relationship or delivery quality.', service: 'White-label engineering, web and mobile delivery, AI integration.', deliverable: 'A collaboration model aligned to the agency’s project and communication workflow.', cta: 'Discuss agency support', href: '#contact' },
        { title: 'Businesses and institutions', challenge: 'Modernise a workflow, make knowledge easier to use or connect fragmented tools.', service: 'RAG assistants, tool-calling and voice agents, automation, custom software and system integration.', deliverable: 'A practical solution design that accounts for users, data, security and maintenance.', cta: 'Discuss an operational challenge', href: '#contact' },
      ],
    },
    processSection: { eyebrow: 'How We Work', heading: 'A practical path from idea to *operating product.*', steps: [
      { number: '01', title: 'Discovery', description: 'We learn what users need, what success looks like and the constraints that shape delivery.' }, { number: '02', title: 'Architecture', description: 'We turn requirements into a clear technical approach, delivery scope and system decisions.' }, { number: '03', title: 'Implementation', description: 'We build in focused increments, with regular communication around progress and decisions.' }, { number: '04', title: 'Testing', description: 'We verify key workflows, integrations and release readiness before launch.' }, { number: '05', title: 'Deployment', description: 'We support a controlled release and handover suited to the product and its operating environment.' }, { number: '06', title: 'Ongoing Support', description: 'We can continue improving, maintaining and extending the application as needs change.' },
    ] },
    faqSection: { eyebrow: 'FAQ', heading: 'Questions founders and delivery teams *ask early.*', items: homepageSeo.questions },
    finalCta: { eyebrow: 'Start a conversation', heading: 'Have an AI or Digital Product in Mind?', description: "Tell us about your SaaS product, assistant, agent, app or MVP. We'll discuss your requirements, architecture, delivery approach and next steps.", cta: { label: 'Book a Technical Discovery Call', href: '#contact' } },
  });

  await ensureHomePageComposition(strapi, homePageSections);
  await ensureHomePageSeo(strapi);
  await ensureHomePageMainField(strapi);
  await enablePublicRead(strapi);
}
