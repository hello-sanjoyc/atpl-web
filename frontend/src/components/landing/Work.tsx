import type { LandingPageContent } from "./data";
import { CmsText } from "./CmsText";
import { ArrowUpRight, ProjectVisual } from "./icons";
import { SectionChip } from "./SectionChip";

function CaseStudyCardTitle({ name }: { name: string }) {
    const match = name.match(/^(.*?)\s+[-—]\s+(.*)$/);
    if (!match) return name;

    return <>{match[1]} <span aria-hidden="true">-</span> <span className="wc-name-detail">{match[2]}</span></>;
}

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
                        <article
                            className={`wc wc-${project.visual}`}
                            key={project.name}
                        >
                            <a
                                className="wc-card-link"
                                href={`/case-studies/${project.slug}`}
                                aria-label={`Read the ${project.name} case study`}
                            />
                            <div className="wc-over">
                                <header className="wc-card-header">
                                    <span className="wc-tag">
                                        {project.category}
                                    </span>
                                    <h3 className="wc-name"><CaseStudyCardTitle name={project.name} /></h3>
                                    <p className="wc-tagline">
                                        {project.tagline}
                                    </p>
                                </header>
                                <a className="wc-top-product" href={project.url} target="_blank" rel="noopener noreferrer">
                                    Visit Product <ArrowUpRight />
                                </a>
                                <div className="wc-card-main">
                                    <div className="wc-media">
                                        <ProjectVisual
                                            visual={project.visual}
                                            imageUrl={project.imageUrl}
                                            alt={`${project.name} cover image`}
                                        />
                                    </div>
                                </div>
                                <div className="wc-card-actions">
                                    <ul className="wc-tags" aria-label="Capabilities">
                                        {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
