import { describe, it, expect } from 'vitest';
import { validateRequiredFields } from './validateRequiredFields';

describe('validateRequiredFields', () => {
  it('passes a valid claim', () => {
    const claim = {
      claimantId: 'user1',
      date: new Date(),
      category: 'MEALS',
      amountMinorUnits: 1500,
      currency: 'USD',
      description: 'Lunch',
      receiptAvailable: true,
    };
    const findings = validateRequiredFields(claim);
    expect(findings).toHaveLength(0);
  });

  it('fails missing claimant', () => {
    const findings = validateRequiredFields({} as any);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_CLAIMANT', field: 'claimantId' }),
      ])
    );
  });

  it('fails missing date', () => {
    const findings = validateRequiredFields({ claimantId: 'user1' } as any);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_DATE', field: 'date' }),
      ])
    );
  });

  it('fails missing category', () => {
    const findings = validateRequiredFields({ claimantId: 'user1', date: new Date() } as any);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_CATEGORY', field: 'category' }),
      ])
    );
  });

  it('fails missing amount', () => {
    const findings = validateRequiredFields({ claimantId: 'user1', date: new Date(), category: 'MEALS' } as any);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_AMOUNT', field: 'amountMinorUnits' }),
      ])
    );
  });

  it('fails invalid amount', () => {
    const findings = validateRequiredFields({ claimantId: 'user1', date: new Date(), category: 'MEALS', amountMinorUnits: -10 } as any);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'INVALID_AMOUNT', field: 'amountMinorUnits' }),
      ])
    );
  });

  it('fails missing currency', () => {
    const findings = validateRequiredFields({ claimantId: 'user1', date: new Date(), category: 'MEALS', amountMinorUnits: 100 } as any);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_CURRENCY', field: 'currency' }),
      ])
    );
  });

  it('fails missing description', () => {
    const findings = validateRequiredFields({ claimantId: 'user1', date: new Date(), category: 'MEALS', amountMinorUnits: 100, currency: 'USD', description: '  ' } as any);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'MISSING_DESCRIPTION', field: 'description' }),
      ])
    );
  });
});
