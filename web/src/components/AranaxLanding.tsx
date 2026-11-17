"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import { About } from "./landing/About";
import { BuyerSegments } from "./landing/BuyerSegments";
import { Contact } from "./landing/Contact";
import { Evidence } from "./landing/Evidence";
import { CursorChrome } from "./landing/CursorChrome";
import { Footer } from "./landing/Footer";
import { Faq } from "./landing/Faq";
import { FinalCta } from "./landing/FinalCta";
import { Hero } from "./landing/Hero";
import { HowWeWork } from "./landing/HowWeWork";
import { Loader } from "./landing/Loader";
import { Navbar } from "./landing/Navbar";
import { Services } from "./landing/Services";
import { Ticker } from "./landing/Ticker";
import { Work } from "./landing/Work";
import { WhyAranax } from "./landing/WhyAranax";
import type { LandingPageContent } from "./landing/data";

export function AranaxLanding({ content }: { content: LandingPageContent }) {
    const [loaderGone, setLoaderGone] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);

    const loaderSessionKey = "aranax-home-loader-seen";

    // Run before paint when returning from a service page, avoiding a loader flash.
    useLayoutEffect(() => {
        if (window.sessionStorage.getItem(loaderSessionKey) === "true") {
            setLoaderGone(true);
        }
    }, []);

    useEffect(() => {
        if (window.sessionStorage.getItem(loaderSessionKey) === "true") {
            setLoaderGone(true);
            return;
        }

        window.sessionStorage.setItem(loaderSessionKey, "true");
        let timer: ReturnType<typeof setTimeout>;
        const hideLoader = () => {
            timer = setTimeout(() => setLoaderGone(true), 2100);
        };

        if (document.readyState === "complete") {
            hideLoader();
        } else {
            window.addEventListener("load", hideLoader, { once: true });
        }

        return () => {
            window.removeEventListener("load", hideLoader);
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
            return;
        }

        const cursor = document.getElementById("cursor");
        const cursorDot = document.getElementById("cursorDot");
        if (!cursor || !cursorDot) return;

        let mx = 0;
        let my = 0;
        let cx = 0;
        let cy = 0;
        let frame = 0;

        const moveDot = (event: MouseEvent) => {
            mx = event.clientX;
            my = event.clientY;
            cursorDot.style.transform = `translate(${mx - 2.5}px,${my - 2.5}px)`;
        };

        const moveCursor = () => {
            cx += (mx - cx) * 0.12;
            cy += (my - cy) * 0.12;
            cursor.style.transform = `translate(${cx - 19}px,${cy - 19}px)`;
            frame = requestAnimationFrame(moveCursor);
        };

        const grow = () => cursor.classList.add("grow");
        const shrink = () => cursor.classList.remove("grow");
        const hoverTargets = document.querySelectorAll<HTMLElement>(
            "a,button,.svc-card,.wc,.team-card",
        );

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

    useEffect(() => {
        const onScroll = () => setNavScrolled(window.scrollY > 60);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const revealElements =
            document.querySelectorAll<HTMLElement>(".reveal");

        if (reduced) {
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

    useEffect(() => {
        const counterElements = document.querySelectorAll<HTMLElement>(".cnt");
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (reduced) {
            counterElements.forEach((element) => {
                element.textContent = element.dataset.to ?? "0";
            });
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const element = entry.target as HTMLElement;
                    const end = Number.parseInt(element.dataset.to ?? "0", 10);
                    const duration = 1600;
                    const start = performance.now();

                    const tick = (now: number) => {
                        const progress = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        element.textContent = Math.floor(
                            eased * end,
                        ).toString();
                        if (progress < 1) {
                            requestAnimationFrame(tick);
                        } else {
                            element.textContent = end.toString();
                        }
                    };

                    requestAnimationFrame(tick);
                    observer.unobserve(element);
                });
            },
            { threshold: 0.6 },
        );

        counterElements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, []);

    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            <div className="grain" aria-hidden="true" />

            <Loader gone={loaderGone} siteName={content.site.siteName} />
            <CursorChrome />
            <Navbar
                menuOpen={menuOpen}
                navScrolled={navScrolled}
                onCloseMenu={closeMenu}
                onToggleMenu={() => setMenuOpen((open) => !open)}
                settings={content.site}
            />
            <Hero content={content.hero} />
            <Ticker items={content.site.expertiseTicker} />
            {content.buyerSegments ? <BuyerSegments content={content.buyerSegments} /> : null}
            <Services content={content.servicesSection} />
            <WhyAranax content={content.whyAranaxSection} />
            {content.evidenceSection ? <Evidence content={content.evidenceSection} /> : null}
            <Work content={content.caseStudiesSection} />
            {content.processSection ? <HowWeWork content={content.processSection} /> : null}
            <About content={content.aboutSection} />
            {content.faqSection ? <Faq content={content.faqSection} /> : null}
            {content.finalCta ? <FinalCta content={content.finalCta} /> : null}
            <Contact content={content.contactSection} />
            <Footer settings={content.site} />
        </>
    );
}
