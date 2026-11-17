import type { Metadata } from "next";

import type { LandingPageContent } from "@/components/landing/data";

export function metadataFromCmsSeo(
    seo: LandingPageContent["seo"],
    site: LandingPageContent["site"],
    fallbackImageUrl?: string,
): Metadata {
    const title = seo.metaTitle;
    const description = seo.metaDescription;
    const openGraphTitle = seo.openGraphTitle || title;
    const openGraphDescription = seo.openGraphDescription || description;
    const shareImage = seo.shareImageUrl || fallbackImageUrl || site.defaultShareImageUrl;
    const twitterImage = seo.twitterImageUrl || shareImage;

    return {
        metadataBase: new URL(site.siteUrl),
        title,
        description,
        keywords: seo.keywords,
        alternates: { canonical: seo.canonicalUrl || site.siteUrl },
        robots: { index: !seo.preventIndexing, follow: !seo.preventFollowing },
        openGraph: {
            type: seo.openGraphType || "website",
            url: seo.canonicalUrl || site.siteUrl,
            siteName: site.siteName,
            title: openGraphTitle,
            description: openGraphDescription,
            images: shareImage ? [{ url: shareImage }] : undefined,
        },
        twitter: {
            card: seo.twitterCard || "summary_large_image",
            title: seo.twitterTitle || openGraphTitle,
            description: seo.twitterDescription || openGraphDescription,
            images: twitterImage ? [twitterImage] : undefined,
            site: site.twitterHandle || undefined,
            creator: site.twitterHandle || undefined,
        },
    };
}
