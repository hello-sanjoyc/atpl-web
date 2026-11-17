import Image from "next/image";

import type { LandingPageContent } from "./data";
import { CmsText } from "./CmsText";
import { ArrowUpRight } from "./icons";
import { SectionChip } from "./SectionChip";

export function About({ content }: { content: LandingPageContent["aboutSection"] }) {
    return (
        <section id="about" aria-labelledby="about-h2">
            <div className="wrap">
                <div className="about-grid">
                    <div>
                        <SectionChip className="reveal">{content.eyebrow}</SectionChip>
                        <h2 className="about-title reveal d1" id="about-h2">
                            <CmsText text={content.heading} />
                        </h2>
                        <p className="about-body reveal d2">
                            <CmsText text={content.description} />
                        </p>
                        <div className="stats-row reveal d3">
                            {content.statistics.map((statistic) => (
                                <div key={statistic.label}>
                                    <div className="stat-n">
                                        <span
                                            className="cnt"
                                            data-to={statistic.value.toString()}
                                        >
                                            0
                                        </span>
                                        {statistic.suffix ? <sup>{statistic.suffix}</sup> : null}
                                    </div>
                                    <div className="stat-l">{statistic.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="reveal d2">
                        <p className="team-hd">{content.teamHeading}</p>
                        <div className="team-list" role="list">
                            {content.teamMembers.map((member) => (
                                <a
                                    className="team-card"
                                    role="listitem"
                                    href={member.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${member.name} on LinkedIn (opens in a new tab)`}
                                    key={member.name}
                                >
                                    <div
                                        className={`team-av ${member.avatar}`}
                                        aria-hidden="true"
                                    >
                                        {member.photoUrl ? (
                                            <Image
                                                src={member.photoUrl}
                                                alt=""
                                                width={72}
                                                height={72}
                                                sizes="72px"
                                            />
                                        ) : (
                                            member.initials
                                        )}
                                    </div>
                                    <div>
                                        <div className="team-name">{member.name}</div>
                                        <div className="team-role">{member.role}</div>
                                    </div>
                                    <span
                                        className="team-link-icon"
                                        aria-hidden="true"
                                    >
                                        <ArrowUpRight size={12} />
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
