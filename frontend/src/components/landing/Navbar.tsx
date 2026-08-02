import Image from "next/image";

type NavbarProps = {
    menuOpen: boolean;
    navScrolled: boolean;
    onCloseMenu: () => void;
    onToggleMenu: () => void;
};

export function Navbar({
    menuOpen,
    navScrolled,
    onCloseMenu,
    onToggleMenu,
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
                href="#"
                aria-label="Aranax Technologies home"
                onClick={onCloseMenu}
            >
                <Image
                    src="/assets/images/logo.png"
                    alt=""
                    width={218}
                    height={72}
                    priority
                />
                <span className="sr-only">Aranax Technologies</span>
            </a>
            <ul
                className={`nav-links ${menuOpen ? "open" : ""}`}
                id="navLinks"
                role="list"
            >
                <li>
                    <a href="#services" onClick={onCloseMenu}>
                        Services
                    </a>
                </li>
                <li>
                    <a href="#case-studies" onClick={onCloseMenu}>
                        Case Studies
                    </a>
                </li>
                <li>
                    <a href="#about" onClick={onCloseMenu}>
                        About
                    </a>
                </li>
                <li>
                    <a
                        href="#contact"
                        className="nav-cta"
                        onClick={onCloseMenu}
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
                onClick={onToggleMenu}
            >
                <span />
                <span />
                <span />
            </button>
        </nav>
    );
}
