export const validationConfig = {
  maxClaimAgeDays: 90,
  receiptThresholdMinorUnits: 1500, // e.g., $15.00
  duplicateDateWindowDays: 7,
  descriptionSimilarityThreshold: 0.8, // 80% similarity
  categoryLimitsMinorUnits: {
    MEALS: 5000,   // $50.00
    TRAVEL: 100000, // $1000.00
    SUPPLIES: 20000 // $200.00
  } as Record<string, number>
};
