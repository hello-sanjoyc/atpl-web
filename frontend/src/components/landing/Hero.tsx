import { ArrowRight, ArrowUpRight } from "./icons";

export function Hero() {
    return (
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
                            Build an <em>AI product</em>
                        </span>
                    </span>
                    <span className="hero-line">
                        <span className="hero-line-inner">
                            that <em>works beyond</em> the demo.
                        </span>
                    </span>
                </h1>
                <div className="hero-bottom">
                    <p className="hero-desc">
                        Aranax Technologies helps startups, agencies and
                        enterprises design, build and scale secure AI SaaS
                        platforms, RAG applications, intelligent agents and
                        workflow automation.
                        <br />
                        <br />
                        From technical feasibility and system architecture to
                        product development, deployment and optimisation, we
                        turn complex AI ideas into dependable software products.
                    </p>
                    <div className="hero-actions">
                        <a className="btn-a" href="#contact">
                            Discuss Your AI Product
                            <ArrowUpRight />
                        </a>
                        <a className="btn-ghost" href="#case-studies">
                            View Our Case Studies
                            <ArrowRight />
                        </a>
                    </div>
                </div>
                <ul className="hero-trust-strip" aria-label="Our capabilities">
                    <li>12+ Yrs. in Product Development</li>
                    <li>Architecture-First Development</li>
                    <li>AI, Web and Mobile Engineering</li>
                    <li>Supporting Clients Worldwide</li>
                </ul>
            </div>

            <div className="scroll-cue" aria-hidden="true">
                <span>Scroll</span>
                <div className="scroll-line" />
            </div>
        </section>
    );
}
