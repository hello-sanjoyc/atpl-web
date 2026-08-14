import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import { CMS_CACHE_TAGS } from "@/lib/api/endpoints";

import { fetchLandingPageContent } from "./content.server";

const configuredTtl = Number.parseInt(
    process.env.CMS_CACHE_TTL_SECONDS ?? "3600",
    10,
);
const cacheTtl = Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : 3600;

const getPersistentLandingPageContent = unstable_cache(
    fetchLandingPageContent,
    ["strapi-landing-page-v1"],
    {
        revalidate: cacheTtl,
        tags: [
            CMS_CACHE_TAGS.content,
            CMS_CACHE_TAGS.homePage,
            CMS_CACHE_TAGS.siteSettings,
        ],
    },
);

// React cache prevents duplicate work between generateMetadata and the page
// during one render; unstable_cache persists the result across requests.
export const getLandingPageContent = cache(getPersistentLandingPageContent);
