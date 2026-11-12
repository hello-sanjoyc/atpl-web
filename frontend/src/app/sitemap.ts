import type { MetadataRoute } from "next";

import { getLandingPageContent } from "@/lib/cms/cache.server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const content = await getLandingPageContent();
    const url = (path: string) => new URL(path, content.site.siteUrl).toString();
    return [
        { url: url("/"), changeFrequency: "weekly", priority: 1 },
        ...content.servicesSection.services.map(({ slug }) => ({ url: url(`/services/${slug}`), changeFrequency: "monthly" as const, priority: 0.8 })),
        ...content.caseStudiesSection.caseStudies.map(({ slug }) => ({ url: url(`/case-studies/${slug}`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ];
}
