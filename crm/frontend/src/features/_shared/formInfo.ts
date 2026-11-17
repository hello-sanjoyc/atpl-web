import type { FormInfo } from '../../components/form/FormAside';

/** Brief, per-module descriptions shown beside each create form. */
export const FORM_INFO = {
  lead: {
    title: 'About leads',
    description:
      'A lead is a prospect who has shown interest but is not yet a qualified opportunity. Capture who they are and what they need so the team can follow up quickly.',
    tips: [
      'Name and email are required; everything else helps qualify.',
      'Set a priority so hot prospects surface first.',
      'Record service interest, budget and timeline to speed up handoff.',
    ],
  },
  opportunity: {
    title: 'About opportunities',
    description:
      'An opportunity is a qualified deal moving through your pipeline. Track its stage, value and type to forecast revenue and focus effort where it counts.',
    tips: [
      'Link the opportunity to the customer it belongs to.',
      'Keep the stage current — it drives the pipeline view.',
      'Estimated value feeds revenue forecasting.',
    ],
  },
  followup: {
    title: 'About follow-ups',
    description:
      'A follow-up is a scheduled task that keeps a relationship moving — a call, email or check-in tied to a lead, opportunity or customer.',
    tips: [
      'Give it a clear title and a due date.',
      'Link it to a lead, opportunity or customer.',
      'Add notes so anyone picking it up has context.',
    ],
  },
  customer: {
    title: 'About customers',
    description:
      'A customer is a won account you are actively serving. Keep their core details here as the system of record for contracts, revenue and follow-ups.',
    tips: [
      'Use complete contact details for accurate records.',
      'Customers link to opportunities, revenue and follow-ups.',
    ],
  },
  campaign: {
    title: 'About campaigns',
    description:
      'A campaign groups marketing spend and the leads it generates, so you can measure cost per lead and return on each channel.',
    tips: [
      'Set the status to reflect whether the campaign is live.',
      'Record cost to track ROI against the leads it produces.',
    ],
  },
  referral: {
    title: 'About referrals',
    description:
      'A referral records a lead introduced by an existing contact or partner, so credit and reward are tracked back to the source.',
    tips: [
      'Note who referred the lead to attribute the introduction.',
      'Referrals can convert into leads and opportunities.',
    ],
  },
  revenue: {
    title: 'About revenue records',
    description:
      'A revenue record logs money recognised against a customer — one-off or recurring — to build an accurate picture of income over time.',
    tips: [
      'Tie each record to the customer it was earned from.',
      'Choose the right kind so reporting stays accurate.',
    ],
  },
  user: {
    title: 'About users',
    description:
      'A user is a team member with access to the CRM. Their role determines what they can see and do across the system.',
    tips: [
      'Pick a role that matches the access the person needs.',
      'Use a valid email — it is their sign-in identity.',
    ],
  },
} satisfies Record<string, FormInfo>;
