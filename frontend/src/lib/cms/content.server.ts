import "server-only";

import type { LandingPageContent, Project, Service, TeamMember } from "@/components/landing/data";
import { cmsGet } from "@/lib/api/axios.server";
import { CMS_ENDPOINTS } from "@/lib/api/endpoints";
import type { CmsCaseStudy, CmsHomePage, CmsLink, CmsMedia, CmsService, CmsSiteSettings, CmsTeamMember, StrapiResponse } from "./types";

function required<T>(value: T | null | undefined, name: string): T {
    if (value === null || value === undefined) throw new Error(`Required CMS content is missing: ${name}`);
    return value;
}

export function mediaUrl(media?: CmsMedia | null) {
    if (!media?.url) return undefined;
    if (/^https?:\/\//i.test(media.url)) return media.url;
    const base = (process.env.STRAPI_PUBLIC_URL ?? process.env.STRAPI_URL ?? "http://127.0.0.1:1337").replace(/\/$/, "");
    return `${base}${media.url.startsWith("/") ? "" : "/"}${media.url}`;
}

function mapLink(link: CmsLink) { return { label: link.label, href: link.href, openInNewTab: link.openInNewTab, style: link.style }; }
function mapService(service: CmsService): Service { return { slug: service.slug, number: service.number, name: service.name, description: service.description, tags: service.tags?.map(({ text }) => text) ?? [], icon: service.icon }; }
function mapCaseStudy(caseStudy: CmsCaseStudy): Project { return { slug: caseStudy.slug, category: caseStudy.category, name: caseStudy.name, tagline: caseStudy.tagline, description: caseStudy.description, tags: caseStudy.tags?.map(({ text }) => text) ?? [], challenge: caseStudy.challenge, outcome: caseStudy.outcome, contribution: caseStudy.contribution, url: caseStudy.websiteUrl, visual: caseStudy.visual, imageUrl: mediaUrl(caseStudy.coverImage) }; }
function mapTeamMember(member: CmsTeamMember): TeamMember { return { initials: member.initials, name: member.name, role: member.role, avatar: member.avatarStyle, url: member.profileUrl, photoUrl: mediaUrl(member.photo) }; }

export function mapSeo(seo: NonNullable<CmsHomePage["seo"]>): LandingPageContent["seo"] {
    return {
        metaTitle: seo.metaTitle, metaDescription: seo.metaDescription, keywords: seo.keywords?.map(({ text }) => text) ?? [], canonicalUrl: seo.canonicalUrl ?? undefined,
        preventIndexing: seo.preventIndexing ?? false, preventFollowing: seo.preventFollowing ?? false,
        openGraphTitle: seo.openGraphTitle ?? undefined, openGraphDescription: seo.openGraphDescription ?? undefined, openGraphType: seo.openGraphType ?? undefined,
        shareImageUrl: mediaUrl(seo.shareImage), twitterCard: seo.twitterCard ?? undefined, twitterTitle: seo.twitterTitle ?? undefined,
        twitterDescription: seo.twitterDescription ?? undefined, twitterImageUrl: mediaUrl(seo.twitterImage), structuredData: seo.structuredData ?? undefined,
        answerSummary: seo.answerSummary ?? undefined, questions: seo.questions?.map(({ question, answer }) => ({ question, answer })) ?? [],
    };
}

function createHomePageParams() {
    const params = new URLSearchParams();
    [
        "populate[seo][populate][keywords]", "populate[seo][populate][shareImage]", "populate[seo][populate][twitterImage]", "populate[seo][populate][questions]",
        "populate[heroSection][populate][primaryCta]", "populate[heroSection][populate][secondaryCta]", "populate[heroSection][populate][trustItems]",
        "populate[servicesSection][populate][services][populate][tags]", "populate[whyAranaxSection][populate][considerations]",
        "populate[caseStudiesSection][populate][caseStudies][populate][tags]", "populate[caseStudiesSection][populate][caseStudies][populate][coverImage]",
        "populate[aboutSection][populate][statistics]", "populate[aboutSection][populate][teamMembers][populate][photo]", "populate[aboutSection][populate][seo][populate][keywords]", "populate[aboutSection][populate][seo][populate][shareImage]", "populate[aboutSection][populate][seo][populate][twitterImage]", "populate[aboutSection][populate][seo][populate][questions]", "populate[contactSection]",
    ].forEach((path) => params.set(path, "true"));
    return params;
}

function createSiteSettingsParams() { const params = new URLSearchParams(); ["logo", "favicon", "defaultShareImage", "navigation", "expertiseTicker"].forEach((field) => params.set(`populate[${field}]`, "true")); return params; }

export function mapContent(homePage: CmsHomePage, settings: CmsSiteSettings): LandingPageContent {
    const hero = required(homePage.heroSection, "Home Page > Hero Section");
    const servicesSection = required(homePage.servicesSection, "Home Page > Services Section");
    const why = required(homePage.whyAranaxSection, "Home Page > Why Aranax Section");
    const cases = required(homePage.caseStudiesSection, "Home Page > Case Studies Section");
    const about = required(homePage.aboutSection, "Home Page > About Section");
    const contact = required(homePage.contactSection, "Home Page > Contact Section");
    const logoUrl = required(mediaUrl(settings.logo) ?? settings.logoAssetPath, "Site Settings > Logo");
    return {
        site: { siteName: settings.siteName, siteUrl: settings.siteUrl, logoUrl, logoAlternativeText: settings.logoAlternativeText, faviconUrl: mediaUrl(settings.favicon), defaultShareImageUrl: mediaUrl(settings.defaultShareImage), twitterHandle: settings.twitterHandle ?? undefined, navigation: required(settings.navigation, "Site Settings > Navigation").map(mapLink), expertiseTicker: required(settings.expertiseTicker, "Site Settings > Expertise ticker").map(({ text }) => text), footerText: settings.footerText },
        seo: mapSeo(required(homePage.seo, "Home Page > SEO")),
        hero: { eyebrow: hero.eyebrow, heading: hero.heading, description: hero.description, primaryCta: mapLink(hero.primaryCta), secondaryCta: mapLink(hero.secondaryCta), trustItems: hero.trustItems?.map(({ text }) => text) ?? [] },
        servicesSection: { eyebrow: servicesSection.eyebrow, heading: servicesSection.heading, description: servicesSection.description, services: required(servicesSection.services, "Services Section > Services").sort((a, b) => a.sortOrder - b.sortOrder).map(mapService) },
        whyAranaxSection: { eyebrow: why.eyebrow, heading: why.heading, description: why.description, listHeading: why.listHeading, considerations: why.considerations?.map(({ text }) => text) ?? [], outcome: why.outcome },
        caseStudiesSection: { eyebrow: cases.eyebrow, heading: cases.heading, description: cases.description, caseStudies: required(cases.caseStudies, "Case Studies Section > Case Studies").sort((a, b) => a.sortOrder - b.sortOrder).map(mapCaseStudy) },
        aboutSection: { eyebrow: about.eyebrow, heading: about.heading, description: about.description, teamHeading: about.teamHeading, statistics: about.statistics?.map(({ value, suffix, label }) => ({ value, suffix: suffix ?? "", label })) ?? [], teamMembers: required(about.teamMembers, "About Section > Team members").sort((a, b) => a.sortOrder - b.sortOrder).map(mapTeamMember) },
        aboutPage: about.pageContent && about.seo ? { pageContent: about.pageContent as NonNullable<LandingPageContent["aboutPage"]>["pageContent"], seo: mapSeo(about.seo) } : undefined,
        contactSection: { eyebrow: contact.eyebrow, heading: contact.heading, description: contact.description, email: contact.email, location: contact.location },
        buyerSegments: homePage.buyerSegments as LandingPageContent["buyerSegments"], processSection: homePage.processSection as LandingPageContent["processSection"], faqSection: homePage.faqSection as LandingPageContent["faqSection"], finalCta: homePage.finalCta as LandingPageContent["finalCta"],
    };
}

export async function fetchLandingPageContent() {
    const [home, settings] = await Promise.all([cmsGet<StrapiResponse<CmsHomePage>>(CMS_ENDPOINTS.homePage, { params: createHomePageParams() }), cmsGet<StrapiResponse<CmsSiteSettings>>(CMS_ENDPOINTS.siteSettings, { params: createSiteSettingsParams() })]);
    return mapContent(required(home.data, "Home Page"), required(settings.data, "Site Settings"));
}
