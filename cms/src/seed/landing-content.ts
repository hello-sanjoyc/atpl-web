import type { Core } from '@strapi/strapi';
import { stat } from 'node:fs/promises';
import path from 'node:path';

type SeedEntry = Record<string, unknown> & { slug: string };

const textItems = (items: string[]) => items.map((text) => ({ text }));

const homepageSeo = {
  metaTitle: 'AI SaaS Development Company | RAG & Agentic AI | Aranax Technologies',
  metaDescription:
    'Aranax Technologies designs and builds scalable AI SaaS platforms, RAG applications, intelligent agents and workflow automation for startups, agencies and enterprises.',
  focusKeyword: 'AI SaaS development company',
  keywords: textItems([
    'AI SaaS development',
    'RAG applications',
    'agentic AI',
    'AI workflow automation',
    'LLM integration',
  ]),
  canonicalUrl: 'https://aranax.tech/',
  preventIndexing: false,
  preventFollowing: false,
  openGraphTitle:
    'AI SaaS Development Company | RAG & Agentic AI | Aranax Technologies',
  openGraphDescription:
    'Aranax Technologies designs and builds scalable AI SaaS platforms, RAG applications, intelligent agents and workflow automation for startups, agencies and enterprises.',
  openGraphType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'AI SaaS Development Company | RAG & Agentic AI | Aranax Technologies',
  twitterDescription:
    'Aranax Technologies designs and builds scalable AI SaaS platforms, RAG applications, intelligent agents and workflow automation for startups, agencies and enterprises.',
  answerSummary:
    'Aranax Technologies helps startups, growing businesses and digital agencies build AI-powered SaaS platforms, custom software, web applications and mobile applications through architecture-led, full-stack engineering.',
  questions: [
    { question: 'What does Aranax Technologies build?', answer: 'Aranax builds AI-powered SaaS platforms, custom software, RAG assistants, workflow automation, web applications and mobile applications.' },
    { question: 'Can Aranax support an AI SaaS MVP?', answer: 'Yes. Engagements can begin with discovery and a focused MVP scope before progressing to a production-ready application.' },
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
      'Retrieval-Augmented Generation',
      'Agentic AI',
      'Workflow Automation',
    ],
  },
};

const services: SeedEntry[] = [
  {
    slug: 'ai-saas-development',
    number: '01',
    name: 'AI SaaS Development',
    description:
      'We design and build production-ready AI SaaS platforms with secure architecture, user roles, subscriptions, usage controls, dashboards, APIs and scalable cloud infrastructure.',
    tags: textItems(['SaaS Architecture', 'LLM Integration', 'Multi-tenant']),
    icon: 'spark',
    sortOrder: 1,
  },
  {
    slug: 'rag-ai-assistants',
    number: '02',
    name: 'RAG & AI Assistants',
    description:
      'We build grounded AI assistants that answer from approved documents, websites and databases, provide source-based responses and escalate uncertain cases to human teams.',
    tags: textItems(['RAG', 'AI Chatbots', 'Knowledge Search']),
    icon: 'chat',
    sortOrder: 2,
  },
  {
    slug: 'agentic-ai-automation',
    number: '03',
    name: 'Agentic AI Automation',
    description:
      'We develop intelligent AI agents that connect with business tools, execute multi-step workflows, validate outputs and reduce repetitive manual work across operations.',
    tags: textItems(['AI Agents', 'Automation', 'API Integration']),
    icon: 'grid',
    sortOrder: 3,
  },
];

