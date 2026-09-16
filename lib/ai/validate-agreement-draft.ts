import { z } from "zod"
import {
  AgreementDraftSchema,
  validateMilestoneSum,
  getAgreementType,
  type AgreementDraft,
} from "./agreement-draft.types"

// System prompt for AI agreement draft generation
const SYSTEM_PROMPT = `You are an expert legal agreement draft generator for Thalos, a decentralized work platform.
Convert natural language deal descriptions into structured, validated agreement objects.

Guidelines:
1. Always output valid JSON matching the AgreementDraft schema
2. Use realistic Stellar wallet addresses (GB... format) for roles when not specified
3. For single-release: create 1 milestone with the full amount
4. For multi-release: split into 2-4 milestones with appropriate amounts
5. Set reasonable platform fees (0-5%)
6. Ensure all required fields are populated

Output ONLY the JSON object, no additional text.`

/**
 * Validates an agreement draft and returns any validation errors
 */
export function validateAgreementDraft(draft: AgreementDraft): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate schema
  const schemaResult = AgreementDraftSchema.safeParse(draft)
  if (!schemaResult.success) {
    errors.push(...schemaResult.error.errors.map((e) => e.message))
  }

  // Validate milestone sum
  const sumValidation = validateMilestoneSum(draft)
  if (!sumValidation.valid && sumValidation.error) {
    errors.push(sumValidation.error)
  }

  // Validate roles
  if (!draft.roles.approver) errors.push("Approver is required")
  if (!draft.roles.serviceProvider) errors.push("Service Provider is required")
  if (!draft.roles.releaseSigner) errors.push("Release Signer is required")

  return { valid: errors.length === 0, errors }
}

/**
 * Generates a system prompt from use cases
 */
export function buildSystemPrompt(useCase?: string): string {
  const useCasePrompt = useCase
    ? `\n\nUse Case: ${useCase}\nApply the appropriate template for this use case.`
    : ""
  return `${SYSTEM_PROMPT}${useCasePrompt}`
}
