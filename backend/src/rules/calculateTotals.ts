export function calculateTotals(claims: { amountMinorUnits: number; currency: string }[]): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const claim of claims) {
    if (typeof claim.amountMinorUnits !== 'number' || claim.amountMinorUnits <= 0 || !Number.isInteger(claim.amountMinorUnits)) {
      continue; // Skip invalid amounts
    }
    if (!claim.currency) continue;

    const currency = claim.currency.toUpperCase();
    totals[currency] = (totals[currency] || 0) + claim.amountMinorUnits;
  }

  return totals;
}
