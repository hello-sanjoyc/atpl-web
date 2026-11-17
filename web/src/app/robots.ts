import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: "*", allow: "/" },
            { userAgent: "Googlebot", allow: "/" },
            { userAgent: "Bingbot", allow: "/" },
            { userAgent: "OAI-SearchBot", allow: "/" },
            { userAgent: "Claude-SearchBot", allow: "/" },
            { userAgent: "Claude-User", allow: "/" },
            { userAgent: "PerplexityBot", allow: "/" },
            // Training-oriented crawlers are intentionally not enabled by default.
            { userAgent: "GPTBot", disallow: "/" },
            { userAgent: "ClaudeBot", disallow: "/" },
            { userAgent: "Google-Extended", disallow: "/" },
        ],
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
