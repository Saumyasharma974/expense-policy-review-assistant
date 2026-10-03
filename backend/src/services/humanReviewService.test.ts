import { describe, it, expect, vi } from 'vitest';
import { processHumanReview } from './humanReviewService';

const { txMock, prismaMock } = vi.hoisted(() => {
  const txMock = {
    reviewHistory: { create: vi.fn() },
    expenseClaim: { update: vi.fn() },
  };
  return {
    txMock,
    prismaMock: {
      expenseClaim: { findUnique: vi.fn() },
      $transaction: vi.fn(async (cb) => cb(txMock)),
    }
  };
});

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => prismaMock),
}));

describe('processHumanReview', () => {
  const baseClaim = {
    id: 'claim1',
    finalStatus: 'PENDING_REVIEW',
    humanOverrideClassification: null,
    humanOverrideReason: null,
  };

  it('handles valid APPROVE', async () => {
    prismaMock.expenseClaim.findUnique.mockResolvedValueOnce(baseClaim);
    txMock.expenseClaim.update.mockResolvedValueOnce({ ...baseClaim, finalStatus: 'APPROVED' });

    const result = await processHumanReview('claim1', { action: 'APPROVE' });
    
    expect(result.finalStatus).toBe('APPROVED');
    expect(txMock.reviewHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'APPROVE', actorType: 'HUMAN' }) })
    );
  });

  it('handles valid OVERRIDE_CLASSIFICATION', async () => {
    prismaMock.expenseClaim.findUnique.mockResolvedValueOnce(baseClaim);
    txMock.expenseClaim.update.mockResolvedValueOnce({
      ...baseClaim,
      humanOverrideClassification: 'MEALS',
      humanOverrideReason: 'It is a meal',
    });

    const result = await processHumanReview('claim1', {
      action: 'OVERRIDE_CLASSIFICATION',
      classificationOverride: 'MEALS',
      reason: 'It is a meal'
    });

    expect(result.humanOverrideClassification).toBe('MEALS');
    expect(result.humanOverrideReason).toBe('It is a meal');
    expect(result.finalStatus).toBe('PENDING_REVIEW'); // status doesn't change on override alone
    expect(txMock.reviewHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'OVERRIDE_CLASSIFICATION', actorType: 'HUMAN' }) })
    );
  });
});
