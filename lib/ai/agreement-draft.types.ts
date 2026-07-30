import { z } from "zod";

// Milestone schema for agreement drafts
export const MilestoneSchema = z.object({
  description: z.string().min(1, "Milestone description is required"),
  amount: z.number().positive("Milestone amount must be positive"),
  status: z.enum(["pending", "in-progress", "completed", "disputed", "released"]).default("pending"),
});

// Agreement draft schema - maps to CreateAgreementInput
export const AgreementDraftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Total amount must be positive"),
  platformFee: z.string().optional().default("0"),
  signer: z.string().min(1, "Signer address is required"),
  serviceType: z.enum(["single-release", "multi-release"]).default("single-release"),
  roles: z.object({
    approver: z.string().min(1, "Approver is required"),
    serviceProvider: z.string().min(1, "Service Provider is required"),
    releaseSigner: z.string().min(1, "Release Signer is required"),
    receiver: z.string().optional(),
  }),
  milestones: z.array(MilestoneSchema).min(1, "At least one milestone is required"),
  notifications: z.object({
    notifyEmail: z.string().email("Invalid notify email").optional(),
    signerEmail: z.string().email("Invalid signer email").optional(),
  }).optional(),
});

// Request schema for AI draft generation
export const DraftRequestSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  useCase: z.string().optional(),
});

// API response envelope
export const DraftApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    draft: AgreementDraftSchema,
    validationErrors: z.array(z.string()).optional(),
    confidence: z.number().min(0).max(1).optional(),
  }).optional(),
  error: z.string().optional(),
});

// Infer types
export type Milestone = z.infer<typeof MilestoneSchema>;
export type AgreementDraft = z.infer<typeof AgreementDraftSchema>;
export type DraftRequest = z.infer<typeof DraftRequestSchema>;
export type DraftApiResponse = z.infer<typeof DraftApiResponseSchema>;

// Validation helper for milestone sum rule
export function validateMilestoneSum(draft: AgreementDraft): { valid: boolean; error?: string } {
  if (draft.amount <= 0) {
    return {
      valid: false,
      error: `Total amount must be greater than 0 (got ${draft.amount})`,
    };
  }
  if (draft.serviceType === "single-release") {
    // For single-release, amount should equal sum of milestone amounts
    const milestoneSum = draft.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    if (Math.abs(milestoneSum - draft.amount) > 0.01) {
      return {
        valid: false,
        error: `Milestone sum (${milestoneSum}) does not match total amount (${draft.amount})`,
      };
    }
  } else {
    // For multi-release, each milestone has its own amount
    const milestoneSum = draft.milestones.reduce((sum, m) => sum + (m.amount || 0), 0);
    if (Math.abs(milestoneSum - draft.amount) > 0.01) {
      return {
        valid: false,
        error: `Milestone sum (${milestoneSum}) does not match total amount (${draft.amount})`,
      };
    }
  }
  return { valid: true };
}

// Type inference helper
export function getAgreementType(draft: AgreementDraft): "single" | "multi" {
  return draft.milestones.length > 1 ? "multi" : "single";
}