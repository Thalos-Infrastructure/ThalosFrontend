"use server"

// Re-export types and functions from the backend API client
export type {
  AgreementStatus,
  MilestoneStatus,
  AgreementType,
  ParticipantRole,
  AgreementMilestone,
  Agreement,
  AgreementParticipant,
  AgreementActivity,
  CreateAgreementInput,
} from "@/lib/api/agreements"

import {
  createAgreement as createAgreementApi,
  getAgreements as getAgreementsApi,
  getAgreement as getAgreementApi,
  updateAgreementStatusApi,
  updateMilestoneStatus as updateMilestoneStatusApi,
  getAgreementActivityApi,
  getAgreementByContractIdApi,
  linkContractToAgreementApi,
  getAgreementsByWallet as getAgreementsByWalletApi,
  getAgreementByIdWithParticipants,
  type Agreement,
  type AgreementStatus,
  type AgreementMilestone,
  type AgreementActivity,
  type AgreementParticipant,
  type CreateAgreementInput,
} from "@/lib/api/agreements"

/**
 * Create a new agreement via backend API
 * @param input Agreement creation input
 * @param token JWT token for authentication with backend API
 */
export async function createAgreementInDb(
  input: CreateAgreementInput,
  token: string
): Promise<{ agreement: Agreement | null; error: string | null }> {
  try {
    const result = await createAgreementApi(input, token)
    if (!result.success) {
      console.error("Error creating agreement:", result.error)
      return { agreement: null, error: result.error || "Failed to create agreement" }
    }
    return { agreement: result.data || null, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create agreement"
    return { agreement: null, error: message }
  }
}

/**
 * Update agreement with contract_id after Trustless Work deployment
 * @param agreementId Agreement ID
 * @param contractId Contract ID
 * @param actorWallet Wallet of the actor making the change
 * @param token JWT token for authentication with backend API
 */
export async function linkContractToAgreement(
  agreementId: string,
  contractId: string,
  actorWallet: string,
  token: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const result = await linkContractToAgreementApi(agreementId, contractId, actorWallet, token)
    if (!result.success) {
      return { success: false, error: result.error || "Failed to link contract" }
    }
    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to link contract"
    return { success: false, error: message }
  }
}

/**
 * Update agreement status
 * IMPORTANT: This function signature is preserved for disputes.ts compatibility.
 * The token parameter is now required for backend API calls.
 * @param agreementId Agreement ID
 * @param status New status
 * @param actorWallet Wallet of the actor making the change
 * @param token JWT token for authentication with backend API
 */
export async function updateAgreementStatus(
  agreementId: string,
  status: AgreementStatus,
  actorWallet: string,
  token?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!token) {
      return { success: false, error: "Authentication token required" }
    }

    const result = await updateAgreementStatusApi(agreementId, status, actorWallet, token)
    if (!result.success) {
      return { success: false, error: result.error || "Failed to update status" }
    }

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update status"
    return { success: false, error: message }
  }
}

/**
 * Update milestone status
 * @param agreementId Agreement ID
 * @param milestoneIndex Index of milestone to update
 * @param status New status
 * @param actorWallet Wallet of the actor making the change
 * @param token JWT token for authentication with backend API
 */
export async function updateMilestoneStatus(
  agreementId: string,
  milestoneIndex: number,
  status: AgreementMilestone["status"],
  actorWallet: string,
  token?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!token) {
      return { success: false, error: "Authentication token required" }
    }

    const updateResult = await updateMilestoneStatusApi(
      agreementId,
      milestoneIndex,
      status,
      actorWallet,
      undefined,
      token
    )
    if (!updateResult.success) {
      return { success: false, error: updateResult.error || "Failed to update milestone" }
    }

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update milestone"
    return { success: false, error: message }
  }
}

/**
 * Get agreements by wallet (as participant)
 * @param walletAddress Wallet address to filter by
 * @param token JWT token for authentication (optional for public queries)
 */
export async function getAgreementsByWallet(
  walletAddress: string,
  token?: string
): Promise<{ agreements: Agreement[]; error: string | null }> {
  try {
    const result = await getAgreementsByWalletApi(walletAddress, token)
    if (!result.success) {
      return { agreements: [], error: result.error || "Failed to fetch agreements" }
    }
    return { agreements: result.data || [], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch agreements"
    return { agreements: [], error: message }
  }
}

/**
 * Get agreement by ID with participants
 * @param agreementId Agreement ID
 * @param token JWT token for authentication (optional for public queries)
 */
export async function getAgreementById(
  agreementId: string,
  token?: string
): Promise<{ agreement: Agreement | null; participants: AgreementParticipant[]; error: string | null }> {
  try {
    const result = await getAgreementByIdWithParticipants(agreementId, token)
    if (!result.success) {
      return { agreement: null, participants: [], error: result.error || "Agreement not found" }
    }

    const data = result.data || { agreement: null, participants: [] }
    return {
      agreement: data.agreement,
      participants: data.participants,
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch agreement"
    return { agreement: null, participants: [], error: message }
  }
}

/**
 * Get agreement by contract_id
 * @param contractId Contract ID
 * @param token JWT token for authentication (optional for public queries)
 */
export async function getAgreementByContractId(
  contractId: string,
  token?: string
): Promise<{ agreement: Agreement | null; error: string | null }> {
  try {
    const result = await getAgreementByContractIdApi(contractId, token)
    if (!result.success) {
      // Check if it's a "not found" error (which is not really an error)
      if (result.error?.includes("not found")) {
        return { agreement: null, error: null }
      }
      return { agreement: null, error: result.error || "Failed to fetch agreement" }
    }

    return { agreement: result.data || null, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch agreement"
    return { agreement: null, error: message }
  }
}

/**
 * Get activity log for an agreement
 * @param agreementId Agreement ID
 * @param token JWT token for authentication (optional for public queries)
 */
export async function getAgreementActivity(
  agreementId: string,
  token?: string
): Promise<{ activities: AgreementActivity[]; error: string | null }> {
  try {
    const result = await getAgreementActivityApi(agreementId, token)
    if (!result.success) {
      return { activities: [], error: result.error || "Failed to fetch activity" }
    }
    return { activities: result.data || [], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch activity"
    return { activities: [], error: message }
  }
}
