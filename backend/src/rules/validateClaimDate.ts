import { RuleFinding } from 'shared';

export function validateClaimDate(claimDate: Date, now: Date, maxAgeDays: number): RuleFinding[] {
  const findings: RuleFinding[] = [];

  if (!(claimDate instanceof Date) || isNaN(claimDate.getTime())) {
    return [{ code: 'INVALID_DATE', severity: 'error', message: 'Claim date is invalid.', field: 'date' }];
  }

  const timeDiff = now.getTime() - claimDate.getTime();
  const daysOld = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  if (daysOld < 0) {
    findings.push({ code: 'FUTURE_DATE', severity: 'error', message: 'Claim date cannot be in the future.', field: 'date' });
  } else if (daysOld > maxAgeDays) {
    findings.push({ code: 'OLD_CLAIM', severity: 'error', message: `Claim is older than the maximum allowed age of ${maxAgeDays} days.`, field: 'date' });
  }

  return findings;
}
