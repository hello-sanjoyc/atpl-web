import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "AI SaaS Development Company | RAG & Agentic AI | Aranax Technologies",
    description:
        "Aranax Technologies designs and builds scalable AI SaaS platforms, RAG applications, intelligent agents and workflow automation for startups, agencies and enterprises.",
    openGraph: {
        title: "AI SaaS Development Company | RAG & Agentic AI | Aranax Technologies",
        description:
            "Aranax Technologies designs and builds scalable AI SaaS platforms, RAG applications, intelligent agents and workflow automation for startups, agencies and enterprises.",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
