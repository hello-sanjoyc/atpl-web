import { SectionChip } from "./SectionChip";

const considerations = [
    "Multi-tenant architecture",
    "Data privacy and user permissions",
    "Retrieval quality and hallucination controls",
    "AI evaluation and observability",
    "Human review and escalation",
    "Token consumption and infrastructure costs",
    "API reliability and failure handling",
    "Product analytics and usage limits",
    "Security, deployment and long-term maintainability",
];

export function WhyAranax() {
    return (
        <section id="why-aranax" aria-labelledby="why-aranax-h2">
            <div className="wrap">
                <SectionChip className="reveal">Why Aranax</SectionChip>
                <h2 className="why-aranax-title reveal d1" id="why-aranax-h2">
                    Architecture first.
                    <br />
                    <em>AI second.</em>
                    <br />
                    Business outcome always.
                </h2>
                <div className="why-aranax-copy reveal d2">
                    <p>
                        Many AI prototypes look impressive during a
                        demonstration but fail when exposed to real customers,
                        unreliable data, high usage and security requirements.
                        <br />
                        Aranax approaches AI development as product engineering.
                    </p>
                </div>

                <div className="why-aranax-grid">
                    <div className="why-aranax-considerations reveal d2">
                        <p className="why-aranax-kicker">We consider</p>
                        <ol>
                            {considerations.map((consideration) => (
                                <li key={consideration}>{consideration}</li>
                            ))}
                        </ol>
                    </div>
                </div>

                <p className="why-aranax-outcome reveal d3">
                    The result is not simply an AI feature. It is a product
                    designed to operate reliably in production.
                </p>
            </div>
        </section>
    );
}
