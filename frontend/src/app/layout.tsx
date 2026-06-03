import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aranax Technologies - Intelligence, Engineered.",
  description:
    "Aranax Technologies builds next-generation AI solutions, conversational chatbots, and intelligent tools that redefine how businesses operate.",
  openGraph: {
    title: "Aranax Technologies",
    description: "Intelligence, Engineered.",
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
