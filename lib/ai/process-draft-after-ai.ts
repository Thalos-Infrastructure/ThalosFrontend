import { type AgreementDraft } from "./agreement-draft.types"
import { validateAgreementDraft } from "./validate-agreement-draft"

export interface ProcessDraftAfterAIInput {
  draft: AgreementDraft
}

export interface ProcessDraftAfterAIResult {
  success: boolean
  data?: {
    draft: AgreementDraft
    validationErrors?: string[]
    confidence: number
  }
  error?: string
}

/**
 * Shared post-AI logic: validate draft and normalize confidence.
 */
export function processDraftAfterAI({
  draft,
}: ProcessDraftAfterAIInput): ProcessDraftAfterAIResult {
  const validation = validateAgreementDraft(draft)

  if (!validation.valid) {
    return {
      success: false,
      error: "Draft validation failed",
      data: {
        draft,
        validationErrors: validation.errors,
        confidence: 0,
      },
    }
  }

  return {
    success: true,
    data: {
      draft,
      confidence: 0.95,
    },
  }
}
