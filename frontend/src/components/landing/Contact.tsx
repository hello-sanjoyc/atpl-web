import { ChangeEvent, FormEvent, FocusEvent, useState } from "react";

import { ArrowUpRight, Check, MailIcon, PinIcon } from "./icons";
import { SectionChip } from "./SectionChip";

type FormValues = {
    fname: string;
    lname: string;
    email: string;
    project: string;
    message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type SubmitStatus = {
    type: "success" | "error";
    message: string;
};

const initialValues: FormValues = {
    fname: "",
    lname: "",
    email: "",
    project: "",
    message: "",
};

const fieldLabels: Record<keyof FormValues, string> = {
    fname: "First name",
    lname: "Last name",
    email: "Email",
    project: "Project",
    message: "Message",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name: keyof FormValues, value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
        return `${fieldLabels[name]} is required.`;
    }

    if (name === "email" && !emailPattern.test(trimmed)) {
        return "Enter a valid email address.";
    }

    return "";
}

function validateForm(values: FormValues) {
    return (Object.keys(values) as Array<keyof FormValues>).reduce<FormErrors>(
        (errors, name) => {
            const error = validateField(name, values[name]);
            if (error) errors[name] = error;
            return errors;
        },
        {},
    );
}

function FieldError({ id, message }: { id: string; message?: string }) {
    return message ? (
        <p className="field-error" id={id}>
            {message}
        </p>
    ) : null;
}

export function Contact() {
    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<SubmitStatus | null>(null);

    const updateField = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;
        const fieldName = name as keyof FormValues;

        setValues((current) => ({ ...current, [fieldName]: value }));
        setSent(false);
        setStatus(null);
        if (errors[fieldName]) {
            setErrors((current) => ({
                ...current,
                [fieldName]: validateField(fieldName, value),
            }));
        }
    };

    const validateOnBlur = (
        event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = event.target;
        const fieldName = name as keyof FormValues;

        setErrors((current) => ({
            ...current,
            [fieldName]: validateField(fieldName, value),
        }));
    };

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors = validateForm(values);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setStatus({
                type: "error",
                message: "Please fix the highlighted fields and try again.",
            });
            return;
        }

        setSubmitting(true);
        setStatus(null);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            });
            const result = (await response.json()) as { message?: string };

            if (!response.ok) {
                throw new Error(result.message ?? "Message could not be sent.");
            }

            setSent(true);
            setValues(initialValues);
            setStatus({
                type: "success",
                message:
                    result.message ??
                    "Thanks. Your message has been sent successfully.",
            });
        } catch (error) {
            setSent(false);
            setStatus({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "We could not send your message. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

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
                        {status ? (
                            <div
                                className={`form-status ${status.type}`}
                                role="status"
                            >
                                {status.message}
                            </div>
                        ) : null}
                        <div className="form-row">
                            <div className="fg">
                                <label htmlFor="fn">First Name</label>
                                <input
                                    type="text"
                                    id="fn"
                                    name="fname"
                                    placeholder="Sofia"
                                    autoComplete="given-name"
                                    value={values.fname}
                                    onBlur={validateOnBlur}
                                    onChange={updateField}
                                    aria-invalid={Boolean(errors.fname)}
                                    aria-describedby="fn-error"
                                    required
                                />
                                <FieldError
                                    id="fn-error"
                                    message={errors.fname}
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
                                    value={values.lname}
                                    onBlur={validateOnBlur}
                                    onChange={updateField}
                                    aria-invalid={Boolean(errors.lname)}
                                    aria-describedby="ln-error"
                                    required
                                />
                                <FieldError
                                    id="ln-error"
                                    message={errors.lname}
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
                                value={values.email}
                                onBlur={validateOnBlur}
                                onChange={updateField}
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby="em-error"
                                required
                            />
                            <FieldError
                                id="em-error"
                                message={errors.email}
                            />
                        </div>
                        <div className="fg">
                            <label htmlFor="proj">What are you building?</label>
                            <input
                                type="text"
                                id="proj"
                                name="project"
                                placeholder="e.g. AI chatbot for customer support"
                                value={values.project}
                                onBlur={validateOnBlur}
                                onChange={updateField}
                                aria-invalid={Boolean(errors.project)}
                                aria-describedby="proj-error"
                                required
                            />
                            <FieldError
                                id="proj-error"
                                message={errors.project}
                            />
                        </div>
                        <div className="fg">
                            <label htmlFor="msg">Tell us more</label>
                            <textarea
                                id="msg"
                                name="message"
                                placeholder="Share your vision, goals, or challenges..."
                                value={values.message}
                                onBlur={validateOnBlur}
                                onChange={updateField}
                                aria-invalid={Boolean(errors.message)}
                                aria-describedby="msg-error"
                                required
                            />
                            <FieldError
                                id="msg-error"
                                message={errors.message}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`btn-send ${sent ? "sent" : ""}`}
                            disabled={sent || submitting}
                        >
                            {submitting ? (
                                "Sending..."
                            ) : sent ? (
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
