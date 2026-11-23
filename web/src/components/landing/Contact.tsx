import {
    ChangeEvent,
    FormEvent,
    FocusEvent,
    useEffect,
    useRef,
    useState,
} from "react";

import { ArrowUpRight, Check, ChevronDown, MailIcon, PinIcon } from "./icons";
import { SectionChip } from "./SectionChip";
import { CmsText } from "./CmsText";
import type { LandingPageContent } from "./data";

type FormValues = {
    fname: string;
    lname: string;
    email: string;
    phone: string;
    phoneCountry: string;
    company: string;
    country: string;
    serviceInterest: string;
    budgetRange: string;
    timeline: string;
    message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type SubmitStatus = {
    type: "success" | "error";
    message: string;
};

type OptionItem = { value: string; label: string };

type CountryItem = OptionItem & {
    name: string;
    flag: string | null;
    phoneCode: string;
};

function isoToFlag(iso: string) {
    if (!/^[A-Za-z]{2}$/.test(iso)) return "🌐";
    return iso
        .toUpperCase()
        .replace(/./g, (char) =>
            String.fromCodePoint(127397 + char.charCodeAt(0)),
        );
}

const DEFAULT_PHONE_COUNTRY = "US";

const requiredFields: Array<keyof FormValues> = [
    "fname",
    "lname",
    "email",
    "phone",
    "message",
];

const initialValues: FormValues = {
    fname: "",
    lname: "",
    email: "",
    phone: "",
    phoneCountry: DEFAULT_PHONE_COUNTRY,
    company: "",
    country: "",
    serviceInterest: "",
    budgetRange: "",
    timeline: "",
    message: "",
};

const fieldLabels: Record<keyof FormValues, string> = {
    fname: "First name",
    lname: "Last name",
    email: "Email",
    phone: "Phone",
    phoneCountry: "Phone country",
    company: "Company",
    country: "Country",
    serviceInterest: "Service interest",
    budgetRange: "Budget range",
    timeline: "Timeline",
    message: "Message",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9 ()-]{6,18}$/;

function validateField(name: keyof FormValues, value: string) {
    const trimmed = value.trim();

    if (requiredFields.includes(name) && !trimmed) {
        return `${fieldLabels[name]} is required.`;
    }

    if (name === "email" && trimmed && !emailPattern.test(trimmed)) {
        return "Enter a valid email address.";
    }

    if (name === "phone" && trimmed && !phonePattern.test(trimmed)) {
        return "Enter a valid phone number.";
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

function OptionSelect({
    id,
    options,
    value,
    placeholder,
    invalid,
    describedBy,
    searchable,
    searchPlaceholder = "Search...",
    onChange,
    onBlur,
}: {
    id: string;
    options: OptionItem[];
    value: string;
    placeholder: string;
    invalid?: boolean;
    describedBy?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    onChange: (value: string) => void;
    onBlur: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const selected = options.find((option) => option.value === value);
    const filteredOptions =
        searchable && query.trim()
            ? options.filter((option) =>
                  option.label.toLowerCase().includes(query.trim().toLowerCase()),
              )
            : options;

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
                onBlur();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () =>
            document.removeEventListener("pointerdown", handlePointerDown);
    }, [open, onBlur]);

    useEffect(() => {
        if (open && searchable) {
            searchRef.current?.focus();
        }
        if (!open) setQuery("");
    }, [open, searchable]);

    const selectValue = (next: string) => {
        onChange(next);
        setOpen(false);
        onBlur();
    };

    return (
        <div
            className={`select ${open ? "open" : ""}`}
            ref={rootRef}
            onKeyDown={(event) => {
                if (event.key === "Escape") {
                    setOpen(false);
                    onBlur();
                }
            }}
        >
            <button
                type="button"
                id={id}
                className="select-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                onClick={() => setOpen((current) => !current)}
            >
                <span className={selected ? "select-value" : "select-placeholder"}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown />
            </button>
            {open ? (
                <div className="select-menu">
                    {searchable ? (
                        <input
                            ref={searchRef}
                            type="text"
                            className="select-search"
                            placeholder={searchPlaceholder}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                        />
                    ) : null}
                    <ul
                        className="select-options"
                        role="listbox"
                        tabIndex={-1}
                    >
                        {!query.trim() ? (
                            <li
                                className={`select-option select-option-empty ${
                                    value === "" ? "selected" : ""
                                }`}
                                role="option"
                                aria-selected={value === ""}
                                onClick={() => selectValue("")}
                            >
                                {placeholder}
                            </li>
                        ) : null}
                        {filteredOptions.length === 0 ? (
                            <li className="select-option select-option-empty-state">
                                No matches found.
                            </li>
                        ) : null}
                        {filteredOptions.map((option) => (
                            <li
                                key={option.value}
                                className={`select-option ${
                                    option.value === value ? "selected" : ""
                                }`}
                                role="option"
                                aria-selected={option.value === value}
                                onClick={() => selectValue(option.value)}
                            >
                                <span>{option.label}</span>
                                {option.value === value ? <Check /> : null}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

function PhoneField({
    id,
    countries,
    countryValue,
    phoneValue,
    invalid,
    describedBy,
    onCountryChange,
    onPhoneChange,
    onBlur,
}: {
    id: string;
    countries: CountryItem[];
    countryValue: string;
    phoneValue: string;
    invalid?: boolean;
    describedBy?: string;
    onCountryChange: (value: string) => void;
    onPhoneChange: (value: string) => void;
    onBlur: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const selected = countries.find((country) => country.value === countryValue);
    const filteredCountries = query.trim()
        ? countries.filter((country) =>
              country.name.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : countries;

    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () =>
            document.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    useEffect(() => {
        if (open) searchRef.current?.focus();
        if (!open) setQuery("");
    }, [open]);

    const selectCountry = (next: string) => {
        onCountryChange(next);
        setOpen(false);
    };

    return (
        <div className={`phone-field ${open ? "open" : ""}`} ref={rootRef}>
            <button
                type="button"
                className="phone-flag-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                <span className="phone-flag" aria-hidden="true">
                    {selected?.flag ?? isoToFlag(countryValue)}
                </span>
                <ChevronDown size={11} />
            </button>
            <input
                type="tel"
                id={id}
                name="phone"
                placeholder="(415) 555-2671"
                autoComplete="tel-national"
                value={phoneValue}
                onBlur={onBlur}
                onChange={(event) => onPhoneChange(event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                required
            />
            {open ? (
                <div className="select-menu phone-menu">
                    <input
                        ref={searchRef}
                        type="text"
                        className="select-search"
                        placeholder="Search countries..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                    />
                    <ul className="select-options" role="listbox" tabIndex={-1}>
                        {filteredCountries.length === 0 ? (
                            <li className="select-option select-option-empty-state">
                                No matches found.
                            </li>
                        ) : null}
                        {filteredCountries.map((country) => (
                            <li
                                key={country.value}
                                className={`select-option phone-option ${
                                    country.value === countryValue
                                        ? "selected"
                                        : ""
                                }`}
                                role="option"
                                aria-selected={country.value === countryValue}
                                onClick={() => selectCountry(country.value)}
                            >
                                <span className="phone-option-flag">
                                    {country.flag ?? isoToFlag(country.value)}
                                </span>
                                <span className="phone-option-name">
                                    {country.name}
                                </span>
                                <span className="phone-option-code">
                                    {country.phoneCode}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}

export function Contact({
    content,
}: {
    content: LandingPageContent["contactSection"];
}) {
    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<SubmitStatus | null>(null);
    const [consent, setConsent] = useState(false);
    const [consentError, setConsentError] = useState("");
    const [serviceOptions, setServiceOptions] = useState<OptionItem[]>([]);
    const [budgetOptions, setBudgetOptions] = useState<OptionItem[]>([]);
    const [timelineOptions, setTimelineOptions] = useState<OptionItem[]>([]);
    const [countryOptions, setCountryOptions] = useState<CountryItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        fetch("/api/options")
            .then((response) => response.json())
            .then((data: Record<string, OptionItem[]>) => {
                if (!cancelled) {
                    setServiceOptions(data.service_interest ?? []);
                    setBudgetOptions(data.budget_range ?? []);
                    setTimelineOptions(data.timeline ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setServiceOptions([]);
                    setBudgetOptions([]);
                    setTimelineOptions([]);
                }
            });

        fetch("/api/countries")
            .then((response) => response.json())
            .then((data: CountryItem[]) => {
                if (!cancelled) setCountryOptions(data);
            })
            .catch(() => {
                if (!cancelled) setCountryOptions([]);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const updateField = (
        event: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
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
        event: FocusEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value } = event.target;
        const fieldName = name as keyof FormValues;

        setErrors((current) => ({
            ...current,
            [fieldName]: validateField(fieldName, value),
        }));
    };

    const updateConsent = (event: ChangeEvent<HTMLInputElement>) => {
        setConsent(event.target.checked);
        setSent(false);
        setStatus(null);
        if (event.target.checked) setConsentError("");
    };

    const selectFieldFor = (name: keyof FormValues) => ({
        onChange: (next: string) => {
            setValues((current) => ({
                ...current,
                [name]: next,
                ...(name === "country" && next ? { phoneCountry: next } : {}),
            }));
            setSent(false);
            setStatus(null);
        },
        onBlur: () => {
            setErrors((current) => ({
                ...current,
                [name]: validateField(name, values[name]),
            }));
        },
    });

    const isFormValid =
        consent &&
        requiredFields.every((name) => !validateField(name, values[name]));

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextErrors = validateForm(values);
        setErrors(nextErrors);

        const nextConsentError = consent
            ? ""
            : "You must accept the privacy policy to continue.";
        setConsentError(nextConsentError);

        if (Object.keys(nextErrors).length > 0 || nextConsentError) {
            setStatus({
                type: "error",
                message: "Please fix the highlighted fields and try again.",
            });
            return;
        }

        setSubmitting(true);
        setStatus(null);

        const dialCode =
            countryOptions.find(
                (country) => country.value === values.phoneCountry,
            )?.phoneCode ?? "";
        const fullPhone = `${dialCode}${values.phone.trim()}`;

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: `${values.fname.trim()} ${values.lname.trim()}`.trim(),
                    email: values.email,
                    phone: fullPhone,
                    company: values.company || undefined,
                    country: values.country || undefined,
                    serviceInterest: values.serviceInterest || undefined,
                    budgetRange: values.budgetRange || undefined,
                    timeline: values.timeline || undefined,
                    message: values.message,
                    consent,
                }),
            });
            const result = (await response.json()) as { message?: string };

            if (!response.ok) {
                throw new Error(result.message ?? "Message could not be sent.");
            }

            setSent(true);
            setValues(initialValues);
            setConsent(false);
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
                            {content.eyebrow}
                        </SectionChip>
                        <h2 className="contact-title reveal d1" id="contact-h2">
                            <CmsText text={content.heading} />
                        </h2>
                        <p className="contact-sub reveal d2">
                            {content.description}
                        </p>
                        <div className="contact-info reveal d3">
                            <div className="ci">
                                <MailIcon />
                                {content.email}
                            </div>
                            <div className="ci">
                                <PinIcon />
                                {content.location}
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
                                    placeholder="Gardner"
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
                        <div className="form-row">
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
                                <label htmlFor="ph">Phone</label>
                                <PhoneField
                                    id="ph"
                                    countries={countryOptions}
                                    countryValue={values.phoneCountry}
                                    phoneValue={values.phone}
                                    invalid={Boolean(errors.phone)}
                                    describedBy="ph-error"
                                    onCountryChange={(next) => {
                                        setValues((current) => ({
                                            ...current,
                                            phoneCountry: next,
                                            country: next,
                                        }));
                                        setSent(false);
                                        setStatus(null);
                                        if (errors.country) {
                                            setErrors((current) => ({
                                                ...current,
                                                country: validateField(
                                                    "country",
                                                    next,
                                                ),
                                            }));
                                        }
                                    }}
                                    onPhoneChange={(next) => {
                                        setValues((current) => ({
                                            ...current,
                                            phone: next,
                                        }));
                                        setSent(false);
                                        setStatus(null);
                                        if (errors.phone) {
                                            setErrors((current) => ({
                                                ...current,
                                                phone: validateField(
                                                    "phone",
                                                    next,
                                                ),
                                            }));
                                        }
                                    }}
                                    onBlur={() =>
                                        setErrors((current) => ({
                                            ...current,
                                            phone: validateField(
                                                "phone",
                                                values.phone,
                                            ),
                                        }))
                                    }
                                />
                                <FieldError
                                    id="ph-error"
                                    message={errors.phone}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="fg">
                                <label htmlFor="co">Company</label>
                                <input
                                    type="text"
                                    id="co"
                                    name="company"
                                    placeholder="Acme Inc."
                                    autoComplete="organization"
                                    value={values.company}
                                    onBlur={validateOnBlur}
                                    onChange={updateField}
                                    aria-invalid={Boolean(errors.company)}
                                    aria-describedby="co-error"
                                />
                                <FieldError
                                    id="co-error"
                                    message={errors.company}
                                />
                            </div>
                            <div className="fg">
                                <label htmlFor="country">Country</label>
                                <OptionSelect
                                    id="country"
                                    options={countryOptions}
                                    value={values.country}
                                    placeholder="Select country (optional)"
                                    invalid={Boolean(errors.country)}
                                    describedBy="country-error"
                                    searchable
                                    searchPlaceholder="Search countries..."
                                    {...selectFieldFor("country")}
                                />
                                <FieldError
                                    id="country-error"
                                    message={errors.country}
                                />
                            </div>
                        </div>
                        {serviceOptions.length > 0 ? (
                            <div className="fg">
                                <label htmlFor="svc">
                                    What are you building?
                                </label>
                                <OptionSelect
                                    id="svc"
                                    options={serviceOptions}
                                    value={values.serviceInterest}
                                    placeholder="Select a service (optional)"
                                    invalid={Boolean(errors.serviceInterest)}
                                    describedBy="svc-error"
                                    {...selectFieldFor("serviceInterest")}
                                />
                                <FieldError
                                    id="svc-error"
                                    message={errors.serviceInterest}
                                />
                            </div>
                        ) : null}
                        {budgetOptions.length > 0 || timelineOptions.length > 0 ? (
                            <div className="form-row">
                                {budgetOptions.length > 0 ? (
                                    <div className="fg">
                                        <label htmlFor="budget">
                                            Budget range
                                        </label>
                                        <OptionSelect
                                            id="budget"
                                            options={budgetOptions}
                                            value={values.budgetRange}
                                            placeholder="Select budget (optional)"
                                            invalid={Boolean(
                                                errors.budgetRange,
                                            )}
                                            describedBy="budget-error"
                                            {...selectFieldFor("budgetRange")}
                                        />
                                        <FieldError
                                            id="budget-error"
                                            message={errors.budgetRange}
                                        />
                                    </div>
                                ) : null}
                                {timelineOptions.length > 0 ? (
                                    <div className="fg">
                                        <label htmlFor="timeline">
                                            Timeline
                                        </label>
                                        <OptionSelect
                                            id="timeline"
                                            options={timelineOptions}
                                            value={values.timeline}
                                            placeholder="Select timeline (optional)"
                                            invalid={Boolean(errors.timeline)}
                                            describedBy="timeline-error"
                                            {...selectFieldFor("timeline")}
                                        />
                                        <FieldError
                                            id="timeline-error"
                                            message={errors.timeline}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
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
                        <div className="fg fg-consent">
                            <label className="consent-label" htmlFor="consent">
                                <input
                                    type="checkbox"
                                    id="consent"
                                    name="consent"
                                    checked={consent}
                                    onChange={updateConsent}
                                    aria-invalid={Boolean(consentError)}
                                    aria-describedby="consent-error"
                                    required
                                />
                                I agree to the Privacy Policy.
                            </label>
                            <FieldError
                                id="consent-error"
                                message={consentError}
                            />
                        </div>
                        <button
                            type="submit"
                            className={`btn-send ${sent ? "sent" : ""}`}
                            disabled={sent || submitting || !isFormValid}
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