const relevantWorkByService: Record<string, Array<{ name: string; url: string; description: string }>> = {
  'AI SaaS Development': [
    { name: 'EMA - Smarter Inbox Management', url: 'https://ema.aranax.tech', description: 'AI email productivity and workflow support.' },
    { name: 'DocuNova - Understand Contracts Faster', url: 'https://docunova.app', description: 'Document intelligence and structured knowledge workflows.' },
  ],
  'Multi-Tenant SaaS Development': [
    { name: 'Gloziia - Salon Marketplace and Management Platform', url: 'https://gloziia.com', description: 'Marketplace and operations workflows for beauty businesses.' },
    { name: 'GlamSync - SaaS for Independent Makeup Artists', url: 'https://glamsync.app', description: 'A focused business workspace for independent professionals.' },
  ],
  'RAG and AI Assistants': [
    { name: 'DocuNova - Understand Contracts Faster', url: 'https://docunova.app', description: 'Structured analysis and document-grounded answers.' },
    { name: 'UniEcho - AI Student Assistant', url: 'https://uniecho.io', description: 'A multilingual student-information assistant.' },
  ],
  'AI Agents and Automation': [
    { name: 'EMA - Smarter Inbox Management', url: 'https://ema.aranax.tech', description: 'Email prioritisation and follow-up workflows.' },
    { name: 'UniEcho - AI Student Assistant', url: 'https://uniecho.io', description: 'Conversational assistance across student service questions.' },
  ],
  'Custom Web and Mobile Development': [
    { name: 'Gloziia - Salon Marketplace and Management Platform', url: 'https://gloziia.com', description: 'Customer discovery, booking and operational workflows.' },
    { name: 'DoubtAce - Exam-Ready Doubt Resolution', url: 'https://doubtace.com', description: 'Learning support built around photographed and printed content.' },
  ],
  'White-Label Engineering': [
    { name: 'Selected product work', url: '/#case-studies', description: 'Explore the product categories and engineering contributions shown on the homepage.' },
  ],
};

const servicePage = (name: string, summary: string, audience: string[], problems: string[], deliverables: string[], capabilities: string[], related: Array<{ name: string; href: string }>) => ({
  eyebrow: 'AI SaaS & Custom Software Engineering',
  cta: { label: 'Book a Free Discovery Call', href: '#contact' },
  audienceTitle: `Who ${name} is for`, audience,
  problemsTitle: 'Business problems we help address', problems,
  deliverablesTitle: 'What we can deliver', deliverables,
  capabilitiesTitle: 'Technical capabilities', capabilities,
  architectureTitle: 'Architecture and security considerations', architecture: summary,
  processTitle: 'How an engagement works', process: [
    { title: 'Discovery', description: 'Clarify users, outcomes, constraints and the first useful scope.' },
    { title: 'Architecture', description: 'Agree the technical approach, dependencies and delivery plan.' },
    { title: 'Implementation', description: 'Build and review focused increments with clear communication.' },
    { title: 'Testing and deployment', description: 'Verify important workflows and prepare a controlled release.' },
  ],
  workTitle: 'Relevant work', caseStudies: relevantWorkByService[name] ?? [],
  faqTitle: `${name} FAQs`, faqs: [
    { question: `What does ${name} include?`, answer: summary },
    { question: 'Can you support an MVP?', answer: 'Yes. Discovery can define a focused release around the workflow and technical decisions that matter first.' },
    { question: 'How do you approach security?', answer: 'Access, data boundaries, failure states and operational requirements are considered during architecture.' },
    { question: 'Can you work with an existing team?', answer: 'Yes. Collaboration, responsibilities and handover can be agreed around the delivery model.' },
    { question: 'How are technology choices made?', answer: 'Technology follows product requirements, integration needs, operating constraints and maintenance expectations.' },
    { question: 'What happens after launch?', answer: 'Ongoing support, improvement and maintenance can be planned based on the product’s needs.' },
  ],
  relatedTitle: 'Related services', related,
});

