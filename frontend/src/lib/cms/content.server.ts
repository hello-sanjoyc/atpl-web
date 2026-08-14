import "server-only";

import {
    fallbackLandingPage,
    type LandingPageContent,
    type Project,
    type Service,
    type TeamMember,
} from "@/components/landing/data";
import { cmsGet } from "@/lib/api/axios.server";
import { CMS_ENDPOINTS } from "@/lib/api/endpoints";

import type {
    CmsCaseStudy,
    CmsHomePage,
    CmsLink,
    CmsMedia,
    CmsService,
    CmsSiteSettings,
    CmsTeamMember,
    StrapiResponse,
} from "./types";

const headingHighlights: Record<string, string> = {
    "Build an AI product\nthat works beyond the demo.":
        "Build an *AI product*\nthat *works beyond* the demo.",
    "AI products built for\nreal-world use":
        "AI products built for\n*real-world use*",
    "Architecture first.\nAI second.\nBusiness outcome always.":
        "Architecture first.\n*AI second.*\nBusiness outcome always.",
    "Products engineered around real business problems.":
        "Products engineered around *real business problems.*",
    "We build beyond the AI prototype.":
        "We build *beyond* the *AI prototype*.",
    "Let's build\nsomething\nextraordinary.":
        "Let's build\nsomething\n*extraordinary.*",
};

function withHeadingHighlights(heading: string) {
    return heading.includes("*") ? heading : (headingHighlights[heading] ?? heading);
}

