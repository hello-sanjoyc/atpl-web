import type { AssessmentBand, AssessmentQuestion } from '../../db/schema/index.js';

export interface AssessmentDefinition {
  slug: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  bands: AssessmentBand[];
}

/**
 * Seeded assessment definitions. Every question carries a maximum of 20 points, so a complete
 * answer set always scores on a 0-100 scale.
 */
export const ASSESSMENT_CATALOG: AssessmentDefinition[] = [
  {
    slug: 'ai-saas-readiness',
    title: 'AI SaaS Readiness Assessment',
    description: 'Five questions that estimate how ready your product is to add AI features.',
    questions: [
      {
        id: 'product_stage',
        label: 'Where is your product today?',
        options: [
          { value: 'idea', label: 'Idea or concept', points: 0 },
          { value: 'prototype', label: 'Working prototype', points: 8 },
          { value: 'mvp', label: 'MVP with pilot or paying users', points: 14 },
          { value: 'scaling', label: 'Live product with steady usage', points: 20 },
        ],
      },
      {
        id: 'data_availability',
        label: 'How much usable data does your product already collect?',
        options: [
          { value: 'none', label: 'Little or none', points: 0 },
          { value: 'unstructured', label: 'Unstructured logs or documents', points: 8 },
          { value: 'structured', label: 'Structured tables with history', points: 14 },
          { value: 'labelled', label: 'Large, labelled datasets', points: 20 },
        ],
      },
      {
        id: 'team_capacity',
        label: 'How is engineering capacity covered?',
        options: [
          { value: 'none', label: 'No engineering team yet', points: 0 },
          { value: 'outsourced', label: 'Fully outsourced', points: 8 },
          { value: 'partial', label: 'Partly in-house, partly outsourced', points: 14 },
          { value: 'in_house', label: 'Dedicated in-house team', points: 20 },
        ],
      },
      {
        id: 'compliance',
        label: 'Which compliance obligations apply to your data?',
        options: [
          { value: 'not_sure', label: 'Not sure yet', points: 6 },
          { value: 'regulated', label: 'Strict regulation (e.g. health or finance)', points: 8 },
          { value: 'basic', label: 'Standard privacy obligations', points: 14 },
          { value: 'none_required', label: 'None expected', points: 20 },
        ],
      },
      {
        id: 'budget',
        label: 'What budget is available for the AI build?',
        options: [
          { value: 'under_5k', label: 'Under 5,000', points: 4 },
          { value: '5k_20k', label: '5,000 to 20,000', points: 12 },
          { value: '20k_50k', label: '20,000 to 50,000', points: 16 },
          { value: 'over_50k', label: 'Over 50,000', points: 20 },
        ],
      },
    ],
    bands: [
      { key: 'ready', label: 'Ready to build', min: 70, recommendation: 'Your product is well placed for an AI feature. A discovery call can define scope and success metrics.' },
      { key: 'nearly', label: 'Nearly ready', min: 40, recommendation: 'A focused data and architecture review would close the remaining gaps before building.' },
      { key: 'foundation', label: 'Foundation needed', min: 0, recommendation: 'Start with data collection and a narrow prototype before committing to a full AI build.' },
    ],
  },
];
