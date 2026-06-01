"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

type Service = {
    number: string;
    name: string;
    description: string;
    tags: string[];
    icon: "spark" | "chat" | "grid";
    delay?: string;
};

type Project = {
    tag: string;
    name: string;
    note: string;
    visual: "ema" | "docunova" | "radar" | "bars" | "voice";
};

const services: Service[] = [
    {
        number: "01",
        name: "AI Solutions",
        description:
            "End-to-end AI strategy and implementation. We audit your workflows, identify automation opportunities, and build systems that deliver measurable ROI from day one.",
        tags: ["LLM Integration", "Strategy", "Automation"],
        icon: "spark",
    },
    {
        number: "02",
        name: "Chatbot Development",
        description:
            "Context-aware conversational agents that handle customer support, lead qualification, and knowledge retrieval - 24/7, across every channel, at any scale.",
        tags: ["NLP", "RAG", "Multi-channel"],
        icon: "chat",
        delay: "d1",
    },
    {
        number: "03",
        name: "AI Tools & Platforms",
        description:
            "Custom-built AI applications - from internal copilots and analytics dashboards to B2B SaaS products powered by the latest foundation models and fine-tuned pipelines.",
        tags: ["SaaS", "Fine-tuning", "API Design"],
        icon: "grid",
        delay: "d2",
    },
];

const projects: Project[] = [
    {
        tag: "Email Assistant",
        name: "EMA - Smarter Inbox Management",
        note: "AI email assistant that helps you manage your inbox, draft replies, organize conversations, and save time with smarter email workflows.",
        visual: "ema",
    },
    {
        tag: "Legal document summariser",
        name: "DocuNova AI",
        note: "Upload a PDF or DOCX. Get a structured one-page brief with key dates, obligations, red flags, and renewal clauses — in plain English.",
        visual: "docunova",
    },
    {
        tag: "Chatbot for University",
        name: "UniChat - Conversational AI",
        note: "Multilingual text & voice based chatbot for university and higher education.",
        visual: "voice",
    },
];

const team = [
    ["SC", "Sanjoy C", "AI Strategist", "av1"],
    ["KP", "Kausik", "Product Manager", "av2"],
    ["ST", "Sabyasachi", "AI Enthuast", "av3"],
    ["AD", "Avigyan", "Head of Design", "av4"],
];

const marqueeItems = [
    "AI Strategy",
    "Chatbot Development",
    "Custom AI Tools",
    "LLM Integration",
    "Data Intelligence",
    "Process Automation",
    "Voice AI",
    "RAG Systems",
];

function ArrowUpRight({ size = 13 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 13 13"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M1 12L12 1M12 1H4M12 1V9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ArrowRight() {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M1 6H11M11 6L7 2M11 6L7 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Check() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M2 7l4 4 6-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ServiceIcon({ icon }: { icon: Service["icon"] }) {
    if (icon === "spark") {
        return (
            <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
        );
    }

    if (icon === "chat") {
        return (
            <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="9" cy="10" r="1" fill="currentColor" />
                <circle cx="12" cy="10" r="1" fill="currentColor" />
                <circle cx="15" cy="10" r="1" fill="currentColor" />
            </svg>
        );
    }

    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <path d="M3 17.5h4M5 14v7" />
        </svg>
    );
}

