import { RuleFinding } from 'shared';

export function checkCategoryLimit(
  claim: { amountMinorUnits: number; category: string },
  categoryLimitsMinorUnits: Record<string, number>
): RuleFinding[] {
  const findings: RuleFinding[] = [];
  
  if (!claim.category || !claim.amountMinorUnits) return findings;

  const limit = categoryLimitsMinorUnits[claim.category.toUpperCase()];

  if (limit === undefined) {
    findings.push({
      code: 'UNKNOWN_CATEGORY',
      severity: 'warning',
      message: `Category '${claim.category}' is unknown. Manual review may be required.`,
      field: 'category'
    });
  } else if (claim.amountMinorUnits > limit) {
    findings.push({
      code: 'CATEGORY_LIMIT_EXCEEDED',
      severity: 'error',
      message: `Claim amount exceeds the limit for category ${claim.category}.`,
      field: 'amountMinorUnits'
    });
  }

  return findings;
}
