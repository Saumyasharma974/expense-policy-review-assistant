import { RuleFinding } from 'shared';

export function checkReceiptRequirement(
  claim: { amountMinorUnits: number; receiptAvailable: boolean },
  receiptThresholdMinorUnits: number
): RuleFinding[] {
  const findings: RuleFinding[] = [];

  if (claim.amountMinorUnits > receiptThresholdMinorUnits && !claim.receiptAvailable) {
    findings.push({
      code: 'RECEIPT_REQUIRED',
      severity: 'error',
      message: `A receipt is required for claims over ${receiptThresholdMinorUnits} minor units.`,
      field: 'receiptAvailable'
    });
  }

  return findings;
}
