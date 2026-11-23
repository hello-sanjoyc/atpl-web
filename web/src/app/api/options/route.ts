import axios from "axios";
import { NextResponse } from "next/server";

import { crmGet } from "@/lib/api/axios.server";
import { CRM_ENDPOINTS } from "@/lib/api/endpoints";

export const runtime = "nodejs";
export const revalidate = 300;

type OptionItem = { value: string; label: string };
type OptionsResponse = {
    success: boolean;
    data: Record<string, OptionItem[]>;
};

export async function GET() {
    try {
        const result = await crmGet<OptionsResponse>(CRM_ENDPOINTS.options);

        return NextResponse.json(result.data, {
            headers: { "Cache-Control": "public, max-age=300" },
        });
    } catch (error) {
        const status = axios.isAxiosError(error)
            ? (error.response?.status ?? 502)
            : 502;

        console.error("CRM options fetch failed.", {
            status,
            code: axios.isAxiosError(error) ? error.code : undefined,
        });

        return NextResponse.json(
            {},
            { status: 200, headers: { "Cache-Control": "no-store" } },
        );
    }
}
