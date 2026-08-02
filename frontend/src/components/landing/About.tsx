import { team } from "./data";
import { ArrowUpRight } from "./icons";
import { SectionChip } from "./SectionChip";

export function About() {
    return (
        <section id="about" aria-labelledby="about-h2">
            <div className="wrap">
                <div className="about-grid">
                    <div>
                        <SectionChip className="reveal">Our Story</SectionChip>
                        <h2 className="about-title reveal d1" id="about-h2">
                            We build <em>beyond</em> the <em>AI prototype</em>.
                        </h2>
                        <p className="about-body reveal d2">
                            Founded in 2015, Aranax Technologies helps startups,
                            agencies and enterprises design, build and scale AI
                            SaaS, RAG, web and mobile products.
                            <br />
                            <br />
                            Led by more than 25 years of software architecture
                            experience, our team combines strategic thinking
                            with practical engineering to create secure,
                            scalable systems built for real-world use.
                        </p>
                        <div className="stats-row reveal d3">
                            <div>
                                <div className="stat-n">
                                    <span className="cnt" data-to="25">
                                        0
                                    </span>
                                    <sup>+</sup>
                                </div>
                                <div className="stat-l">
                                    Years in Software Architecture
                                </div>
                            </div>
                            <div>
                                <div className="stat-n">
                                    <span className="cnt" data-to="10">
                                        0
                                    </span>
                                    <sup>+</sup>
                                </div>
                                <div className="stat-l">
                                    Years Building Products
                                </div>
                            </div>
                            <div>
                                <div className="stat-n">
                                    <span className="cnt" data-to="32">
                                        0
                                    </span>
                                    <sup>+</sup>
                                </div>
                                <div className="stat-l">Projects Delivered</div>
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
                            {team.map(([initials, name, role, avatar, url]) => (
                                <a
                                    className="team-card"
                                    role="listitem"
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${name} on LinkedIn (opens in a new tab)`}
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
