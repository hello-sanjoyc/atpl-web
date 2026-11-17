import type { LandingPageContent } from "./data";
import { CmsText } from "./CmsText";
import { ServiceIcon } from "./icons";
import { SectionChip } from "./SectionChip";

export function Services({
    content,
}: {
    content: LandingPageContent["servicesSection"];
}) {
    return (
        <section id="services" aria-labelledby="svc-h2">
            <div className="wrap">
                <div className="svc-header">
                    <div>
                        <SectionChip light className="reveal">
                            {content.eyebrow}
                        </SectionChip>
                        <h2 className="svc-title reveal d1" id="svc-h2">
                            <span className="title-nowrap">
                                <CmsText text={content.heading} />
                            </span>
                        </h2>
                    </div>
                    <p className="svc-sub reveal d2">{content.description}</p>
                </div>

                <div className="svc-grid" role="list">
                    {content.services.map((service) => (
                        <article
                            className="svc-card reveal"
                            role="listitem"
                            key={service.name}
                        >
                            <div className="svc-top">
                                <div className="svc-icon" aria-hidden="true">
                                    <ServiceIcon
                                        icon={service.icon}
                                    />
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
                            <a
                                className="svc-link"
                                href={`/services/${service.slug}`}
                            >
                                {service.name} <span aria-hidden="true">→</span>
                            </a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
