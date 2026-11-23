import "server-only";

import axios, { type AxiosRequestConfig } from "axios";

const baseURL = (process.env.STRAPI_URL ?? "http://127.0.0.1:1337").replace(
    /\/$/,
    "",
);

export const cmsApi = axios.create({
    baseURL,
    timeout: 8_000,
    headers: {
        Accept: "application/json",
        ...(process.env.STRAPI_API_TOKEN
            ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
            : {}),
    },
    maxRedirects: 0,
});

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown) {
    if (!axios.isAxiosError(error)) return false;
    if (error.response) return error.response.status >= 500;
    return true;
}

export async function cmsGet<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
) {
    try {
        const response = await cmsApi.get<T>(endpoint, config);
        return response.data;
    } catch (error) {
        if (!isRetryable(error)) throw error;
        await sleep(300);
        const response = await cmsApi.get<T>(endpoint, config);
        return response.data;
    }
}

export async function cmsPost<TResponse, TPayload>(
    endpoint: string,
    payload: TPayload,
    config?: AxiosRequestConfig,
) {
    const response = await cmsApi.post<TResponse>(endpoint, payload, config);
    return response.data;
}

const crmBaseURL = (
    process.env.CRM_API_URL ?? "http://127.0.0.1:4000"
).replace(/\/$/, "");

export const crmApi = axios.create({
    baseURL: crmBaseURL,
    timeout: 8_000,
    headers: {
        Accept: "application/json",
    },
    maxRedirects: 0,
});

export async function crmGet<T>(endpoint: string, config?: AxiosRequestConfig) {
    const response = await crmApi.get<T>(endpoint, config);
    return response.data;
}

export async function crmPost<TResponse, TPayload>(
    endpoint: string,
    payload: TPayload,
    config?: AxiosRequestConfig,
) {
    const response = await crmApi.post<TResponse>(endpoint, payload, config);
    return response.data;
}
