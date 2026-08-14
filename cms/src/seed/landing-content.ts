import type { Core } from '@strapi/strapi';

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

const caseStudies: SeedEntry[] = [
  {
    slug: 'ema-smarter-inbox-management',
    category: 'AI Email Productivity',
    name: 'EMA — Smarter Inbox Management',
    tagline: 'From a crowded inbox to a prioritised workday',
    description:
      'An AI-powered email assistant that prioritises messages, prepares contextual replies, identifies follow-ups and turns inbox activity into an organised workflow.',
    tags: textItems(['Agentic AI', 'Email Automation', 'Productivity SaaS']),
    challenge:
      'Professionals need to prioritise emails, understand requests, respond, schedule meetings and track follow-ups—work traditional inboxes largely leave to the user.',
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
    name: 'DocuNova — Understand Contracts Faster',
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
    name: 'UniEcho — AI Student Assistant',
    tagline: 'One reliable assistant across the entire student journey',
    description:
      'A multilingual university assistant that answers questions about admissions, examinations, fees, results and student services.',
    tags: textItems(['Conversational AI', 'Multilingual', 'Education']),
    challenge:
      'Students need clear answers across admissions, examinations, fees, results and services—often across more than one language.',
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
    name: 'DoubtAce — Exam-Ready Doubt Resolution',
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
    name: 'Gloziia — Salon Marketplace and Management Platform',
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
    name: 'GlamSync — SaaS for Independent Makeup Artists',
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
  const seeded = [];

  for (const entry of entries) {
    const existing = await documents.findFirst({ filters: { slug: entry.slug } });
    const document =
      existing ?? (await documents.create({ data: entry, status: 'published' }));
    seeded.push(document);
  }

  return seeded;
}

async function seedSingleType(
  strapi: Core.Strapi,
  uid: string,
  data: Record<string, unknown>
) {
  const documents = strapi.documents(uid as never) as any;
  const existing = await documents.findFirst();

  if (!existing) {
    return documents.create({ data, status: 'published' });
  }

  return existing;
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

export async function seedLandingContent(strapi: Core.Strapi) {
  const seededServices = await seedCollection(strapi, 'api::service.service', services);
  const seededCaseStudies = await seedCollection(
    strapi,
    'api::case-study.case-study',
    caseStudies
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
      eyebrow: 'AI Development Agency',
      heading: 'Build an AI product\nthat works beyond the demo.',
      description:
        'Aranax Technologies helps startups, agencies and enterprises design, build and scale secure AI SaaS platforms, RAG applications, intelligent agents and workflow automation.\n\nFrom technical feasibility and system architecture to product development, deployment and optimisation, we turn complex AI ideas into dependable software products.',
      primaryCta: {
        label: 'Discuss Your AI Product',
        href: '#contact',
        style: 'primary',
      },
      secondaryCta: {
        label: 'View Our Case Studies',
        href: '#case-studies',
        style: 'secondary',
      },
      trustItems: textItems([
        '12+ Yrs. in Product Development',
        'Architecture-First Development',
        'AI, Web and Mobile Engineering',
        'Supporting Clients Worldwide',
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
  });

  await ensureHomePageComposition(strapi, homePageSections);
  await ensureHomePageSeo(strapi);
  await ensureHomePageMainField(strapi);
  await enablePublicRead(strapi);
}
