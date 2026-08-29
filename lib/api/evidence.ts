/**
 * Canonical Evidence API Module
 * 
 * This module provides the canonical evidence submission endpoint
 * as defined in GF-4-BE (ThalosBackend issue #142)
 * 
 * Related: GF-4-FE (#141), GF-4-BE (#142)
 */

import { apiRequest, type ApiResponse } from "./client"
import { MilestoneStatus } from "../enums"

// ============================================================================
// EVIDENCE SUBMISSION (Canonical Path)
// ============================================================================

/**
 * Evidence submission payload
 */
export interface EvidenceSubmission {
  description: string
  files?: string[] // Optional file URLs or identifiers
}

/**
 * Evidence submission response
 */
export interface EvidenceSubmissionResponse {
  success: boolean
  milestone_index: number
  new_status: MilestoneStatus
  agreement_id: string
  timestamp: string
}

/**
 * Submit evidence for a milestone (CANONICAL ENDPOINT)
 * 
 * This is the authoritative evidence submission path defined in GF-4-BE.
 * It replaces the deprecated `/escrow/{contractId}/milestones/{milestoneIndex}/evidence`
 * 
 * @param agreementId - Agreement ID (not contract ID)
 * @param milestoneIndex - Zero-based milestone index
 * @param evidence - Evidence payload with description and optional files
 * @param token - JWT authentication token
 * @returns ApiResponse with submission confirmation
 */
export async function submitMilestoneEvidence(
  agreementId: string,
  milestoneIndex: number,
  evidence: EvidenceSubmission,
  token: string
): Promise<ApiResponse<EvidenceSubmissionResponse>> {
  return apiRequest<EvidenceSubmissionResponse>(
    `/agreements/${agreementId}/milestones/${milestoneIndex}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(evidence),
    },
    token
  )
}

/**
 * Get evidence for a specific milestone
 * 
 * @param agreementId - Agreement ID
 * @param milestoneIndex - Zero-based milestone index
 * @param token - JWT authentication token
 * @returns ApiResponse with evidence details
 */
export async function getMilestoneEvidence(
  agreementId: string,
  milestoneIndex: number,
  token: string
): Promise<ApiResponse<EvidenceSubmission>> {
  return apiRequest<EvidenceSubmission>(
    `/agreements/${agreementId}/milestones/${milestoneIndex}/evidence`,
    {
      method: "GET",
    },
    token
  )
}
