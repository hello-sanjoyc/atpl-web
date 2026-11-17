import type { ReactNode } from "react";

type SectionChipProps = {
    children: ReactNode;
    light?: boolean;
    className?: string;
};

export function SectionChip({
    children,
    light = false,
    className = "",
}: SectionChipProps) {
    return (
        <p className={`chip ${light ? "chip-lt" : ""} ${className}`}>
            {children}
        </p>
    );
}
