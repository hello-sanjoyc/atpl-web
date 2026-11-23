import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { PublicLayout } from './PublicLayout';
import { Field, TextInput, TextArea, SelectInput } from '../../components/form/fields';
import { http } from '../../api/client';
import { endpoints } from '../../api/endpoints';
import { useToast } from '../../components/Toast';
import { useOptions } from '../_shared/useOptions';

const PRIVACY_VERSION = '2025-01';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal('')),
  company: z.string().max(160).optional().or(z.literal('')),
  serviceInterest: z.string().optional().or(z.literal('')),
  budgetRange: z.string().optional().or(z.literal('')),
  timeline: z.string().optional().or(z.literal('')),
  message: z.string().max(3000).optional().or(z.literal('')),
  privacyPolicy: z.literal(true, { message: 'Please accept the privacy policy.' }),
  marketing: z.boolean().optional(),
  // Honeypot — real users leave this empty.
  website: z.string().max(200).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function Enquiry({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const { optionsFor } = useOptions();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const body: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      formSource: 'website_contact',
      consent: {
        privacyPolicy: true,
        privacyPolicyVersion: PRIVACY_VERSION,
        marketing: !!data.marketing,
      },
    };
    for (const k of ['phone', 'company', 'serviceInterest', 'budgetRange', 'timeline', 'message'] as const) {
      if (data[k]) body[k] = data[k];
    }
    if (data.website) body.website = data.website; // honeypot passthrough
    try {
      await http.post(endpoints.public.enquiry, body);
      setSent(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not send your enquiry', 'error');
    }
  };

  const sentContent = (
    <p className="text-sm leading-relaxed text-[#6b7280]">
      Your enquiry is in. A member of the team will be in touch shortly.
    </p>
  );

  if (sent) {
    if (embedded) return sentContent;
    return <PublicLayout title="Thanks — we've got it">{sentContent}</PublicLayout>;
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {/* Honeypot: visually hidden, not announced to AT */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register('website')} />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" htmlFor="name" required error={errors.name?.message}>
          <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} />
        </Field>
        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
          <TextInput id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
        </Field>
        <Field label="Phone" htmlFor="phone"><TextInput id="phone" {...register('phone')} /></Field>
        <Field label="Company" htmlFor="company"><TextInput id="company" {...register('company')} /></Field>
        <Field label="Service interest" htmlFor="serviceInterest">
          <SelectInput id="serviceInterest" {...register('serviceInterest')} options={optionsFor('service_interest')} placeholder="—" />
        </Field>
        <Field label="Budget" htmlFor="budgetRange">
          <SelectInput id="budgetRange" {...register('budgetRange')} options={optionsFor('budget_range')} placeholder="—" />
        </Field>
      </div>
      <Field label="Timeline" htmlFor="timeline">
        <SelectInput id="timeline" {...register('timeline')} options={optionsFor('timeline')} placeholder="—" />
      </Field>
      <Field label="Message" htmlFor="message">
        <TextArea id="message" {...register('message')} placeholder="How can we help?" />
      </Field>

      <label className="flex items-start gap-2 text-[13px] text-[#6b7280]">
        <input type="checkbox" {...register('privacyPolicy')} className="mt-0.5 w-4 h-4 rounded border-[#e2e6f0] accent-[#f86223]" />
        <span>I accept the privacy policy.{errors.privacyPolicy && <span className="text-[#c62828] block">{errors.privacyPolicy.message}</span>}</span>
      </label>
      <label className="flex items-center gap-2 text-[13px] text-[#6b7280]">
        <input type="checkbox" {...register('marketing')} className="w-4 h-4 rounded border-[#e2e6f0] accent-[#f86223]" />
        Send me occasional product updates.
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 transition-all"
      >
        {isSubmitting ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );

  if (embedded) return formContent;

  return (
    <PublicLayout title="Get in touch" subtitle="Tell us what you're looking for and we'll reach out.">
      {formContent}
    </PublicLayout>
  );
}