function ProjectVisual({ visual }: { visual: Project["visual"] }) {
    if (visual === "ema") {
        return (
            <div className="wc-vis wv-ema" aria-hidden="true">
                <div className="ema-orbit ema-orbit-top" />
                <div className="ema-orbit ema-orbit-center" />
                <div className="ema-shots">
                    <img
                        className="ema-shot ema-shot-left"
                        src="/assets/images/ema_01.png"
                        alt=""
                    />
                    <img
                        className="ema-shot ema-shot-right"
                        src="/assets/images/ema_02.png"
                        alt=""
                    />
                </div>
            </div>
        );
    }

    if (visual === "docunova") {
        return (
            <div className="wc-vis wv-docunova" aria-hidden="true">
                <div className="docunova-grid" />
                <div className="docunova-panels">
                    <img
                        className="docunova-panel docunova-summary"
                        src="/assets/images/docunova_summary.png"
                        alt=""
                    />
                    <img
                        className="docunova-panel docunova-chat"
                        src="/assets/images/docunova_chat.png"
                        alt=""
                    />
                </div>
            </div>
        );
    }

    if (visual === "radar") {
        return (
            <div className="wc-vis wv1" aria-hidden="true">
                <svg
                    className="wc-svg"
                    width="220"
                    height="220"
                    viewBox="0 0 220 220"
                    fill="none"
                >
                    <circle
                        cx="110"
                        cy="110"
                        r="80"
                        stroke="#C4813A"
                        strokeWidth=".6"
                    />
                    <circle
                        cx="110"
                        cy="110"
                        r="56"
                        stroke="#C4813A"
                        strokeWidth=".6"
                    />
                    <circle
                        cx="110"
                        cy="110"
                        r="32"
                        stroke="#C4813A"
                        strokeWidth=".6"
                    />
                    <line
                        x1="30"
                        y1="110"
                        x2="190"
                        y2="110"
                        stroke="#C4813A"
                        strokeWidth=".5"
                    />
                    <line
                        x1="110"
                        y1="30"
                        x2="110"
                        y2="190"
                        stroke="#C4813A"
                        strokeWidth=".5"
                    />
                    <line
                        x1="53"
                        y1="53"
                        x2="167"
                        y2="167"
                        stroke="#C4813A"
                        strokeWidth=".4"
                    />
                    <line
                        x1="167"
                        y1="53"
                        x2="53"
                        y2="167"
                        stroke="#C4813A"
                        strokeWidth=".4"
                    />
                    <circle cx="110" cy="110" r="6" fill="#C4813A" />
                </svg>
            </div>
        );
    }

    if (visual === "bars") {
        return (
            <div className="wc-vis wv2" aria-hidden="true">
                <svg
                    className="wc-svg"
                    width="180"
                    height="180"
                    viewBox="0 0 180 180"
                    fill="none"
                >
                    <rect
                        x="20"
                        y="60"
                        width="140"
                        height="7"
                        rx="3.5"
                        fill="#3A5444"
                    />
                    <rect
                        x="20"
                        y="80"
                        width="100"
                        height="7"
                        rx="3.5"
                        fill="#3A5444"
                    />
                    <rect
                        x="20"
                        y="100"
                        width="120"
                        height="7"
                        rx="3.5"
                        fill="#3A5444"
                    />
                    <rect
                        x="20"
                        y="120"
                        width="75"
                        height="7"
                        rx="3.5"
                        fill="#3A5444"
                    />
                    <rect
                        x="138"
                        y="20"
                        width="22"
                        height="140"
                        rx="4"
                        fill="#3A5444"
                        opacity=".5"
                    />
                    <circle cx="50" cy="38" r="14" fill="#3A5444" />
                    <circle cx="50" cy="38" r="6" fill="#2A3C32" />
                </svg>
            </div>
        );
    }

    return (
        <div className="wc-vis wv3" aria-hidden="true">
            <svg
                className="wc-svg"
                width="180"
                height="180"
                viewBox="0 0 180 180"
                fill="none"
            >
                <path
                    d="M40 140 Q90 38 140 140"
                    stroke="#7C5CBF"
                    strokeWidth="1"
                    fill="none"
                />
                <path
                    d="M55 135 Q90 55 125 135"
                    stroke="#7C5CBF"
                    strokeWidth=".6"
                    fill="none"
                />
                <circle cx="40" cy="140" r="5" fill="#7C5CBF" />
                <circle cx="90" cy="62" r="5" fill="#7C5CBF" />
                <circle cx="140" cy="140" r="5" fill="#7C5CBF" />
                <rect
                    x="78"
                    y="80"
                    width="24"
                    height="16"
                    rx="8"
                    fill="#7C5CBF"
                    opacity=".35"
                />
            </svg>
        </div>
    );
}

function MailIcon() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    );
}

