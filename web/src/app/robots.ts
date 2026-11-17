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
            { userAgent: "GPTBot", allow: "/" },
            { userAgent: "ClaudeBot", allow: "/" },
            { userAgent: "Google-Extended", allow: "/" },
        ],
        sitemap: absoluteUrl("/sitemap.xml"),
    };
}
