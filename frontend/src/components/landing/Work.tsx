import { projects } from "./data";
import { ArrowRight, ArrowUpRight, ProjectVisual } from "./icons";
import { SectionChip } from "./SectionChip";

export function Work() {
    return (
        <section id="work" aria-labelledby="work-h2">
            <div className="wrap">
                <div className="work-header">
                    <div>
                        <SectionChip className="reveal">
                            Selected Work
                        </SectionChip>
                        <h2 className="work-title reveal d1" id="work-h2">
                            Built for <em>impact.</em>
                        </h2>
                    </div>
                    <a
                        className="work-all reveal d2"
                        href="#contact"
                        aria-label="Start a new project"
                    >
                        Start a project
                        <ArrowRight />
                    </a>
                </div>

                <div className="work-grid reveal">
                    {projects.map((project) => (
                        <a
                            className={`wc ${project.visual === "ema" ? "wc-featured" : ""} ${project.visual === "docunova" ? "wc-docunova" : ""}`}
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${project.name} project in a new window`}
                            key={project.name}
                        >
                            <span
                                className="wc-link-icon"
                                aria-hidden="true"
                            >
                                <ArrowUpRight />
                            </span>
                            <ProjectVisual visual={project.visual} />
                            <div className="wc-over">
                                <div className="wc-heading">
                                    <span className="wc-tag">
                                        {project.tag}
                                    </span>
                                    <h3 className="wc-name">
                                        {project.name}
                                    </h3>
                                </div>
                                <p className="wc-note">{project.note}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
