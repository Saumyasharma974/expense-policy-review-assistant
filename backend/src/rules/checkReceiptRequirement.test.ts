import { describe, it, expect } from 'vitest';
import { checkReceiptRequirement } from './checkReceiptRequirement';

describe('checkReceiptRequirement', () => {
  const threshold = 1500;

  it('passes below threshold + no receipt', () => {
    const findings = checkReceiptRequirement({ amountMinorUnits: 1499, receiptAvailable: false }, threshold);
    expect(findings).toHaveLength(0);
  });

  it('passes exactly threshold + no receipt', () => {
    const findings = checkReceiptRequirement({ amountMinorUnits: 1500, receiptAvailable: false }, threshold);
    expect(findings).toHaveLength(0);
  });

  it('fails above threshold + no receipt', () => {
    const findings = checkReceiptRequirement({ amountMinorUnits: 1501, receiptAvailable: false }, threshold);
    expect(findings).toEqual([
      expect.objectContaining({ code: 'RECEIPT_REQUIRED' })
    ]);
  });

  it('passes above threshold + receipt', () => {
    const findings = checkReceiptRequirement({ amountMinorUnits: 2000, receiptAvailable: true }, threshold);
    expect(findings).toHaveLength(0);
  });

  it('passes below threshold + receipt', () => {
    const findings = checkReceiptRequirement({ amountMinorUnits: 1000, receiptAvailable: true }, threshold);
    expect(findings).toHaveLength(0);
  });
});
