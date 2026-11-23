import { useNavigate } from "react-router";
import { AppShell } from "../../components/layout/AppShell";

interface SettingCard {
    title: string;
    description: string;
    to: string;
    icon: React.ReactNode;
}

function IconShield() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

function IconUsers() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
    );
}

function IconBrain() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M9.5 2A2.5 2.5 0 017 4.5v.5H5.5A2.5 2.5 0 003 7.5v.5a2.5 2.5 0 002.5 2.5H6v.5a3 3 0 006 0v-.5h.5A2.5 2.5 0 0015 8v-.5A2.5 2.5 0 0012.5 5H12v-.5A2.5 2.5 0 009.5 2z" />
            <path d="M14.5 2A2.5 2.5 0 0117 4.5v.5h1.5A2.5 2.5 0 0121 7.5v.5a2.5 2.5 0 01-2.5 2.5H18v.5a3 3 0 01-6 0" />
            <path d="M6 17a3 3 0 006 0v-6.5" />
            <path d="M18 17a3 3 0 01-6 0" />
        </svg>
    );
}

function IconLock() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
    );
}

function IconGear() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    );
}

function IconRbac() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
            <path d="M16 11l1.5 1.5L20 10" />
        </svg>
    );
}

function IconChevron() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

const CARDS: SettingCard[] = [
    {
        title: "User Management",
        description:
            "Create, edit, and deactivate user accounts. Assign roles to control access.",
        to: "/users",
        icon: <IconUsers />,
    },
    {
        title: "User Roles",
        description:
            "Manage user role definitions. Create new roles and edit existing role details.",
        to: "/settings/user-roles",
        icon: <IconShield />,
    },
    {
        title: "RBAC Settings",
        description:
            "Review and configure role-based access controls and module-level permissions.",
        to: "/settings/rbac",
        icon: <IconRbac />,
    },
    {
        title: "LLM Configuration",
        description:
            "Set the AI provider, model, and API key. Switch between Claude, OpenAI, Gemini, and more.",
        to: "/settings/llm",
        icon: <IconBrain />,
    },
    {
        title: "Security",
        description:
            "Review access logs, active sessions, and authentication settings.",
        to: "/settings/security",
        icon: <IconLock />,
    },
    {
        title: "General",
        description:
            "Application-wide preferences including timezone, language, and display options.",
        to: "/settings/general",
        icon: <IconGear />,
    },
];

export default function SettingsHome() {
    const navigate = useNavigate();

    return (
        <AppShell>
            <div className="mb-6 pt-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="font-serif text-[32px] font-medium tracking-tight text-[#0f1117] leading-tight">
                            Settings
                        </h1>
                        <p className="text-sm text-[#6b7280] mt-1">
                            Choose a section to manage.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {CARDS.map((card) => (
                            <button
                                key={card.to}
                                onClick={() => navigate(card.to)}
                                className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-[#e2e6f0] shadow-sm hover:shadow-md hover:border-[#c7d2fe] transition-all text-left"
                            >
                                <div className="shrink-0 w-11 h-11 rounded-xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center group-hover:bg-[#e0e7ff] transition-colors">
                                    {card.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-[#0f1117] leading-snug">
                                        {card.title}
                                    </p>
                                    <p className="text-[12px] text-[#6b7280] mt-0.5 leading-snug line-clamp-2">
                                        {card.description}
                                    </p>
                                </div>
                                <div className="shrink-0 text-[#c8cfe0] group-hover:text-[#6366f1] transition-colors">
                                    <IconChevron />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
