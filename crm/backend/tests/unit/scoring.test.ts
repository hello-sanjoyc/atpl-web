import { describe, expect, it } from 'vitest';
import { scoreLead, countUrls } from '../../src/modules/leads/lead-scoring.js';

describe('scoreLead', () => {
  it('reaches the maximum of 100 with every positive signal', () => {
    const result = scoreLead({
      budgetRange: 'over_50k',
      timeline: 'immediate',
      decisionMaker: true,
      hasCompany: true,
      serviceInterest: 'ai_saas',
      discoveryRequested: true,
    });
    expect(result.score).toBe(100);
    expect(result.priority).toBe('high');
    expect(result.qualified).toBe(true);
  });

  it('scores an empty lead as low and unqualified', () => {
    const result = scoreLead({ hasCompany: false });
    expect(result.score).toBe(0);
    expect(result.priority).toBe('low');
    expect(result.qualified).toBe(false);
  });

  it('never exceeds 100', () => {
    const result = scoreLead({ budgetRange: 'over_50k', timeline: 'immediate', decisionMaker: true, hasCompany: true, serviceInterest: 'ai_saas', discoveryRequested: true });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('counts URLs for spam protection', () => {
    expect(countUrls('see https://a.example and http://b.example')).toBe(2);
    expect(countUrls(undefined)).toBe(0);
  });
});
