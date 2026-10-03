import { PrismaClient } from '@prisma/client';
import { aiReviewWorkflow } from '../ai/workflow';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function analyzeClaim(claimId: string) {
  const workflowId = crypto.randomUUID();
  logger.info({ claimId, workflowId }, 'Starting AI analysis workflow');

  const claim = await prisma.expenseClaim.findUnique({
    where: { id: claimId }
  });

  if (!claim) {
    throw new Error('Claim not found');
  }

  // Pre-check for GROQ_API_KEY
  if (!process.env.GROQ_API_KEY) {
    const errorMsg = 'GROQ_API_KEY is missing';
    logger.error({ claimId, workflowId }, errorMsg);
    
    // Log failure in DB
    await prisma.reviewHistory.create({
      data: {
        claimId,
        actorType: 'SYSTEM',
        action: 'AI_REVIEW_FAILED',
        reason: errorMsg,
        payload: JSON.stringify({ workflowId, error: errorMsg })
      }
    });
    
    return { status: 'ERROR', error: errorMsg };
  }

  try {
    const initialState = {
      claim: {
        id: claim.id,
        category: claim.category,
        description: claim.description,
        amountMinorUnits: claim.amountMinorUnits,
        currency: claim.currency,
        receiptAvailable: claim.receiptAvailable
      },
      workflowId,
      policyCandidates: [],
      messages: []
    };

    const result = await aiReviewWorkflow.invoke(initialState);

    logger.info({ claimId, workflowId }, 'AI analysis workflow completed');
    
    return {
      status: result.error ? 'ERROR' : 'SUCCESS',
      classification: result.classification,
      compliance: result.compliance,
      isEvidenceVerified: result.isEvidenceVerified,
      error: result.error
    };
  } catch (error: any) {
    logger.error({ claimId, workflowId, err: error }, 'Unexpected workflow error');
    
    await prisma.reviewHistory.create({
      data: {
        claimId,
        actorType: 'SYSTEM',
        action: 'AI_REVIEW_FAILED',
        reason: 'Unexpected error: ' + error.message,
        payload: JSON.stringify({ workflowId, error: error.message })
      }
    });

    return { status: 'ERROR', error: error.message };
  }
}
