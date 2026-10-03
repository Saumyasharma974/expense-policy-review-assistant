import { z } from 'zod';

export const HealthCheckSchema = z.object({
  status: z.string(),
});

export const FindingSeveritySchema = z.enum(['info', 'warning', 'error']);
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;

export const RuleFindingSchema = z.object({
  code: z.string(),
  severity: FindingSeveritySchema,
  message: z.string(),
  field: z.string().optional(),
});
export type RuleFinding = z.infer<typeof RuleFindingSchema>;

export const ValidationResultSchema = z.object({
  claimId: z.string(),
  status: z.enum(['PASS', 'WARNING', 'ERROR']),
  findings: z.array(RuleFindingSchema),
  totals: z.record(z.string(), z.number()),
});
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

export const AiClassificationSchema = z.object({
  classification: z.string().describe("The selected policy category for the claim"),
  confidence: z.number().int().min(0).max(100).describe("Confidence score between 0 and 100"),
  reason: z.string().describe("Concise explanation for the classification"),
});
export type AiClassification = z.infer<typeof AiClassificationSchema>;

export const AiComplianceStatusSchema = z.enum([
  'COMPLIANT',
  'NON_COMPLIANT',
  'NEEDS_CLARIFICATION',
  'NEEDS_MANUAL_REVIEW',
  'UNCERTAIN'
]);
export type AiComplianceStatus = z.infer<typeof AiComplianceStatusSchema>;

export const AiComplianceAssessmentSchema = z.object({
  complianceStatus: AiComplianceStatusSchema.describe("The compliance status"),
  explanation: z.string().describe("Explanation based on the actual stored PolicySection content"),
  uncertainty: z.boolean().describe("Whether the AI is uncertain about this assessment"),
  missingInformation: z.array(z.string()).describe("List of missing information required to make a policy assessment"),
  clarificationQuestion: z.string().nullable().describe("A question to ask the user to clarify missing or ambiguous info"),
  policyEvidence: z.string().describe("An exact substring from the stored policy text that justifies the decision"),
});
export type AiComplianceAssessment = z.infer<typeof AiComplianceAssessmentSchema>;

export const ClaimFinalStatusSchema = z.enum([
  'PENDING_REVIEW',
  'MANUAL_REVIEW_REQUIRED',
  'NEEDS_CLARIFICATION',
  'APPROVED',
  'REJECTED'
]);
export type ClaimFinalStatus = z.infer<typeof ClaimFinalStatusSchema>;

export const ReviewActionPayloadSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CLARIFICATION', 'OVERRIDE_CLASSIFICATION']),
  reason: z.string().min(1, "Reason is required for this action").optional(),
  classificationOverride: z.string().optional(),
}).superRefine((data, ctx) => {
  if (['REJECT', 'REQUEST_CLARIFICATION', 'OVERRIDE_CLASSIFICATION'].includes(data.action)) {
    if (!data.reason || data.reason.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason is required for REJECT, REQUEST_CLARIFICATION, and OVERRIDE_CLASSIFICATION",
        path: ['reason']
      });
    }
  }
  if (data.action === 'OVERRIDE_CLASSIFICATION' && (!data.classificationOverride || data.classificationOverride.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Classification override value is required",
      path: ['classificationOverride']
    });
  }
});
export type ReviewActionPayload = z.infer<typeof ReviewActionPayloadSchema>;


