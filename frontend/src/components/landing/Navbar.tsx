import type { LandingPageContent } from "./data";

type NavbarProps = {
    menuOpen: boolean;
    navScrolled: boolean;
    onCloseMenu: () => void;
    onToggleMenu: () => void;
    settings: LandingPageContent["site"];
    homeHref?: string;
};

export function Navbar({
    menuOpen,
    navScrolled,
    onCloseMenu,
    onToggleMenu,
    settings,
    homeHref = "#",
}: NavbarProps) {
    return (
        <nav
            id="nav"
            className={navScrolled ? "scrolled" : ""}
            role="navigation"
            aria-label="Primary"
        >
            <a
                className="nav-logo"
                href={homeHref}
                aria-label={`${settings.siteName} home`}
                onClick={onCloseMenu}
            >
                <img
                    src={settings.logoUrl}
                    alt={settings.logoAlternativeText}
                    width={218}
                    height={72}
                />
                <span className="sr-only">{settings.siteName}</span>
            </a>
            <ul
                className={`nav-links ${menuOpen ? "open" : ""}`}
                id="navLinks"
                role="list"
            >
                {settings.navigation.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                        <a
                            href={link.href}
                            className={link.style === "primary" ? "nav-cta" : undefined}
                            target={link.openInNewTab ? "_blank" : undefined}
                            rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                            onClick={onCloseMenu}
                        >
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
            <button
                className={`hamburger ${menuOpen ? "open" : ""}`}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                aria-controls="navLinks"
                onClick={onToggleMenu}
            >
                <span />
                <span />
                <span />
            </button>
        </nav>
    );
}
