import { describe, it, expect } from 'vitest';
import { findDuplicates, DuplicateCandidate } from './findDuplicates';

describe('findDuplicates', () => {
  const dateWindow = 7;
  const similarityThreshold = 0.8;

  const baseClaim: DuplicateCandidate = {
    id: 'claim1',
    claimantId: 'user1',
    amountMinorUnits: 1000,
    currency: 'USD',
    date: new Date('2023-10-10T10:00:00Z'),
    description: 'Dinner with client',
  };

  it('fails exact duplicate', () => {
    const existing = [ { ...baseClaim, id: 'claim2' } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'EXACT_DUPLICATE', severity: 'error' })
    ]);
  });

  it('fails near duplicate', () => {
    const existing = [ { ...baseClaim, id: 'claim2', description: 'Dinner with the client!' } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'NEAR_DUPLICATE', severity: 'warning' })
    ]);
  });

  it('passes different claimant', () => {
    const existing = [ { ...baseClaim, id: 'claim2', claimantId: 'user2' } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toHaveLength(0);
  });

  it('passes different amount', () => {
    const existing = [ { ...baseClaim, id: 'claim2', amountMinorUnits: 1001 } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toHaveLength(0);
  });

  it('passes different currency', () => {
    const existing = [ { ...baseClaim, id: 'claim2', currency: 'EUR' } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toHaveLength(0);
  });

  it('passes outside date window', () => {
    const existing = [ { ...baseClaim, id: 'claim2', date: new Date('2023-10-01T10:00:00Z') } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toHaveLength(0);
  });

  it('passes similar description but different transaction details (e.g. date out of window)', () => {
    const existing = [ { ...baseClaim, id: 'claim2', date: new Date('2023-01-01T10:00:00Z') } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toHaveLength(0);
  });

  it('passes different description', () => {
    const existing = [ { ...baseClaim, id: 'claim2', description: 'Completely unrelated purchase for office' } ];
    const findings = findDuplicates(baseClaim, existing, dateWindow, similarityThreshold);
    expect(findings).toHaveLength(0);
  });
});
