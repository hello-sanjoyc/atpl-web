export const SITE_URL = "https://aranax.tech";
export const SITE_NAME = "Aranax Technologies";

export function absoluteUrl(path = "/") {
    return new URL(path, SITE_URL).toString();
}

export function organizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/assets/images/logo.png"),
        email: "hello@aranax.tech",
    };
}

export function websiteSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
    };
}

export function serviceSchema(name: string, description: string, path: string) {
    return {
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        url: absoluteUrl(path),
        provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}
