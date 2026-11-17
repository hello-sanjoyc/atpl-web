import type { Metadata } from "next";

import { AranaxLanding } from "@/components/AranaxLanding";
import type { LandingPageContent } from "@/components/landing/data";
import { getLandingPageContent } from "@/lib/cms/cache.server";
import { cmsJsonLd, homepageHowToJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

async function getPageContent(): Promise<LandingPageContent> {
    try {
        return await getLandingPageContent();
    } catch (error) {
        console.error("Unable to load landing-page content from Strapi:", error);
        throw error;
    }
}

export async function generateMetadata(): Promise<Metadata> {
    const { seo, site } = await getPageContent();
    const title = seo.metaTitle;
    const description = seo.metaDescription;
    const openGraphTitle = seo.openGraphTitle || title;
    const openGraphDescription = seo.openGraphDescription || description;
    const shareImage = seo.shareImageUrl || site.defaultShareImageUrl;
    const twitterImage = seo.twitterImageUrl || shareImage;

    return {
        metadataBase: new URL(site.siteUrl),
        title,
        description,
        keywords: seo.keywords,
        icons: site.faviconUrl ? { icon: site.faviconUrl } : undefined,
        alternates: seo.canonicalUrl
            ? { canonical: seo.canonicalUrl }
            : { canonical: site.siteUrl },
        robots: {
            index: !seo.preventIndexing,
            follow: !seo.preventFollowing,
        },
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

export default async function Home() {
    const content = await getPageContent();
    const structuredData = [...cmsJsonLd(content.seo), homepageHowToJsonLd()];

    return (
        <>
            {structuredData.length > 0 ? (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
                    }}
                />
            ) : null}
            <AranaxLanding content={content} />
        </>
    );
}
