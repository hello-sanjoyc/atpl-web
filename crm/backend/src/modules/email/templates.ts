import { ACKNOWLEDGEMENT_TEMPLATES } from '../../config/constants.js';

export type TemplateName = (typeof ACKNOWLEDGEMENT_TEMPLATES)[keyof typeof ACKNOWLEDGEMENT_TEMPLATES];

export interface RenderedEmail {
  subject: string;
  text: string;
}

export interface TemplateData {
  leadName?: string;
  company?: string | null;
  serviceInterest?: string | null;
  stage?: string;
  source?: string;
  bookingUrl?: string | null;
  contractName?: string;
  customerName?: string;
  renewsOn?: string;
  assessmentTitle?: string;
  assessmentScore?: number;
  assessmentBand?: string;
  recommendation?: string;
  leadId?: string;
}

/**
 * Plain-text templates only. User-supplied values are inserted verbatim into text bodies (never
 * into HTML) and are length-bounded, which avoids markup injection in mail clients.
 */
export function renderTemplate(template: TemplateName, data: TemplateData): RenderedEmail {
  const firstName = (data.leadName ?? 'there').split(' ')[0];
  switch (template) {
    case ACKNOWLEDGEMENT_TEMPLATES.LEAD:
      return {
        subject: 'Thanks for contacting Aranax Technologies',
        text: [
          `Hi ${firstName},`,
          '',
          'Thank you for reaching out to Aranax Technologies. We have received your enquiry and a member of our team will reply within one business day.',
          '',
          'Regards,',
          'Aranax Technologies',
        ].join('\n'),
      };
    case ACKNOWLEDGEMENT_TEMPLATES.DISCOVERY:
      return {
        subject: 'Your discovery call request',
        text: [
          `Hi ${firstName},`,
          '',
          'We have received your request for a discovery call.',
          data.bookingUrl ? `You can choose a slot here: ${data.bookingUrl}` : 'Our team will contact you shortly to arrange a time.',
          '',
          'Regards,',
          'Aranax Technologies',
        ].join('\n'),
      };
    case ACKNOWLEDGEMENT_TEMPLATES.SALES:
      return {
        subject: `New lead: ${truncate(data.leadName ?? 'Unnamed', 80)}`,
        text: [
          `Lead ID: ${data.leadId ?? '-'}`,
          `Company: ${data.company ?? '-'}`,
          `Service interest: ${data.serviceInterest ?? '-'}`,
          `Source: ${data.source ?? '-'}`,
          `Stage: ${data.stage ?? '-'}`,
        ].join('\n'),
      };
    case ACKNOWLEDGEMENT_TEMPLATES.RENEWAL:
      return {
        subject: `Renewal due: ${truncate(data.contractName ?? 'Contract', 80)}`,
        text: [
          `Customer: ${data.customerName ?? '-'}`,
          `Contract: ${data.contractName ?? '-'}`,
          `Renews on: ${data.renewsOn ?? '-'}`,
        ].join('\n'),
      };
    case ACKNOWLEDGEMENT_TEMPLATES.ASSESSMENT:
      return {
        subject: `Your ${truncate(data.assessmentTitle ?? 'readiness', 80)} results`,
        text: [
          `Hi ${firstName},`,
          '',
          `Your overall score is ${data.assessmentScore ?? 0} out of 100 (${data.assessmentBand ?? 'n/a'}).`,
          data.recommendation ?? '',
          '',
          'Regards,',
          'Aranax Technologies',
        ].join('\n'),
      };
    default:
      throw new Error(`Unknown email template: ${String(template)}`);
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
