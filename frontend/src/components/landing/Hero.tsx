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
                        conversational chatbots, intelligent tools, and custom
                        automation - that give businesses an unfair advantage.
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
    );
}
