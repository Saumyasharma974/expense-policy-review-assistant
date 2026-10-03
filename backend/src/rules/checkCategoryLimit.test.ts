import { describe, it, expect } from 'vitest';
import { checkCategoryLimit } from './checkCategoryLimit';

describe('checkCategoryLimit', () => {
  const limits = { MEALS: 5000 };

  it('passes below limit', () => {
    const findings = checkCategoryLimit({ amountMinorUnits: 4999, category: 'MEALS' }, limits);
    expect(findings).toHaveLength(0);
  });

  it('passes exactly equal to limit', () => {
    const findings = checkCategoryLimit({ amountMinorUnits: 5000, category: 'MEALS' }, limits);
    expect(findings).toHaveLength(0);
  });

  it('fails above limit', () => {
    const findings = checkCategoryLimit({ amountMinorUnits: 5001, category: 'MEALS' }, limits);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'CATEGORY_LIMIT_EXCEEDED' })
    ]);
  });

  it('fails unknown category', () => {
    const findings = checkCategoryLimit({ amountMinorUnits: 1000, category: 'XYZ' }, limits);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'UNKNOWN_CATEGORY', severity: 'warning' })
    ]);
  });
});