function mediaUrl(media?: CmsMedia | null) {
    if (!media?.url) return undefined;
    if (/^https?:\/\//i.test(media.url)) return media.url;

    const publicBase = (
        process.env.STRAPI_PUBLIC_URL ??
        process.env.STRAPI_URL ??
        "http://127.0.0.1:1337"
    ).replace(/\/$/, "");
    return `${publicBase}${media.url.startsWith("/") ? "" : "/"}${media.url}`;
}

function absoluteSiteUrl(value: string, fallback: string) {
    try {
        return new URL(value).toString();
    } catch {
        console.warn(`Ignoring invalid Site Settings URL: ${value}`);
        return fallback;
    }
}

function mapService(service: CmsService, index: number): Service {
    return {
        number: service.number,
        name: service.name,
        description: service.description,
        tags: service.tags?.map(({ text }) => text) ?? [],
        icon: service.icon,
        delay: index === 1 ? "d1" : index === 2 ? "d2" : undefined,
    };
}

function mapCaseStudy(caseStudy: CmsCaseStudy): Project {
    return {
        category: caseStudy.category,
        name: caseStudy.name,
        tagline: caseStudy.tagline,
        description: caseStudy.description,
        tags: caseStudy.tags?.map(({ text }) => text) ?? [],
        challenge: caseStudy.challenge,
        outcome: caseStudy.outcome,
        contribution: caseStudy.contribution,
        url: caseStudy.websiteUrl,
        visual: caseStudy.visual,
        imageUrl: mediaUrl(caseStudy.coverImage),
    };
}

function mapTeamMember(teamMember: CmsTeamMember): TeamMember {
    return {
        initials: teamMember.initials,
        name: teamMember.name,
        role: teamMember.role,
        avatar: teamMember.avatarStyle,
        url: teamMember.profileUrl,
        photoUrl: mediaUrl(teamMember.photo),
    };
}

function mapLink({ label, href, openInNewTab, style }: CmsLink) {
    return { label, href, openInNewTab, style };
}

function createHomePageParams() {
    const params = new URLSearchParams();
    const populatePaths = [
        "populate[seo][populate][keywords]",
        "populate[seo][populate][shareImage]",
        "populate[seo][populate][twitterImage]",
        "populate[heroSection][populate][primaryCta]",
        "populate[heroSection][populate][secondaryCta]",
        "populate[heroSection][populate][trustItems]",
        "populate[servicesSection][populate][services][populate][tags]",
        "populate[whyAranaxSection][populate][considerations]",
        "populate[caseStudiesSection][populate][caseStudies][populate][tags]",
        "populate[caseStudiesSection][populate][caseStudies][populate][coverImage]",
        "populate[aboutSection][populate][statistics]",
        "populate[aboutSection][populate][teamMembers][populate][photo]",
        "populate[contactSection]",
    ];
    populatePaths.forEach((path) => params.set(path, "true"));
    return params;
}

function createSiteSettingsParams() {
    const params = new URLSearchParams();
    ["logo", "favicon", "defaultShareImage", "navigation", "expertiseTicker"].forEach(
        (field) => params.set(`populate[${field}]`, "true"),
    );
    return params;
}

function mapContent(
    homePage: CmsHomePage,
    settings: CmsSiteSettings,
): LandingPageContent {
    const fallback = fallbackLandingPage;
    const hero = homePage.heroSection;
    const servicesSection = homePage.servicesSection;
    const whyAranax = homePage.whyAranaxSection;
    const caseStudiesSection = homePage.caseStudiesSection;
    const about = homePage.aboutSection;
    const contact = homePage.contactSection;
    const seo = homePage.seo;

    const services = [...(servicesSection?.services ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(mapService);
    const caseStudies = [...(caseStudiesSection?.caseStudies ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(mapCaseStudy);
    const teamMembers = [...(about?.teamMembers ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(mapTeamMember);

    return {
        site: {
            siteName: settings.siteName || fallback.site.siteName,
            siteUrl: absoluteSiteUrl(settings.siteUrl, fallback.site.siteUrl),
            logoUrl:
                mediaUrl(settings.logo) ??
                settings.logoAssetPath ??
                fallback.site.logoUrl,
            logoAlternativeText:
                settings.logoAlternativeText || fallback.site.logoAlternativeText,
            faviconUrl: mediaUrl(settings.favicon),
            defaultShareImageUrl:
                mediaUrl(settings.defaultShareImage) ??
                fallback.site.defaultShareImageUrl,
            twitterHandle: settings.twitterHandle ?? undefined,
            navigation:
                settings.navigation?.map(({ label, href, openInNewTab, style }) => ({
                    label,
                    href,
                    openInNewTab,
                    style,
                })) ?? fallback.site.navigation,
            expertiseTicker:
                settings.expertiseTicker?.map(({ text }) => text) ??
                fallback.site.expertiseTicker,
            footerText: settings.footerText || fallback.site.footerText,
        },
        seo: {
            metaTitle: seo.metaTitle || fallback.seo.metaTitle,
            metaDescription: seo.metaDescription || fallback.seo.metaDescription,
            keywords: seo.keywords?.map(({ text }) => text) ?? fallback.seo.keywords,
            canonicalUrl: seo.canonicalUrl ?? fallback.seo.canonicalUrl,
            preventIndexing: seo.preventIndexing ?? false,
            preventFollowing: seo.preventFollowing ?? false,
            openGraphTitle: seo.openGraphTitle ?? undefined,
            openGraphDescription: seo.openGraphDescription ?? undefined,
            openGraphType: seo.openGraphType ?? undefined,
            shareImageUrl: mediaUrl(seo.shareImage),
            twitterCard: seo.twitterCard ?? undefined,
            twitterTitle: seo.twitterTitle ?? undefined,
            twitterDescription: seo.twitterDescription ?? undefined,
            twitterImageUrl: mediaUrl(seo.twitterImage),
            structuredData: seo.structuredData ?? undefined,
        },
        hero: hero
            ? {
                  eyebrow: hero.eyebrow,
                  heading: withHeadingHighlights(hero.heading),
                  description: hero.description,
                  primaryCta: mapLink(hero.primaryCta),
                  secondaryCta: mapLink(hero.secondaryCta),
                  trustItems: hero.trustItems?.map(({ text }) => text) ?? [],
              }
            : fallback.hero,
        servicesSection: servicesSection
            ? {
                  eyebrow: servicesSection.eyebrow,
                  heading: withHeadingHighlights(servicesSection.heading),
                  description: servicesSection.description,
                  services: services.length > 0 ? services : fallback.servicesSection.services,
              }
            : fallback.servicesSection,
        whyAranaxSection: whyAranax
            ? {
                  eyebrow: whyAranax.eyebrow,
                  heading: withHeadingHighlights(whyAranax.heading),
                  description: whyAranax.description,
                  listHeading: whyAranax.listHeading,
                  considerations:
                      whyAranax.considerations?.map(({ text }) => text) ?? [],
                  outcome: whyAranax.outcome,
              }
            : fallback.whyAranaxSection,
        caseStudiesSection: caseStudiesSection
            ? {
                  eyebrow: caseStudiesSection.eyebrow,
                  heading: withHeadingHighlights(caseStudiesSection.heading),
                  description: caseStudiesSection.description,
                  caseStudies:
                      caseStudies.length > 0
                          ? caseStudies
                          : fallback.caseStudiesSection.caseStudies,
              }
            : fallback.caseStudiesSection,
        aboutSection: about
            ? {
                  eyebrow: about.eyebrow,
                  heading: withHeadingHighlights(about.heading),
                  description: about.description,
                  teamHeading: about.teamHeading,
                  statistics:
                      about.statistics?.map(({ value, suffix, label }) => ({
                          value,
                          suffix: suffix ?? "",
                          label,
                      })) ?? [],
                  teamMembers:
                      teamMembers.length > 0
                          ? teamMembers
                          : fallback.aboutSection.teamMembers,
              }
            : fallback.aboutSection,
        contactSection: contact
            ? {
                  eyebrow: contact.eyebrow,
                  heading: withHeadingHighlights(contact.heading),
                  description: contact.description,
                  email: contact.email,
                  location: contact.location,
              }
            : fallback.contactSection,
    };
}

export async function fetchLandingPageContent() {
    const [homePageResponse, settingsResponse] = await Promise.all([
        cmsGet<StrapiResponse<CmsHomePage>>(CMS_ENDPOINTS.homePage, {
            params: createHomePageParams(),
        }),
        cmsGet<StrapiResponse<CmsSiteSettings>>(CMS_ENDPOINTS.siteSettings, {
            params: createSiteSettingsParams(),
        }),
    ]);

    if (!homePageResponse.data || !settingsResponse.data) {
        throw new Error("Required Strapi landing-page content is missing.");
    }

    return mapContent(homePageResponse.data, settingsResponse.data);
}