const promptServices: SeedEntry[] = [
  { slug: 'ai-saas-development', number: '01', name: 'AI SaaS Development', description: 'We design and build AI SaaS products from product workflow through production release, including application architecture, LLM integration, roles, dashboards, APIs, subscriptions and operating foundations.', tags: textItems(['AI products', 'SaaS architecture', 'Product delivery']), icon: 'spark', sortOrder: 1, pageContent: servicePage('AI SaaS Development', 'For founders and product teams building an AI-enabled SaaS product, with attention to MVP scope, subscriptions, APIs, dashboards and production readiness.', ['Founders planning an AI-enabled SaaS MVP', 'Teams replacing a prototype with an operational application', 'Businesses creating a new AI customer workflow'], ['A promising concept has no clear product or technical path', 'A demo does not account for users, permissions, cost or reliability', 'Product, backend and AI work need to move together'], ['Product and technical discovery', 'Application architecture and delivery plan', 'Web application, APIs, dashboards and user workflows', 'AI integration, testing and launch support'], ['LLM-enabled workflows', 'User roles and account experiences', 'Third-party integrations', 'Usage-aware product design'], [{ name: 'Multi-Tenant SaaS Development', href: '/services/multi-tenant-saas-development' }, { name: 'RAG and AI Assistants', href: '/services/rag-ai-development' }]), seo: { ...homepageSeo, metaTitle: 'AI SaaS Development Services | Aranax Technologies', metaDescription: 'Build an AI SaaS product with architecture, application engineering and practical AI integration from Aranax Technologies.', answerSummary: 'Aranax helps product teams plan, build and launch AI SaaS applications with architecture-led engineering.' } },
  { slug: 'multi-tenant-saas-development', number: '02', name: 'Multi-Tenant SaaS Development', description: 'We build SaaS applications for multiple customer organisations with tenant-aware design, roles and permissions, data access controls, account administration, billing-ready workflows and maintainable backend systems.', tags: textItems(['Tenant design', 'RBAC', 'Backend systems']), icon: 'chat', sortOrder: 2, pageContent: servicePage('Multi-Tenant SaaS Development', 'For SaaS products that need sound tenant isolation, RBAC, PostgreSQL-ready modelling, authorisation, data security, scaling and observability.', ['SaaS founders serving multiple customer organisations', 'Teams replacing a single-customer application', 'Businesses building a partner or customer portal'], ['Customer data and administration are not separated cleanly', 'Roles and authorisation become harder as the product grows', 'Onboarding and billing workflows are disconnected'], ['Tenant-aware application design', 'Role and permission model', 'Account administration and onboarding', 'Backend APIs and deployment support'], ['Tenant isolation strategies', 'RBAC and authorisation', 'PostgreSQL-ready data modelling', 'Observability-aware workflows'], [{ name: 'AI SaaS Development', href: '/services/ai-saas-development' }, { name: 'Custom Software Development', href: '/services/custom-software-development' }]), seo: { ...homepageSeo, metaTitle: 'Multi-Tenant SaaS Development | Aranax Technologies', metaDescription: 'Design and build multi-tenant SaaS applications with tenant-aware architecture, roles, permissions and scalable backend workflows.', answerSummary: 'Aranax designs multi-tenant SaaS products with deliberate data boundaries and operational foundations.' } },
  { slug: 'rag-ai-development', number: '03', name: 'RAG and AI Assistants', description: 'We create retrieval-augmented assistants that help people work with approved documents, websites and business knowledge, with source visibility, access controls, evaluation and human escalation.', tags: textItems(['RAG', 'Knowledge search', 'Source grounding']), icon: 'grid', sortOrder: 3, pageContent: servicePage('RAG and AI Assistants', 'For teams that need grounded answers from approved business knowledge, with document ingestion, retrieval, vector search, source grounding and evaluation.', ['Teams with changing approved knowledge', 'Businesses improving access to documents and data', 'Products needing a grounded assistant'], ['Answers are difficult to locate across approved sources', 'Knowledge changes faster than static help material', 'Users need visibility into source material'], ['Knowledge and document assessment', 'Ingestion and retrieval workflows', 'Source-aware assistant experience', 'Evaluation and handover'], ['Document ingestion', 'Vector search', 'Access control', 'Quality evaluation'], [{ name: 'AI Agent Development', href: '/services/ai-agent-development' }, { name: 'AI SaaS Development', href: '/services/ai-saas-development' }]), seo: { ...homepageSeo, metaTitle: 'RAG Development and AI Assistants | Aranax Technologies', metaDescription: 'Build grounded RAG assistants with document ingestion, retrieval, access controls and evaluation.', answerSummary: 'Aranax builds retrieval-augmented AI assistants grounded in approved information sources.' } },
  { slug: 'ai-agent-development', number: '04', name: 'AI Agents and Automation', description: 'We develop AI-assisted workflows that connect business systems and help teams complete repeatable work through useful integrations, approval steps, failure handling and observable execution.', tags: textItems(['Tool calling', 'Automation', 'Human approval']), icon: 'spark', sortOrder: 4, pageContent: servicePage('AI Agents and Automation', 'For teams automating repeatable work through tool calling, workflow orchestration, approval steps, audit trails, integrations and monitoring.', ['Operations teams with repeatable work', 'Product teams adding safe agent workflows', 'Businesses connecting fragmented tools'], ['Manual handoffs slow a workflow', 'Automations lack clear control points', 'Teams need visibility when an automated action fails'], ['Workflow discovery', 'Tool and system integration', 'Human approval design', 'Monitoring and release support'], ['Tool calling', 'Workflow orchestration', 'Audit-aware execution', 'Integration monitoring'], [{ name: 'RAG and AI Assistants', href: '/services/rag-ai-development' }, { name: 'Custom Software Development', href: '/services/custom-software-development' }]), seo: { ...homepageSeo, metaTitle: 'AI Agent Development and Automation | Aranax Technologies', metaDescription: 'Build practical AI agents with tool calling, workflow orchestration, human approval and monitoring.', answerSummary: 'Aranax develops AI-assisted workflows designed for controlled, observable execution.' } },
  { slug: 'custom-software-development', number: '05', name: 'Custom Web and Mobile Development', description: 'We deliver custom web applications, mobile experiences and backend APIs for organisations with specific product or operational needs, from discovery and UX collaboration to engineering, deployment and ongoing improvement.', tags: textItems(['Web apps', 'Mobile', 'APIs']), icon: 'chat', sortOrder: 5, pageContent: servicePage('Custom Web and Mobile Development', 'For organisations building web applications, mobile experiences, backend APIs, databases, integrations or modernisation programmes.', ['Businesses with a specific product or operational need', 'Teams modernising an existing application', 'Organisations integrating disconnected systems'], ['Critical workflows are split across tools', 'An existing application is difficult to maintain', 'A product needs a clear technical delivery path'], ['Discovery and solution design', 'Web and mobile application delivery', 'Backend APIs and integrations', 'Deployment and maintenance support'], ['Frontend engineering', 'Backend APIs', 'Databases', 'System integration'], [{ name: 'AI SaaS Development', href: '/services/ai-saas-development' }, { name: 'White-Label Engineering', href: '/services/white-label-development' }]), seo: { ...homepageSeo, metaTitle: 'Custom Web and Mobile Development | Aranax Technologies', metaDescription: 'Build custom web apps, mobile experiences, backend APIs and integrations with Aranax Technologies.', answerSummary: 'Aranax delivers custom web, mobile and backend software around real product and operational needs.' } },
  { slug: 'white-label-development', number: '06', name: 'White-Label Engineering', description: 'We support US and European digital agencies with dependable engineering capacity behind their client relationships, shaped around delivery processes, technical standards, communication preferences and agreed ownership arrangements.', tags: textItems(['Agency support', 'Delivery teams', 'Flexible engagement']), icon: 'grid', sortOrder: 6, pageContent: servicePage('White-Label Engineering', 'For US and European agencies that need dependable software engineering capacity while retaining their client relationship and delivery standards.', ['Digital agencies extending delivery capacity', 'Consultancies with a product build to deliver', 'Teams needing specialist web, mobile or AI engineering'], ['Delivery capacity is limited', 'Engineering work needs clear ownership and communication', 'An agency needs technical depth without changing its client model'], ['Embedded or project-based engineering support', 'Delivery planning and written collaboration', 'Web, mobile, backend and AI engineering', 'Handover and ongoing support'], ['Flexible collaboration models', 'Technical delivery', 'Clear written communication', 'Agreed responsibility boundaries'], [{ name: 'Custom Software Development', href: '/services/custom-software-development' }, { name: 'AI SaaS Development', href: '/services/ai-saas-development' }]), seo: { ...homepageSeo, metaTitle: 'White-Label Software Development for Agencies | Aranax', metaDescription: 'Extend agency delivery capacity with white-label engineering for web, mobile, SaaS and AI product projects.', answerSummary: 'Aranax provides configurable white-label software engineering support for agency delivery teams.' } },
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
  seo: { ...homepageSeo, metaTitle: `${String(entry.name).slice(0, 42)} | Aranax Case Study`, metaDescription: String(entry.description), canonicalUrl: `https://aranax.tech/case-studies/${entry.slug}`, openGraphType: 'article', answerSummary: String(entry.description) },
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
  'multi-tenant-saas-development': {
    filename: 'multi-tenant-saas-architecture.png',
    alternativeText: 'Secure multi-tenant SaaS architecture illustration',
    caption: 'Multi-tenant SaaS architecture',
  },
  'rag-ai-development': {
    filename: 'rag-ai-assistant-architecture.png',
    alternativeText: 'RAG AI assistant and knowledge retrieval illustration',
    caption: 'Retrieval-augmented AI assistant',
  },
  'ai-agent-development': {
    filename: 'agentic-ai-workflow-automation.png',
    alternativeText: 'Agentic AI workflow automation illustration',
    caption: 'Agentic AI workflow automation',
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
      heroImage: { connect: [heroImages[service.slug].id] },
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
        'Aranax Technologies helps startups, growing businesses, and digital agencies **build and launch AI-powered SaaS platforms, custom software, and web and mobile applications** without the complexity of managing multiple development teams. From MVP development and multi-tenant architecture to AI integration, workflow automation, and cloud deployment, we provide end-to-end engineering expertise to **shorten development cycles, reduce technical risks, and build scalable products for long-term growth.**',
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
        heading: 'AI products built for\nreal-world use',
        description:
          'From RAG applications and intelligent agents to complete AI SaaS platforms, we design secure, scalable solutions around your data, workflows and business goals.',
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
      seo: { ...homepageSeo, metaTitle: 'About Aranax Technologies | AI & SaaS Product Engineering', metaDescription: 'Learn about Aranax Technologies, an AI, SaaS, web and mobile product engineering team based in Kolkata, India.', canonicalUrl: 'https://aranax.tech/about' },
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
        { title: 'Startups and SaaS founders', challenge: 'Turn a product concept or early prototype into an application customers can use and the team can operate.', service: 'AI SaaS development, multi-tenant architecture and product engineering.', deliverable: 'A clear technical approach and a scoped path from discovery to release.', cta: 'Discuss a product build', href: '#contact' },
        { title: 'Software and digital agencies', challenge: 'Add engineering capacity without losing control of the client relationship or delivery quality.', service: 'White-label engineering, web and mobile delivery, AI integration.', deliverable: 'A collaboration model aligned to the agency’s project and communication workflow.', cta: 'Discuss agency support', href: '#contact' },
        { title: 'Businesses and institutions', challenge: 'Modernise a workflow, make knowledge easier to use or connect fragmented tools.', service: 'RAG assistants, AI automation, custom software and system integration.', deliverable: 'A practical solution design that accounts for users, data, security and maintenance.', cta: 'Discuss an operational challenge', href: '#contact' },
      ],
    },
    processSection: { eyebrow: 'How We Work', heading: 'A practical path from idea to *operating product.*', steps: [
      { number: '01', title: 'Discovery', description: 'We learn what users need, what success looks like and the constraints that shape delivery.' }, { number: '02', title: 'Architecture', description: 'We turn requirements into a clear technical approach, delivery scope and system decisions.' }, { number: '03', title: 'Implementation', description: 'We build in focused increments, with regular communication around progress and decisions.' }, { number: '04', title: 'Testing', description: 'We verify key workflows, integrations and release readiness before launch.' }, { number: '05', title: 'Deployment', description: 'We support a controlled release and handover suited to the product and its operating environment.' }, { number: '06', title: 'Ongoing Support', description: 'We can continue improving, maintaining and extending the application as needs change.' },
    ] },
    faqSection: { eyebrow: 'FAQ', heading: 'Questions founders and delivery teams *ask early.*', items: homepageSeo.questions },
    finalCta: { eyebrow: 'Start a conversation', heading: 'Have an AI or SaaS Product in Mind?', description: "Tell us what you're building. We'll discuss your requirements, architecture, delivery approach and next steps.", cta: { label: 'Book a Technical Discovery Call', href: '#contact' } },
  });

  await ensureHomePageComposition(strapi, homePageSections);
  await ensureHomePageSeo(strapi);
  await ensureHomePageMainField(strapi);
  await enablePublicRead(strapi);
}
