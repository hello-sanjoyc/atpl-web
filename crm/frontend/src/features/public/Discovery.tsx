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
  company: z.string().max(160).optional().or(z.literal('')),
  serviceInterest: z.string().optional().or(z.literal('')),
  timeline: z.string().optional().or(z.literal('')),
  preferredWindow: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(3000).optional().or(z.literal('')),
  privacyPolicy: z.literal(true, { message: 'Please accept the privacy policy.' }),
  website: z.string().max(200).optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export default function Discovery() {
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
      formSource: 'discovery_form',
      consent: { privacyPolicy: true, privacyPolicyVersion: PRIVACY_VERSION, marketing: false },
    };
    for (const k of ['company', 'serviceInterest', 'timeline', 'preferredWindow', 'message'] as const) {
      if (data[k]) body[k] = data[k];
    }
    if (data.website) body.website = data.website;
    try {
      await http.post(endpoints.public.discovery, body);
      setSent(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not book your call', 'error');
    }
  };

  if (sent) {
    return (
      <PublicLayout title="Request received">
        <p className="text-sm leading-relaxed text-[#6b7280]">
          We'll email you shortly to confirm a discovery call time.
        </p>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout title="Book a discovery call" subtitle="Share a few details and your preferred time.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register('website')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="name" required error={errors.name?.message}>
            <TextInput id="name" {...register('name')} aria-invalid={!!errors.name} />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email?.message}>
            <TextInput id="email" type="email" {...register('email')} aria-invalid={!!errors.email} />
          </Field>
          <Field label="Company" htmlFor="company"><TextInput id="company" {...register('company')} /></Field>
          <Field label="Service interest" htmlFor="serviceInterest">
            <SelectInput id="serviceInterest" {...register('serviceInterest')} options={optionsFor('service_interest')} placeholder="—" />
          </Field>
          <Field label="Timeline" htmlFor="timeline">
            <SelectInput id="timeline" {...register('timeline')} options={optionsFor('timeline')} placeholder="—" />
          </Field>
          <Field label="Preferred window" htmlFor="preferredWindow" hint="e.g. weekday mornings">
            <TextInput id="preferredWindow" {...register('preferredWindow')} />
          </Field>
        </div>
        <Field label="Anything else?" htmlFor="message">
          <TextArea id="message" {...register('message')} />
        </Field>
        <label className="flex items-start gap-2 text-[13px] text-[#6b7280]">
          <input type="checkbox" {...register('privacyPolicy')} className="mt-0.5 w-4 h-4 rounded border-[#e2e6f0] accent-[#f86223]" />
          <span>I accept the privacy policy.{errors.privacyPolicy && <span className="text-[#c62828] block">{errors.privacyPolicy.message}</span>}</span>
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-full bg-[#f86223] text-white text-sm font-bold hover:bg-[#d94f15] active:scale-[.99] disabled:opacity-50 transition-all"
        >
          {isSubmitting ? 'Sending…' : 'Request call'}
        </button>
      </form>
    </PublicLayout>
  );
}
