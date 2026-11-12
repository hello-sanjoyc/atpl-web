import { timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { CMS_CACHE_TAGS } from "@/lib/api/endpoints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secureEqual(actual: string, expected: string) {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return (
        actualBuffer.length === expectedBuffer.length &&
        timingSafeEqual(actualBuffer, expectedBuffer)
    );
}

function suppliedSecret(request: Request) {
    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
    return request.headers.get("x-revalidation-secret") ?? "";
}

export async function POST(request: Request) {
    const expectedSecret = process.env.CMS_REVALIDATE_SECRET;
    if (!expectedSecret) {
        console.error("CMS_REVALIDATE_SECRET is not configured.");
        return NextResponse.json(
            { message: "Revalidation is not configured." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
        );
    }

    if (!secureEqual(suppliedSecret(request), expectedSecret)) {
        return NextResponse.json(
            { message: "Unauthorized." },
            { status: 401, headers: { "Cache-Control": "no-store" } },
        );
    }

    let event: unknown = null;
    try {
        event = await request.json();
    } catch {
        // A payload is useful for auditing, but not required for invalidation.
    }

    // Next.js 16 requires an explicit cache-life profile for tag revalidation.
    // "max" serves stale content while the cache is refreshed in the background.
    revalidateTag(CMS_CACHE_TAGS.content, "max");
    revalidateTag(CMS_CACHE_TAGS.homePage, "max");
    revalidateTag(CMS_CACHE_TAGS.siteSettings, "max");
    revalidatePath("/");

    return NextResponse.json(
        {
            revalidated: true,
            event,
            timestamp: new Date().toISOString(),
        },
        { headers: { "Cache-Control": "no-store" } },
    );
}
