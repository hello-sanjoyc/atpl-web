"use client";

import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

import type { LandingPageContent } from "./data";
import { Contact } from "./Contact";
import { CursorChrome } from "./CursorChrome";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export function ServicePageChrome({
    children,
    contact,
    settings,
}: {
    children: ReactNode;
    contact: LandingPageContent["contactSection"];
    settings: LandingPageContent["site"];
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setNavScrolled(window.scrollY > 60);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
            return;
        }

        const cursor = document.getElementById("cursor");
        const cursorDot = document.getElementById("cursorDot");
        if (!cursor || !cursorDot) return;

        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        let frame = 0;

        const moveDot = (event: MouseEvent) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            cursorDot.style.transform = `translate(${mouseX - 2.5}px,${mouseY - 2.5}px)`;
        };
        const moveCursor = () => {
            cursorX += (mouseX - cursorX) * 0.12;
            cursorY += (mouseY - cursorY) * 0.12;
            cursor.style.transform = `translate(${cursorX - 19}px,${cursorY - 19}px)`;
            frame = requestAnimationFrame(moveCursor);
        };
        const grow = () => cursor.classList.add("grow");
        const shrink = () => cursor.classList.remove("grow");
        const hoverTargets = document.querySelectorAll<HTMLElement>("a, button");

        document.addEventListener("mousemove", moveDot);
        hoverTargets.forEach((element) => {
            element.addEventListener("mouseenter", grow);
            element.addEventListener("mouseleave", shrink);
        });
        frame = requestAnimationFrame(moveCursor);

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener("mousemove", moveDot);
            hoverTargets.forEach((element) => {
                element.removeEventListener("mouseenter", grow);
                element.removeEventListener("mouseleave", shrink);
            });
        };
    }, []);

    // Apply the same progressively revealed text treatment used on the homepage.
    // This runs before paint so service-page content does not visibly flash first.
    useLayoutEffect(() => {
        const serviceText = document.querySelectorAll<HTMLElement>(
            ".service-page .service-panel h2, .service-page .service-panel li, .service-page .service-wide > h2, .service-page .service-split > div, .service-page .deliverable-grid article, .service-page .engagement-steps li, .service-page .case-link-grid a, .service-page .service-faq details, .service-page .related-services a, .case-page .case-layout > section",
        );
        const delays = ["d1", "d2", "d3", "d4"];

        serviceText.forEach((element, index) => {
            element.classList.add("reveal", delays[index % delays.length]);
        });
    }, []);

    useEffect(() => {
        const revealElements = document.querySelectorAll<HTMLElement>(".reveal");
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            revealElements.forEach((element) => element.classList.add("in"));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -36px 0px" },
        );
        revealElements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    const navigationSettings = useMemo(
        () => ({
            ...settings,
            navigation: settings.navigation.map((link) => ({
                ...link,
                href:
                    link.href === "#contact"
                        ? "#contact"
                        : link.href === "#about"
                          ? "/#about"
                        : link.href.startsWith("#")
                          ? `/${link.href}`
                          : link.href,
            })),
        }),
        [settings],
    );

    return (
        <>
            <CursorChrome />
            <header>
                <Navbar
                    menuOpen={menuOpen}
                    navScrolled={navScrolled}
                    onCloseMenu={() => setMenuOpen(false)}
                    onToggleMenu={() => setMenuOpen((open) => !open)}
                    settings={navigationSettings}
                    homeHref="/"
                />
            </header>
            {children}
            <Contact content={contact} />
            <Footer settings={navigationSettings} />
        </>
    );
}
