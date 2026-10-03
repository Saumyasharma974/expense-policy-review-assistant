import { PrismaClient } from '@prisma/client';
import { ValidationResult, RuleFinding } from 'shared';
import { logger } from '../utils/logger';
import {
  validationConfig,
  validateRequiredFields,
  validateClaimDate,
  checkReceiptRequirement,
  checkCategoryLimit,
  findDuplicates,
  DuplicateCandidate,
  calculateTotals
} from '../rules';

const prisma = new PrismaClient();

export async function validateClaim(claimId: string): Promise<ValidationResult> {
  logger.info({ claimId, operation: 'validateClaim' }, 'Starting claim validation');

  const claim = await prisma.expenseClaim.findUnique({
    where: { id: claimId }
  });

  if (!claim) {
    logger.warn({ claimId }, 'Claim not found for validation');
    throw new Error('Claim not found');
  }

  const findings: RuleFinding[] = [];
  const now = new Date();

  // 1. Required Fields
  findings.push(...validateRequiredFields(claim));

  // 2. Date Validation
  if (claim.date) {
    findings.push(...validateClaimDate(claim.date, now, validationConfig.maxClaimAgeDays));
  }

  // 3. Receipt Requirement
  if (claim.amountMinorUnits !== null && claim.receiptAvailable !== null) {
    findings.push(...checkReceiptRequirement(
      { amountMinorUnits: claim.amountMinorUnits, receiptAvailable: claim.receiptAvailable },
      validationConfig.receiptThresholdMinorUnits
    ));
  }

  // 4. Category Limit
  if (claim.amountMinorUnits !== null && claim.category) {
    findings.push(...checkCategoryLimit(
      { amountMinorUnits: claim.amountMinorUnits, category: claim.category },
      validationConfig.categoryLimitsMinorUnits
    ));
  }

  // 5. Duplicate Detection
  // Load candidate existing claims for this claimant, same currency and amount
  if (claim.amountMinorUnits !== null && claim.currency && claim.claimantId) {
    const existingClaims = await prisma.expenseClaim.findMany({
      where: {
        claimantId: claim.claimantId,
        amountMinorUnits: claim.amountMinorUnits,
        currency: claim.currency,
        id: { not: claim.id }
      }
    });

    const candidateClaims: DuplicateCandidate[] = existingClaims.map(c => ({
      id: c.id,
      claimantId: c.claimantId,
      amountMinorUnits: c.amountMinorUnits,
      currency: c.currency,
      date: c.date,
      description: c.description
    }));

    findings.push(...findDuplicates(
      {
        id: claim.id,
        claimantId: claim.claimantId,
        amountMinorUnits: claim.amountMinorUnits,
        currency: claim.currency,
        date: claim.date,
        description: claim.description
      },
      candidateClaims,
      validationConfig.duplicateDateWindowDays,
      validationConfig.descriptionSimilarityThreshold
    ));
  }

  // 6. Calculate Totals (Just for this claim, but uses the pure rule for consistency)
  const totals = calculateTotals([{ amountMinorUnits: claim.amountMinorUnits, currency: claim.currency }]);

  // Determine overall status
  let status: 'PASS' | 'WARNING' | 'ERROR' = 'PASS';
  if (findings.some(f => f.severity === 'error')) {
    status = 'ERROR';
  } else if (findings.some(f => f.severity === 'warning')) {
    status = 'WARNING';
  }

  const result: ValidationResult = {
    claimId,
    status,
    findings,
    totals
  };

  logger.info({ claimId, operation: 'validateClaim', status }, 'Claim validation completed');

  return result;
}
