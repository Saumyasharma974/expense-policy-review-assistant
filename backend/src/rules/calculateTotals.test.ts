import { describe, it, expect } from 'vitest';
import { calculateTotals } from './calculateTotals';

describe('calculateTotals', () => {
  it('calculates USD totals integer arithmetic', () => {
    const claims = [
      { amountMinorUnits: 1500, currency: 'USD' },
      { amountMinorUnits: 2500, currency: 'USD' }
    ];
    const totals = calculateTotals(claims);
    expect(totals).toEqual({ USD: 4000 });
  });

  it('calculates INR totals integer arithmetic', () => {
    const claims = [
      { amountMinorUnits: 10000, currency: 'INR' },
      { amountMinorUnits: 15000, currency: 'INR' }
    ];
    const totals = calculateTotals(claims);
    expect(totals).toEqual({ INR: 25000 });
  });

  it('keeps multiple currencies separate', () => {
    const claims = [
      { amountMinorUnits: 1000, currency: 'USD' },
      { amountMinorUnits: 2000, currency: 'EUR' },
      { amountMinorUnits: 500, currency: 'USD' },
    ];
    const totals = calculateTotals(claims);
    expect(totals).toEqual({ USD: 1500, EUR: 2000 });
  });

  it('handles floating point precision seamlessly due to integer enforcement', () => {
    const claims = [
      { amountMinorUnits: 1000, currency: 'USD' },
      { amountMinorUnits: 2000, currency: 'USD' },
    ];
    // No floats allowed in our design
    expect(calculateTotals(claims)).toEqual({ USD: 3000 });
  });

  it('ignores zero or invalid values', () => {
    const claims = [
      { amountMinorUnits: 100, currency: 'USD' },
      { amountMinorUnits: -50, currency: 'USD' },
      { amountMinorUnits: 0, currency: 'USD' },
      { amountMinorUnits: 50.5, currency: 'USD' }, // Invalid float
    ];
    const totals = calculateTotals(claims);
    expect(totals).toEqual({ USD: 100 });
  });
});
