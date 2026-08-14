import type { LandingPageContent } from "./data";
import { CmsText } from "./CmsText";
import { ArrowRight, ArrowUpRight, ProjectVisual } from "./icons";
import { SectionChip } from "./SectionChip";

export function Work({ content }: { content: LandingPageContent["caseStudiesSection"] }) {
    return (
        <section id="case-studies" aria-labelledby="work-h2">
            <div className="wrap">
                <div className="work-header">
                    <div>
                        <SectionChip className="reveal">
                            {content.eyebrow}
                        </SectionChip>
                        <h2 className="work-title reveal d1" id="work-h2">
                            <CmsText text={content.heading} />
                        </h2>
                        <div className="work-title-copy reveal d2">
                            <p>
                                {content.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="work-grid reveal">
                    {content.caseStudies.map((project) => (
                        <a
                            className={`wc wc-${project.visual}`}
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${project.name} project in a new window`}
                            key={project.name}
                        >
                            <div className="wc-over">
                                <header className="wc-card-header">
                                    <span className="wc-tag">
                                        {project.category}
                                    </span>
                                    <h3 className="wc-name">{project.name}</h3>
                                    <p className="wc-tagline">
                                        {project.tagline}
                                    </p>
                                </header>
                                <div className="wc-card-main">
                                    <div className="wc-media">
                                        <ProjectVisual
                                            visual={project.visual}
                                            imageUrl={project.imageUrl}
                                        />
                                    </div>
                                    <div className="wc-details">
                                        <div>
                                            <h4>Challenge</h4>
                                            <p>{project.challenge}</p>
                                        </div>
                                        <div>
                                            <h4>Solution</h4>
                                            <p>{project.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="wc-card-footer">
                                    <div>
                                        <h4>Outcome</h4>
                                        <p>{project.outcome}</p>
                                    </div>
                                    <div>
                                        <h4>Contribution</h4>
                                        <p>{project.contribution}</p>
                                    </div>
                                    <div className="wc-actions">
                                        <ul
                                            className="wc-tags"
                                            aria-label="Capabilities"
                                        >
                                            {project.tags.map((tag) => (
                                                <li key={tag}>{tag}</li>
                                            ))}
                                        </ul>
                                        <span className="wc-cta">
                                            View Product <ArrowUpRight />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
