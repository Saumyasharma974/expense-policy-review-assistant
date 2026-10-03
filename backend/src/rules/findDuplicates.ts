import { RuleFinding } from 'shared';
import { calculateTextSimilarity } from './textSimilarity';

export interface DuplicateCandidate {
  id: string;
  claimantId: string;
  amountMinorUnits: number;
  currency: string;
  date: Date;
  description: string;
}

export function findDuplicates(
  claim: DuplicateCandidate,
  existingClaims: DuplicateCandidate[],
  dateWindowDays: number,
  similarityThreshold: number
): RuleFinding[] {
  const findings: RuleFinding[] = [];

  for (const existing of existingClaims) {
    if (existing.id === claim.id) continue;

    // Check strict deterministic fields
    if (existing.claimantId !== claim.claimantId) continue;
    if (existing.amountMinorUnits !== claim.amountMinorUnits) continue;
    if (existing.currency !== claim.currency) continue;

    // Check date window
    const timeDiff = Math.abs(claim.date.getTime() - existing.date.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (daysDiff > dateWindowDays) continue;

    // Check description similarity
    const similarity = calculateTextSimilarity(claim.description, existing.description);
    
    if (similarity >= similarityThreshold) {
      if (similarity === 1.0) {
        findings.push({
          code: 'EXACT_DUPLICATE',
          severity: 'error',
          message: `Exact duplicate found. Claim matches existing claim ${existing.id}.`,
        });
      } else {
        findings.push({
          code: 'NEAR_DUPLICATE',
          severity: 'warning',
          message: `Potential duplicate. Description is ${(similarity * 100).toFixed(0)}% similar to existing claim ${existing.id}.`,
        });
      }
    }
  }

  return findings;
}
