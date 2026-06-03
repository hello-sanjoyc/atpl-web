import type { FormEvent } from "react";

import { ArrowUpRight, Check, MailIcon, PinIcon } from "./icons";
import { SectionChip } from "./SectionChip";

type ContactProps = {
    sent: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function Contact({ sent, onSubmit }: ContactProps) {
    return (
        <section id="contact" aria-labelledby="contact-h2">
            <div className="contact-glow" aria-hidden="true" />
            <div className="wrap">
                <div className="contact-grid">
                    <div>
                        <SectionChip light className="reveal">
                            Get in Touch
                        </SectionChip>
                        <h2 className="contact-title reveal d1" id="contact-h2">
                            Let&apos;s build
                            <br />
                            something
                            <br />
                            <em>extraordinary.</em>
                        </h2>
                        <p className="contact-sub reveal d2">
                            Whether you have a clear brief or just a spark of an
                            idea, we&apos;d love to hear from you. Our team
                            typically responds within 24 hours.
                        </p>
                        <div className="contact-info reveal d3">
                            <div className="ci">
                                <MailIcon />
                                hello@aranax.tech
                            </div>
                            <div className="ci">
                                <PinIcon />
                                Kolkata, India - Richmond, USA
                            </div>
                        </div>
                    </div>

                    <form
                        className="c-form reveal d1"
                        noValidate
                        aria-label="Contact form"
                        onSubmit={onSubmit}
                    >
                        <div className="form-row">
                            <div className="fg">
                                <label htmlFor="fn">First Name</label>
                                <input
                                    type="text"
                                    id="fn"
                                    name="fname"
                                    placeholder="Sofia"
                                    autoComplete="given-name"
                                    required
                                />
                            </div>
                            <div className="fg">
                                <label htmlFor="ln">Last Name</label>
                                <input
                                    type="text"
                                    id="ln"
                                    name="lname"
                                    placeholder="Rajan"
                                    autoComplete="family-name"
                                />
                            </div>
                        </div>
                        <div className="fg">
                            <label htmlFor="em">Email</label>
                            <input
                                type="email"
                                id="em"
                                name="email"
                                placeholder="you@company.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="fg">
                            <label htmlFor="proj">What are you building?</label>
                            <input
                                type="text"
                                id="proj"
                                name="project"
                                placeholder="e.g. AI chatbot for customer support"
                            />
                        </div>
                        <div className="fg">
                            <label htmlFor="msg">Tell us more</label>
                            <textarea
                                id="msg"
                                name="message"
                                placeholder="Share your vision, goals, or challenges..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className={`btn-send ${sent ? "sent" : ""}`}
                            disabled={sent}
                        >
                            {sent ? (
                                <>
                                    <Check />
                                    Message Sent
                                </>
                            ) : (
                                <>
                                    Send Message
                                    <ArrowUpRight />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
