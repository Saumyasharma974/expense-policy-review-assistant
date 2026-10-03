import { describe, it, expect } from 'vitest';
import { validateClaimDate } from './validateClaimDate';

describe('validateClaimDate', () => {
  const maxAgeDays = 90;

  it('passes a valid date (today)', () => {
    const now = new Date('2023-10-15T12:00:00Z');
    const claimDate = new Date('2023-10-15T08:00:00Z');
    const findings = validateClaimDate(claimDate, now, maxAgeDays);
    expect(findings).toHaveLength(0);
  });

  it('passes exact maximum age boundary', () => {
    const now = new Date('2023-10-15T12:00:00Z');
    const claimDate = new Date('2023-07-17T12:00:00Z'); // exactly 90 days
    const findings = validateClaimDate(claimDate, now, maxAgeDays);
    expect(findings).toHaveLength(0);
  });

  it('fails older than maximum age', () => {
    const now = new Date('2023-10-15T12:00:00Z');
    const claimDate = new Date('2023-07-16T12:00:00Z'); // 91 days
    const findings = validateClaimDate(claimDate, now, maxAgeDays);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'OLD_CLAIM', field: 'date' })
    ]);
  });

  it('fails future date', () => {
    const now = new Date('2023-10-15T12:00:00Z');
    const claimDate = new Date('2023-10-16T12:00:00Z');
    const findings = validateClaimDate(claimDate, now, maxAgeDays);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'FUTURE_DATE', field: 'date' })
    ]);
  });

  it('fails invalid date format', () => {
    const now = new Date();
    const findings = validateClaimDate(new Date('invalid'), now, maxAgeDays);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'INVALID_DATE', field: 'date' })
    ]);
  });
});
