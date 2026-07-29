import { z } from "zod";

/**
 * Zod schema for AI agreement draft — single source of truth.
 * Maps to CreateAgreementInput / AgreementMilestone from lib/actions/agreements.ts.
 *
 * AgreementType: "single" | "multi" | "bounty"
 * AgreementMilestone.status: "pending" | "approved" | "released"
 * New milestones always use "pending".
 */

export const DraftMilestoneSchema = z.object({
  description: z.string().min(1, "Milestone description is required"),
  amount: z.string().min(1, "Milestone amount is required"),
  status: z.literal("pending").default("pending"),
});

export type DraftMilestone = z.infer<typeof DraftMilestoneSchema>;

export const AgreementDraftSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  amount: z.string().min(1, "Total amount is required"),
  asset: z.literal("USDC").default("USDC"),
  agreement_type: z.enum(["single", "multi"]),
  milestones: z.array(DraftMilestoneSchema).min(1, "At least one milestone required"),
  metadata: z.object({
    generatedByAI: z.literal(true).default(true),
    riskFlags: z.array(z.string()).default([]),
    useCase: z.string().optional(),
  }),
});

export type AgreementDraft = z.infer<typeof AgreementDraftSchema>;

/** Request body for the draft route. */
export const DraftRequestSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters"),
  useCase: z.string().optional(),
});

export type DraftRequest = z.infer<typeof DraftRequestSchema>;

/** App response envelope: { success, data, error }. */
export type DraftApiResponse =
  | { success: true; data: AgreementDraft }
  | { success: false; error: string; data?: never };
