import axios from "axios";
import { NextResponse } from "next/server";

import { crmGet } from "@/lib/api/axios.server";
import { CRM_ENDPOINTS } from "@/lib/api/endpoints";

export const runtime = "nodejs";
export const revalidate = 3600;

type CrmCountry = {
    id: string;
    iso: string;
    iso3: string | null;
    name: string;
    phoneCode: string;
    currency: string | null;
    currencyCode: string | null;
    flag: string | null;
};

type CountriesResponse = {
    success: boolean;
    data: CrmCountry[];
};

export type CountryOption = {
    value: string;
    label: string;
    name: string;
    flag: string | null;
    phoneCode: string;
};

function toTitleCase(value: string) {
    return value
        .toLowerCase()
        .replace(/(^|[\s'-])([a-z])/g, (_, boundary, letter) => boundary + letter.toUpperCase());
}

export async function GET() {
    try {
        const result = await crmGet<CountriesResponse>(
            CRM_ENDPOINTS.countries,
        );

        const countries: CountryOption[] = result.data.map((country) => {
            const name = toTitleCase(country.name);
            return {
                value: country.iso,
                label: country.flag ? `${country.flag} ${name}` : name,
                name,
                flag: country.flag,
                phoneCode: country.phoneCode,
            };
        });

        return NextResponse.json(countries, {
            headers: { "Cache-Control": "public, max-age=3600" },
        });
    } catch (error) {
        const status = axios.isAxiosError(error)
            ? (error.response?.status ?? 502)
            : 502;

        console.error("CRM countries fetch failed.", {
            status,
            code: axios.isAxiosError(error) ? error.code : undefined,
        });

        return NextResponse.json(
            [],
            { status: 200, headers: { "Cache-Control": "no-store" } },
        );
    }
}
