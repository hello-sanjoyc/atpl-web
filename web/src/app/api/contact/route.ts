import axios from "axios";
import { NextResponse } from "next/server";

import { crmPost } from "@/lib/api/axios.server";
import { CRM_ENDPOINTS } from "@/lib/api/endpoints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContactPayload = {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    country?: string;
    serviceInterest?: string;
    budgetRange?: string;
    timeline?: string;
    message?: string;
    consent?: boolean;
};

type LeadResponse = {
    success: boolean;
    data: { status: string; reference: string | null };
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

    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const phone = payload.phone?.trim();

    if (!name || !email || !phone || !payload.consent) {
        return NextResponse.json(
            { message: "Please fill in all required fields." },
            { status: 400, headers: { "Cache-Control": "no-store" } },
        );
    }

    const leadBody = {
        name,
        email,
        phone,
        company: payload.company?.trim() || undefined,
        country: payload.country || undefined,
        serviceInterest: payload.serviceInterest || undefined,
        budgetRange: payload.budgetRange || undefined,
        timeline: payload.timeline || undefined,
        message: payload.message?.trim() || undefined,
        formSource: "website_contact",
        consent: {
            privacyPolicy: true as const,
            privacyPolicyVersion:
                process.env.CRM_PRIVACY_POLICY_VERSION ?? "2025-01-v1",
            marketing: false,
        },
    };

    try {
        const result = await crmPost<LeadResponse, typeof leadBody>(
            CRM_ENDPOINTS.publicLeads,
            leadBody,
        );

        return NextResponse.json(
            {
                data: result.data,
                message: "Thanks. Your message has been sent successfully.",
            },
            {
                status: 201,
                headers: { "Cache-Control": "no-store" },
            },
        );
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
            console.error("CRM lead submission failed.", {
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
