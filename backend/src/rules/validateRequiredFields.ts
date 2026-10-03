import { RuleFinding } from 'shared';

export interface ClaimInput {
  claimantId?: string | null;
  date?: Date | null;
  category?: string | null;
  amountMinorUnits?: number | null;
  currency?: string | null;
  description?: string | null;
  receiptAvailable?: boolean | null;
}

export function validateRequiredFields(claim: ClaimInput): RuleFinding[] {
  const findings: RuleFinding[] = [];

  if (!claim.claimantId) {
    findings.push({ code: 'MISSING_CLAIMANT', severity: 'error', message: 'Claimant ID is required.', field: 'claimantId' });
  }
  if (!claim.date) {
    findings.push({ code: 'MISSING_DATE', severity: 'error', message: 'Claim date is required.', field: 'date' });
  }
  if (!claim.category) {
    findings.push({ code: 'MISSING_CATEGORY', severity: 'error', message: 'Category is required.', field: 'category' });
  }
  if (claim.amountMinorUnits === undefined || claim.amountMinorUnits === null) {
    findings.push({ code: 'MISSING_AMOUNT', severity: 'error', message: 'Amount is required.', field: 'amountMinorUnits' });
  } else if (typeof claim.amountMinorUnits !== 'number' || claim.amountMinorUnits <= 0 || !Number.isInteger(claim.amountMinorUnits)) {
    findings.push({ code: 'INVALID_AMOUNT', severity: 'error', message: 'Amount must be a positive integer.', field: 'amountMinorUnits' });
  }
  if (!claim.currency) {
    findings.push({ code: 'MISSING_CURRENCY', severity: 'error', message: 'Currency is required.', field: 'currency' });
  }
  if (!claim.description || claim.description.trim() === '') {
    findings.push({ code: 'MISSING_DESCRIPTION', severity: 'error', message: 'Description is required.', field: 'description' });
  }
  if (claim.receiptAvailable === undefined || claim.receiptAvailable === null) {
    findings.push({ code: 'MISSING_RECEIPT_STATUS', severity: 'error', message: 'Receipt availability status is required.', field: 'receiptAvailable' });
  }

  return findings;
}
