import { PrismaClient, Prisma } from '@prisma/client';
import { ReviewActionPayload } from 'shared';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export async function processHumanReview(claimId: string, payload: ReviewActionPayload, actorId: string = 'human-reviewer') {
  logger.info({ claimId, action: payload.action }, 'Processing human review action');

  const claim = await prisma.expenseClaim.findUnique({
    where: { id: claimId }
  });

  if (!claim) {
    throw new Error('Claim not found');
  }

  // Preserve previous AI findings, only append to ReviewHistory
  // and update the finalStatus or override fields of the claim.
  
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    let finalStatus = claim.finalStatus;
    let humanOverrideClassification = claim.humanOverrideClassification;
    let humanOverrideReason = claim.humanOverrideReason;

    switch (payload.action) {
      case 'APPROVE':
        finalStatus = 'APPROVED';
        break;
      case 'REJECT':
        finalStatus = 'REJECTED';
        break;
      case 'REQUEST_CLARIFICATION':
        finalStatus = 'NEEDS_CLARIFICATION';
        break;
      case 'OVERRIDE_CLASSIFICATION':
        if (!payload.classificationOverride) {
            throw new Error('Classification override is required');
        }
        humanOverrideClassification = payload.classificationOverride;
        humanOverrideReason = payload.reason || null;
        break;
    }

    // Append history
    await tx.reviewHistory.create({
      data: {
        claimId,
        actorType: 'HUMAN',
        actorId,
        action: payload.action,
        reason: payload.reason,
        payload: JSON.stringify({
          previousStatus: claim.finalStatus,
          newStatus: finalStatus,
          overrideClassification: payload.classificationOverride
        })
      }
    });

    // Update claim
    const updatedClaim = await tx.expenseClaim.update({
      where: { id: claimId },
      data: {
        finalStatus,
        humanOverrideClassification,
        humanOverrideReason
      }
    });

    return updatedClaim;
  });
}
