import { describe, it, expect, vi } from 'vitest';
import { validateClaim } from './claimValidationService';

const { prismaMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      expenseClaim: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

describe('claimValidationService', () => {
  it('returns PASS for a clean claim', async () => {
    prismaMock.expenseClaim.findUnique.mockResolvedValue({
      id: 'claim1',
      claimantId: 'user1',
      date: new Date(),
      category: 'MEALS',
      amountMinorUnits: 1000,
      currency: 'USD',
      description: 'Lunch',
      receiptAvailable: true,
    });
    prismaMock.expenseClaim.findMany.mockResolvedValue([]);

    const result = await validateClaim('claim1');
    expect(result.status).toBe('PASS');
    expect(result.findings).toHaveLength(0);
    expect(result.totals).toEqual({ USD: 1000 });
  });

  it('returns ERROR for a claim with missing receipt', async () => {
    prismaMock.expenseClaim.findUnique.mockResolvedValue({
      id: 'claim1',
      claimantId: 'user1',
      date: new Date(),
      category: 'MEALS',
      amountMinorUnits: 2000, // over 1500 limit
      currency: 'USD',
      description: 'Lunch',
      receiptAvailable: false, // missing receipt
    });
    prismaMock.expenseClaim.findMany.mockResolvedValue([]);

    const result = await validateClaim('claim1');
    expect(result.status).toBe('ERROR');
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'RECEIPT_REQUIRED' })
      ])
    );
  });

  it('returns WARNING for a near duplicate', async () => {
    const claimDate = new Date();
    prismaMock.expenseClaim.findUnique.mockResolvedValue({
      id: 'claim1',
      claimantId: 'user1',
      date: claimDate,
      category: 'MEALS',
      amountMinorUnits: 1000,
      currency: 'USD',
      description: 'Lunch with client',
      receiptAvailable: true,
    });
    prismaMock.expenseClaim.findMany.mockResolvedValue([
      {
        id: 'claim2',
        claimantId: 'user1',
        date: claimDate,
        category: 'MEALS',
        amountMinorUnits: 1000,
        currency: 'USD',
        description: 'Lunch with the client!',
      }
    ]);

    const result = await validateClaim('claim1');
    expect(result.status).toBe('WARNING');
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'NEAR_DUPLICATE', severity: 'warning' })
      ])
    );
  });

  it('returns ERROR with multiple findings', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    prismaMock.expenseClaim.findUnique.mockResolvedValue({
      id: 'claim1',
      claimantId: 'user1',
      date: futureDate,
      category: 'MEALS',
      amountMinorUnits: 6000, // over 5000 category limit
      currency: 'USD',
      description: '', // missing description
      receiptAvailable: false, // missing receipt and > 1500
    });
    prismaMock.expenseClaim.findMany.mockResolvedValue([]);

    const result = await validateClaim('claim1');
    expect(result.status).toBe('ERROR');
    expect(result.findings).toHaveLength(4); // FUTURE_DATE, CATEGORY_LIMIT_EXCEEDED, MISSING_DESCRIPTION, RECEIPT_REQUIRED
  });
});
