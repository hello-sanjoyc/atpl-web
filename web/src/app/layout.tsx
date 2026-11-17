import "./globals.css";
import { Gloock, JetBrains_Mono, Raleway } from "next/font/google";
import type { Metadata } from "next";

import { getLandingPageContent } from "@/lib/cms/cache.server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
    const { site } = await getLandingPageContent();
    return { metadataBase: new URL(site.siteUrl), applicationName: site.siteName };
}

const bodyFont = Raleway({
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap",
});

const headingFont = Gloock({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-heading",
    display: "swap",
});

const technicalFont = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${bodyFont.className} ${bodyFont.variable} ${headingFont.variable} ${technicalFont.variable}`}>
                {children}
            </body>
        </html>
    );
}
