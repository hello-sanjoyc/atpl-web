import { services } from "./data";
import { ServiceIcon } from "./icons";
import { SectionChip } from "./SectionChip";

export function Services() {
    return (
        <section id="services" aria-labelledby="svc-h2">
            <div className="wrap">
                <div className="svc-header">
                    <div>
                        <SectionChip light className="reveal">
                            What We Build
                        </SectionChip>
                        <h2 className="svc-title reveal d1" id="svc-h2">
                            <span className="title-nowrap">
                                AI products built for
                                <br />
                                <em>real-world use</em>
                            </span>
                        </h2>
                    </div>
                    <p className="svc-sub reveal d2">
                        From RAG applications and intelligent agents to complete
                        AI SaaS platforms, we design secure, scalable solutions
                        around your data, workflows and business goals.
                    </p>
                </div>

                <div className="svc-grid" role="list">
                    {services.map((service) => (
                        <article
                            className={`svc-card reveal ${service.delay ?? ""}`}
                            role="listitem"
                            tabIndex={0}
                            aria-label={`${service.name} service`}
                            key={service.name}
                        >
                            <div className="svc-top">
                                <div className="svc-icon" aria-hidden="true">
                                    <ServiceIcon icon={service.icon} />
                                </div>
                                <span className="svc-num">
                                    {service.number}
                                </span>
                            </div>
                            <h3 className="svc-name">{service.name}</h3>
                            <p className="svc-desc">{service.description}</p>
                            <div className="svc-tags">
                                {service.tags.map((tag) => (
                                    <span className="svc-tag" key={tag}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
