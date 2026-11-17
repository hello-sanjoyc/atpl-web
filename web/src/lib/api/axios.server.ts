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

export async function cmsGet<T>(
    endpoint: string,
    config?: AxiosRequestConfig,
) {
    const response = await cmsApi.get<T>(endpoint, config);
    return response.data;
}

export async function cmsPost<TResponse, TPayload>(
    endpoint: string,
    payload: TPayload,
    config?: AxiosRequestConfig,
) {
    const response = await cmsApi.post<TResponse>(endpoint, payload, config);
    return response.data;
}
