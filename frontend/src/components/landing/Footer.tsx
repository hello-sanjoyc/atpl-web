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
                    {/* <ul className="f-links" role="list">
                        <li>
                            <a href="#">Privacy</a>
                        </li>
                        <li>
                            <a href="#">Terms</a>
                        </li>
                        <li>
                            <a href="#">Careers</a>
                        </li>
                    </ul> */}
                </div>
            </div>
        </footer>
    );
}
