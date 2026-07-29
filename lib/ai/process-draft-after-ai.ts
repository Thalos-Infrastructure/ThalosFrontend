import type { AgreementDraft } from "./agreement-draft.types";
import { validateAgreementDraft, type ValidationResult } from "./validate-agreement-draft";

/**
 * Shared post-processing logic after AI draft generation.
 * Extracted so tests can reuse without calling the full route.
 *
 * @param draft - The draft returned by AI (may be modified in-place)
 * @param prompt - Original user prompt for risk flag context
 * @returns Validation result (should reject if milestone_sum_match is false)
 */
export function processDraftAfterAI(
  draft: AgreementDraft,
  prompt: string
): ValidationResult {
  const validation = validateAgreementDraft(
    draft.milestones,
    draft.amount,
    prompt
  );

  // Reject if milestone sum doesn't match
  if (!validation.milestone_sum_match) {
    return validation;
  }

  // Enforce type inference rule: multi if milestones > 1
  if (draft.milestones.length > 1 && draft.agreement_type !== "multi") {
    draft.agreement_type = "multi";
  } else if (draft.milestones.length === 1 && draft.agreement_type !== "single") {
    draft.agreement_type = "single";
  }

  // Merge risk flags from validation into metadata
  if (validation.risk_flags.length > 0) {
    draft.metadata.riskFlags.push(...validation.risk_flags);
  }

  return validation;
}