function PinIcon() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function SectionChip({
    children,
    light = false,
    className = "",
}: {
    children: ReactNode;
    light?: boolean;
    className?: string;
}) {
    return (
        <p className={`chip ${light ? "chip-lt" : ""} ${className}`}>
            {children}
        </p>
    );
}

export function AranaxLanding() {
    const [loaderGone, setLoaderGone] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [navScrolled, setNavScrolled] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
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
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSent(true);
    };

    return (
        <>
            <div className="grain" aria-hidden="true" />

            <div
                id="loader"
                className={loaderGone ? "gone" : ""}
                role="status"
                aria-live="polite"
            >
                <div className="loader-word" aria-label="Aranax Technologies">
                    <span>Aranax</span>
                    <span>&thinsp;</span>
                    <span>Technologies</span>
                </div>
                <div className="loader-bar" />
                <p className="loader-tag">Intelligence, Engineered.</p>
            </div>

            <div className="cursor" id="cursor" aria-hidden="true" />
            <div className="cursor-dot" id="cursorDot" aria-hidden="true" />

            <nav
                id="nav"
                className={navScrolled ? "scrolled" : ""}
                role="navigation"
                aria-label="Primary"
            >
                <a
                    className="nav-logo"
                    href="#"
                    aria-label="Aranax Technologies home"
                    onClick={closeMenu}
                >
                    <img
                        src="/assets/images/logo.png"
                        alt=""
                        width={218}
                        height={72}
                    />
                    <span className="sr-only">Aranax Technologies</span>
                </a>
                <ul
                    className={`nav-links ${menuOpen ? "open" : ""}`}
                    id="navLinks"
                    role="list"
                >
                    <li>
                        <a href="#services" onClick={closeMenu}>
                            Services
                        </a>
                    </li>
                    <li>
                        <a href="#work" onClick={closeMenu}>
                            Work
                        </a>
                    </li>
                    <li>
                        <a href="#about" onClick={closeMenu}>
                            About
                        </a>
                    </li>
                    <li>
                        <a
                            href="#contact"
                            className="nav-cta"
                            onClick={closeMenu}
                        >
                            Let&apos;s Talk
                        </a>
                    </li>
                </ul>
                <button
                    className={`hamburger ${menuOpen ? "open" : ""}`}
                    aria-label="Open menu"
                    aria-expanded={menuOpen}
                    aria-controls="navLinks"
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </nav>

            <section id="hero" aria-labelledby="hero-h1">
                <div className="blob blob-amber" aria-hidden="true" />
                <div className="blob blob-sage" aria-hidden="true" />

                <div className="hero-inner wrap">
                    <p className="hero-eyebrow" aria-hidden="true">
                        <span className="eyebrow-dot" />
                        AI Development Agency
                    </p>
                    <h1 className="hero-title" id="hero-h1">
                        <span className="hero-line">
                            <span className="hero-line-inner">
                                We build intelligence
                            </span>
                        </span>
                        <span className="hero-line">
                            <span className="hero-line-inner">
                                that <em>works.</em>
                            </span>
                        </span>
                    </h1>
                    <div className="hero-bottom">
                        <p className="hero-desc">
                            Aranax Technologies crafts AI-powered solutions -
                            conversational chatbots, intelligent tools, and
                            custom automation - that give businesses an unfair
                            advantage.
                        </p>
                        <div className="hero-actions">
                            <a className="btn-a" href="#work">
                                View Our Work
                                <ArrowUpRight />
                            </a>
                            <a className="btn-ghost" href="#contact">
                                Start a project
                                <ArrowRight />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="scroll-cue" aria-hidden="true">
                    <span>Scroll</span>
                    <div className="scroll-line" />
                </div>
            </section>

            <div
                className="marquee-wrap"
                aria-hidden="true"
                role="presentation"
            >
                <div className="marquee-track">
                    {[...marqueeItems, ...marqueeItems].map((item, index) => (
                        <span className="mi" key={`${item}-${index}`}>
                            {item}
                            <span className="mi-dot" />
                        </span>
                    ))}
                </div>
            </div>

            <section id="services" aria-labelledby="svc-h2">
                <div className="wrap">
                    <div className="svc-header">
                        <div>
                            <SectionChip light className="reveal">
                                What We Build
                            </SectionChip>
                            <h2 className="svc-title reveal d1" id="svc-h2">
                                <span className="title-nowrap">
                                    AI that <em>transforms</em>
                                </span>
                                <br />
                                businesses.
                            </h2>
                        </div>
                        <p className="svc-sub reveal d2">
                            From conversational AI to custom intelligence
                            platforms, we engineer solutions tailored to your
                            exact context.
                        </p>
                    </div>

                    <div className="svc-grid" role="list">
                        {services.map((service) => (
                            <article
                                className={`svc-card reveal ${service.delay ?? ""}`}
                                role="listitem"
                                tabIndex={0}
                                aria-label={`${service.name} service`}
                                key={service.name}
                            >
                                <div className="svc-top">
                                    <div
                                        className="svc-icon"
                                        aria-hidden="true"
                                    >
                                        <ServiceIcon icon={service.icon} />
                                    </div>
                                    <span className="svc-num">
                                        {service.number}
                                    </span>
                                </div>
                                <h3 className="svc-name">{service.name}</h3>
                                <p className="svc-desc">
                                    {service.description}
                                </p>
                                <div className="svc-tags">
                                    {service.tags.map((tag) => (
                                        <span className="svc-tag" key={tag}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="work" aria-labelledby="work-h2">
                <div className="wrap">
                    <div className="work-header">
                        <div>
                            <SectionChip className="reveal">
                                Selected Work
                            </SectionChip>
                            <h2 className="work-title reveal d1" id="work-h2">
                                Built for <em>impact.</em>
                            </h2>
                        </div>
                        <a
                            className="work-all reveal d2"
                            href="#contact"
                            aria-label="Start a new project"
                        >
                            Start a project
                            <ArrowRight />
                        </a>
                    </div>

                    <div className="work-grid reveal">
                        {projects.map((project) => (
                            <article
                                className={`wc ${project.visual === "ema" ? "wc-featured" : ""} ${project.visual === "docunova" ? "wc-docunova" : ""}`}
                                aria-label={`${project.name} case study`}
                                key={project.name}
                            >
                                <ProjectVisual visual={project.visual} />
                                <div className="wc-over">
                                    <div className="wc-heading">
                                        <span className="wc-tag">
                                            {project.tag}
                                        </span>
                                        <h3 className="wc-name">
                                            {project.name}
                                        </h3>
                                    </div>
                                    <p className="wc-note">{project.note}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="about" aria-labelledby="about-h2">
                <div className="wrap">
                    <div className="about-grid">
                        <div>
                            <SectionChip className="reveal">
                                Our Story
                            </SectionChip>
                            <h2 className="about-title reveal d1" id="about-h2">
                                We don&apos;t
                                <br />
                                follow AI trends.
                                <br />
                                <em>We set them.</em>
                            </h2>
                            <p className="about-body reveal d2">
                                Founded in 2015, Aranax Technologies emerged
                                from a singular belief: artificial intelligence
                                should augment human potential, not replace it.
                                We partner with forward-thinking companies to
                                design and build AI systems that are
                                intelligent, ethical, and relentlessly
                                effective.
                            </p>
                            <div className="stats-row reveal d3">
                                <div>
                                    <div className="stat-n">
                                        <span className="cnt" data-to="3">
                                            0
                                        </span>
                                        <sup>+</sup>
                                    </div>
                                    <div className="stat-l">Years in AI</div>
                                </div>
                                <div>
                                    <div className="stat-n">
                                        <span className="cnt" data-to="32">
                                            0
                                        </span>
                                        <sup>+</sup>
                                    </div>
                                    <div className="stat-l">
                                        Projects Shipped
                                    </div>
                                </div>
                                <div>
                                    <div className="stat-n">
                                        <span className="cnt" data-to="18">
                                            0
                                        </span>
                                        <sup>+</sup>
                                    </div>
                                    <div className="stat-l">
                                        Clients Worldwide
                                    </div>
                                </div>
                                <div>
                                    <div className="stat-n">
                                        <span className="cnt" data-to="14">
                                            0
                                        </span>
                                    </div>
                                    <div className="stat-l">Team Members</div>
                                </div>
                            </div>
                        </div>

                        <div className="reveal d2">
                            <p className="team-hd">Core Team</p>
                            <div className="team-list" role="list">
                                {team.map(([initials, name, role, avatar]) => (
                                    <article
                                        className="team-card"
                                        role="listitem"
                                        tabIndex={0}
                                        key={name}
                                    >
                                        <div
                                            className={`team-av ${avatar}`}
                                            aria-hidden="true"
                                        >
                                            {initials}
                                        </div>
                                        <div>
                                            <div className="team-name">
                                                {name}
                                            </div>
                                            <div className="team-role">
                                                {role}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="contact" aria-labelledby="contact-h2">
                <div className="contact-glow" aria-hidden="true" />
                <div className="wrap">
                    <div className="contact-grid">
                        <div>
                            <SectionChip light className="reveal">
                                Get in Touch
                            </SectionChip>
                            <h2
                                className="contact-title reveal d1"
                                id="contact-h2"
                            >
                                Let&apos;s build
                                <br />
                                something
                                <br />
                                <em>extraordinary.</em>
                            </h2>
                            <p className="contact-sub reveal d2">
                                Whether you have a clear brief or just a spark
                                of an idea, we&apos;d love to hear from you. Our
                                team typically responds within 24 hours.
                            </p>
                            <div className="contact-info reveal d3">
                                <div className="ci">
                                    <MailIcon />
                                    hello@aranax.tech
                                </div>
                                <div className="ci">
                                    <PinIcon />
                                    Kolkata, India - Richmond, USA
                                </div>
                            </div>
                        </div>

                        <form
                            className="c-form reveal d1"
                            noValidate
                            aria-label="Contact form"
                            onSubmit={onSubmit}
                        >
                            <div className="form-row">
                                <div className="fg">
                                    <label htmlFor="fn">First Name</label>
                                    <input
                                        type="text"
                                        id="fn"
                                        name="fname"
                                        placeholder="Sofia"
                                        autoComplete="given-name"
                                        required
                                    />
                                </div>
                                <div className="fg">
                                    <label htmlFor="ln">Last Name</label>
                                    <input
                                        type="text"
                                        id="ln"
                                        name="lname"
                                        placeholder="Rajan"
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>
                            <div className="fg">
                                <label htmlFor="em">Email</label>
                                <input
                                    type="email"
                                    id="em"
                                    name="email"
                                    placeholder="you@company.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div className="fg">
                                <label htmlFor="proj">
                                    What are you building?
                                </label>
                                <input
                                    type="text"
                                    id="proj"
                                    name="project"
                                    placeholder="e.g. AI chatbot for customer support"
                                />
                            </div>
                            <div className="fg">
                                <label htmlFor="msg">Tell us more</label>
                                <textarea
                                    id="msg"
                                    name="message"
                                    placeholder="Share your vision, goals, or challenges..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className={`btn-send ${sent ? "sent" : ""}`}
                                disabled={sent}
                            >
                                {sent ? (
                                    <>
                                        <Check />
                                        Message Sent
                                    </>
                                ) : (
                                    <>
                                        Send Message
                                        <ArrowUpRight />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <footer role="contentinfo">
                <div className="wrap">
                    <div className="footer-in">
                        <div className="f-logo">
                            Aranax<span>.</span>
                        </div>
                        <p className="f-copy">
                            &copy; 2026 Aranax Technologies. All rights
                            reserved.
                        </p>
                        <ul className="f-links" role="list">
                            <li>
                                <a href="#">Privacy</a>
                            </li>
                            <li>
                                <a href="#">Terms</a>
                            </li>
                            <li>
                                <a href="#">Careers</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </footer>
        </>
    );
}
