import "server-only";

import { cmsGet } from "@/lib/api/axios.server";
import type { CmsCaseStudy, CmsService, StrapiResponse } from "./types";

type CollectionResponse<T> = { data: T[]; meta: Record<string, unknown> };

function bySlugParams(slug: string, populate: string[]) {
    const params = new URLSearchParams();
    params.set("filters[slug][$eq]", slug);
    populate.forEach((path) => params.set(path, "true"));
    return params;
}

export async function getServiceBySlug(slug: string) {
    const response = await cmsGet<CollectionResponse<CmsService>>("/api/services", {
        params: bySlugParams(slug, ["populate[tags]", "populate[heroImage]", "populate[seo][populate][keywords]", "populate[seo][populate][shareImage]", "populate[seo][populate][twitterImage]", "populate[seo][populate][questions]"]),
    });
    return response.data[0] ?? null;
}

export async function getCaseStudyBySlug(slug: string) {
    const response = await cmsGet<CollectionResponse<CmsCaseStudy>>("/api/case-studies", {
        params: bySlugParams(slug, ["populate[tags]", "populate[coverImage]", "populate[seo][populate][keywords]", "populate[seo][populate][shareImage]", "populate[seo][populate][twitterImage]", "populate[seo][populate][questions]"]),
    });
    return response.data[0] ?? null;
}
