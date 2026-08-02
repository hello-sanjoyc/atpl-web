import Image from "next/image";

import type { Project, Service } from "./data";

export function ArrowUpRight({ size = 13 }: { size?: number }) {
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

export function ArrowRight() {
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

export function Check() {
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

export function ServiceIcon({ icon }: { icon: Service["icon"] }) {
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

export function ProjectVisual({ visual }: { visual: Project["visual"] }) {
    const projectImages: Record<Project["visual"], string> = {
        ema: "/assets/images/casestudies/ema.webp",
        docunova: "/assets/images/casestudies/docunova.webp",
        uniecho: "/assets/images/casestudies/uniecho.webp",
        doubtace: "/assets/images/casestudies/doubtace.webp",
        gloziia: "/assets/images/casestudies/gloziia.webp",
        glamsync: "/assets/images/casestudies/glamsync.webp",
    };

    return (
        <div className="wc-vis" aria-hidden="true">
            <Image
                className="case-study-image"
                src={projectImages[visual]}
                alt=""
                width={1920}
                height={1080}
                sizes="(max-width: 680px) 100vw, (max-width: 960px) 55vw, 600px"
                loading="lazy"
            />
        </div>
    );

    if (visual === "ema") {
        return (
            <div className="wc-vis wv-ema" aria-hidden="true">
                <div className="ema-orbit ema-orbit-top" />
                <div className="ema-orbit ema-orbit-center" />
                <div className="ema-shots">
                    <Image
                        className="ema-shot ema-shot-left"
                        src="/assets/images/ema_01.webp"
                        alt=""
                        width={640}
                        height={1292}
                        sizes="(max-width: 768px) 34vw, 240px"
                        loading="lazy"
                    />
                    <Image
                        className="ema-shot ema-shot-right"
                        src="/assets/images/ema_02.webp"
                        alt=""
                        width={640}
                        height={1292}
                        sizes="(max-width: 768px) 34vw, 240px"
                        loading="lazy"
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
                    <Image
                        className="docunova-panel docunova-summary"
                        src="/assets/images/docunova_summary.webp"
                        alt=""
                        width={560}
                        height={500}
                        sizes="(max-width: 768px) 42vw, 280px"
                        loading="lazy"
                    />
                    <Image
                        className="docunova-panel docunova-chat"
                        src="/assets/images/docunova_chat.webp"
                        alt=""
                        width={420}
                        height={494}
                        sizes="(max-width: 768px) 38vw, 250px"
                        loading="lazy"
                    />
                </div>
            </div>
        );
    }

    if (visual === "uniecho") {
        return (
            <div className="wc-vis wv-docunova" aria-hidden="true">
                <div className="docunova-grid" />
                <div className="docunova-panels">
                    <Image
                        className="docunova-panel docunova-summary"
                        src="/assets/images/uniecho_how.webp"
                        alt=""
                        width={808}
                        height={473}
                        sizes="(max-width: 768px) 42vw, 280px"
                        loading="lazy"
                    />
                    <Image
                        className="docunova-panel docunova-chat"
                        src="/assets/images/uniecho_solution.webp"
                        alt=""
                        width={420}
                        height={494}
                        sizes="(max-width: 768px) 38vw, 250px"
                        loading="lazy"
                    />
                </div>
            </div>
        );
    }

    // TODO: Replace these intentionally named product placeholders with final
    // product screenshots when DoubtAce, Gloziia, and GlamSync assets are available.
    const placeholderLabels = {
        doubtace: ["Solved with AI", "Step-by-step explanation", "Board-aware guidance"],
        gloziia: ["Discover salons", "Upcoming appointments", "Partner dashboard"],
        glamsync: ["Today’s schedule", "Client profiles", "Business workspace"],
    } as const;

    const labels = placeholderLabels[visual as keyof typeof placeholderLabels];
    return (
        <div className={`wc-vis wc-placeholder wc-placeholder-${visual}`} aria-hidden="true">
            <div className="placeholder-window">
                <div className="placeholder-bar"><i /><i /><i /></div>
                <strong>{labels[0]}</strong>
                <span>{labels[1]}</span>
                <div className="placeholder-chart" />
                <small>{labels[2]}</small>
            </div>
        </div>
    );
}

export function MailIcon() {
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

export function PinIcon() {
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
