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
