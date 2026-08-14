import axios from "axios";
import { NextResponse } from "next/server";

import { cmsPost } from "@/lib/api/axios.server";
import { CMS_ENDPOINTS } from "@/lib/api/endpoints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactPayload = {
    fname?: string;
    lname?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    project?: string;
    message?: string;
};

type ContactResponse = {
    data: null;
    message: string;
};

function errorDetails(payload: unknown) {
    if (!payload || typeof payload !== "object") return {};
    const response = payload as {
        message?: unknown;
        error?: {
            message?: unknown;
            details?: { errors?: unknown };
        };
    };
    const message =
        typeof response.message === "string"
            ? response.message
            : typeof response.error?.message === "string"
              ? response.error.message
              : undefined;
    const errors =
        response.error?.details?.errors &&
        typeof response.error.details.errors === "object"
            ? response.error.details.errors
            : undefined;
    return { message, errors };
}

export async function POST(request: Request) {
    let payload: ContactPayload;

    try {
        payload = (await request.json()) as ContactPayload;
    } catch {
        return NextResponse.json(
            { message: "Invalid request payload." },
            { status: 400, headers: { "Cache-Control": "no-store" } },
        );
    }

    try {
        const result = await cmsPost<ContactResponse, ContactPayload>(
            CMS_ENDPOINTS.contact,
            payload,
        );

        return NextResponse.json(result, {
            status: 201,
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        const status = axios.isAxiosError(error)
            ? (error.response?.status ?? 502)
            : 502;
        const details = axios.isAxiosError(error)
            ? errorDetails(error.response?.data)
            : {};
        const message =
            details.message ?? "We could not submit your message. Please try again.";

        if (status >= 500) {
            console.error("Strapi contact submission failed.", {
                status,
                code: axios.isAxiosError(error) ? error.code : undefined,
            });
        }
        return NextResponse.json(
            { message, errors: details.errors },
            {
                status: status >= 400 && status < 600 ? status : 502,
                headers: { "Cache-Control": "no-store" },
            },
        );
    }
}
