import type { LandingPageContent } from "./data";

export function Footer({ settings }: { settings: LandingPageContent["site"] }) {
    return (
        <footer role="contentinfo">
            <div className="wrap">
                <div className="footer-in">
                    <div className="f-logo">
                        {settings.siteName}<span>.</span>
                    </div>
                    <p className="f-copy">
                        {settings.footerText}
                    </p>
                </div>
            </div>
        </footer>
    );
}
