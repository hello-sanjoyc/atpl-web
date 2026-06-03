import { team } from "./data";
import { SectionChip } from "./SectionChip";

export function About() {
    return (
        <section id="about" aria-labelledby="about-h2">
            <div className="wrap">
                <div className="about-grid">
                    <div>
                        <SectionChip className="reveal">
                            Our Story
                        </SectionChip>
                        <h2 className="about-title reveal d1" id="about-h2">
                            We don&apos;t
                            <br />
                            follow AI trends.
                            <br />
                            <em>We set them.</em>
                        </h2>
                        <p className="about-body reveal d2">
                            Founded in 2015, Aranax Technologies emerged from a
                            singular belief: artificial intelligence should
                            augment human potential, not replace it. We partner
                            with forward-thinking companies to design and build
                            AI systems that are intelligent, ethical, and
                            relentlessly effective.
                        </p>
                        <div className="stats-row reveal d3">
                            <div>
                                <div className="stat-n">
                                    <span className="cnt" data-to="3">
                                        0
                                    </span>
                                    <sup>+</sup>
                                </div>
                                <div className="stat-l">Years in AI</div>
                            </div>
                            <div>
                                <div className="stat-n">
                                    <span className="cnt" data-to="32">
                                        0
                                    </span>
                                    <sup>+</sup>
                                </div>
                                <div className="stat-l">Projects Shipped</div>
                            </div>
                            <div>
                                <div className="stat-n">
                                    <span className="cnt" data-to="18">
                                        0
                                    </span>
                                    <sup>+</sup>
                                </div>
                                <div className="stat-l">Clients Worldwide</div>
                            </div>
                            <div>
                                <div className="stat-n">
                                    <span className="cnt" data-to="14">
                                        0
                                    </span>
                                </div>
                                <div className="stat-l">Team Members</div>
                            </div>
                        </div>
                    </div>

                    <div className="reveal d2">
                        <p className="team-hd">Core Team</p>
                        <div className="team-list" role="list">
                            {team.map(([initials, name, role, avatar]) => (
                                <article
                                    className="team-card"
                                    role="listitem"
                                    tabIndex={0}
                                    key={name}
                                >
                                    <div
                                        className={`team-av ${avatar}`}
                                        aria-hidden="true"
                                    >
                                        {initials}
                                    </div>
                                    <div>
                                        <div className="team-name">{name}</div>
                                        <div className="team-role">{role}</div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
