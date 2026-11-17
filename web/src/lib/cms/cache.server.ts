import "server-only";

import { cache } from "react";

import { fetchLandingPageContent } from "./content.server";

// Share the Strapi request between metadata and page rendering, but fetch
// fresh content again on the next page request.
export const getLandingPageContent = cache(fetchLandingPageContent);
