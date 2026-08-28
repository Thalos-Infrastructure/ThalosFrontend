import { apiRequest, type ApiResponse } from "./client"
import type { AgreementStatus, MilestoneStatus } from "@/lib/types/status"

export type { AgreementStatus, MilestoneStatus }
export type AgreementType = "single" | "multi" | "bounty"
export type ParticipantRole = "payer" | "payee" | "approver" | "dispute_resolver" | "validator"

export interface AgreementMilestone {
  description: string
  amount: string
  status: MilestoneStatus
}

export interface Agreement {
  id: string
  contract_id: string | null
  title: string
  description: string | null
  amount: string
  asset: string
  status: AgreementStatus
  agreement_type: AgreementType
  milestones: AgreementMilestone[]
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
  funded_at: string | null
  completed_at: string | null
}

export interface AgreementParticipant {
  id: string
  agreement_id: string
  wallet_address: string
  role: ParticipantRole
  joined_at: string
}

export interface AgreementActivity {
  id: string
  agreement_id: string
  actor_wallet: string
  action: string
  details: Record<string, unknown>
  created_at: string
}

export interface CreateAgreementInput {
  contract_id?: string
  title: string
  description?: string
  amount: string
  asset?: string
  agreement_type?: AgreementType
  milestones?: AgreementMilestone[]
  metadata?: Record<string, unknown>
  created_by: string
  participants: { wallet_address: string; role: ParticipantRole }[]
}

export interface MutationResponse {
  success: boolean
  error?: string
}


/**
 * Create a new agreement
 * Backend returns: { agreement, error }
 */
export async function createAgreement(
  input: CreateAgreementInput,
  token: string
): Promise<ApiResponse<Agreement>> {
  try {
    const response = await apiRequest<unknown>(
      "/agreements",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreement }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create agreement",
    }
  }
}

/** Agreement as returned by the by-wallet listing, with participants when the backend embeds them. */
export interface AgreementWithParticipants extends Agreement {
  participants?: AgreementParticipant[]
}

/**
 * Get agreements a wallet participates in, optionally filtered by status/type.
 * Backend returns: { agreements, error }
 */
export async function getAgreementsByWallet(
  walletAddress: string,
  token?: string,
  params?: { status?: string; type?: string }
): Promise<ApiResponse<AgreementWithParticipants[]>> {
  try {
    const queryParams = new URLSearchParams({ wallet: walletAddress })
    if (params?.status) queryParams.set("status", params.status)
    if (params?.type) queryParams.set("type", params.type)

    const response = await apiRequest<unknown>(
      `/agreements/by-wallet?${queryParams.toString()}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreements = (payload.agreements as AgreementWithParticipants[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreements }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreements",
    }
  }
}

/**
 * Get agreement by ID
 * Backend returns: { agreement, error }
 */
export async function getAgreement(
  agreementId: string,
  token?: string
): Promise<ApiResponse<Agreement>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreement }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreement",
    }
  }
}

/**
 * Update agreement status
 * Backend returns: { success, error } (HTTP 200 even if success=false)
 */
export async function updateAgreementStatusApi(
  agreementId: string,
  status: AgreementStatus,
  actorWallet: string,
  token: string
): Promise<ApiResponse<{ success: boolean; error?: string }>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, actor_wallet: actorWallet }),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = (payload.success as boolean) ?? true
    const error = payload.error as string | undefined

    if (!success) {
      return { success: false, error: error || "Failed to update status" }
    }

    return { success: true, data: { success, error } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update status",
    }
  }
}

/**
 * Update agreement milestone status
 * Backend returns: { success, error } (HTTP 200 even if success=false)
 * @param agreementId Agreement ID
 * @param milestoneIndex Index of milestone to update
 * @param status New status
 * @param actorWallet Wallet of the actor making the change
 * @param evidenceDescription Optional evidence description for the milestone
 * @param token JWT token
 */
export async function updateMilestoneStatus(
  agreementId: string,
  milestoneIndex: number,
  status: AgreementMilestone["status"],
  actorWallet: string,
  evidenceDescription?: string,
  token?: string
): Promise<ApiResponse<{ success: boolean; error?: string }>> {
  try {
    const body: Record<string, unknown> = {
      milestone_index: milestoneIndex,
      status,
      actor_wallet: actorWallet,
    }
    
    if (evidenceDescription) {
      body.evidence_description = evidenceDescription
    }

    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/milestones`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = (payload.success as boolean) ?? true
    const error = payload.error as string | undefined

    if (!success) {
      return { success: false, error: error || "Failed to update milestone" }
    }

    return { success: true, data: { success, error } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update milestone",
    }
  }
}

/**
 * Get activity log for an agreement
 * Backend returns: { activities, error }
 */
export async function getAgreementActivityApi(
  agreementId: string,
  token?: string
): Promise<ApiResponse<AgreementActivity[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/activity`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const activities = (payload.activities as AgreementActivity[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: activities }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch activity",
    }
  }
}

/**
 * Get agreement by contract ID
 * Backend returns: { agreement, error }
 */
export async function getAgreementByContractIdApi(
  contractId: string,
  token?: string
): Promise<ApiResponse<Agreement>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/by-contract/${contractId}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreement }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreement",
    }
  }
}

/**
 * Link contract to agreement
 * Backend returns: { success, error } (HTTP 200 even if success=false)
 */
export async function linkContractToAgreementApi(
  agreementId: string,
  contractId: string,
  actorWallet: string,
  token: string
): Promise<ApiResponse<{ success: boolean; error?: string }>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/link-contract`,
      {
        method: "PATCH",
        body: JSON.stringify({ contract_id: contractId, actor_wallet: actorWallet }),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = (payload.success as boolean) ?? true
    const error = payload.error as string | undefined

    if (!success) {
      return { success: false, error: error || "Failed to link contract" }
    }

    return { success: true, data: { success, error } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to link contract",
    }
  }
}/**
 * Get agreement by ID with participants
 * Backend returns: { agreement, participants, error }
 */
export async function getAgreementByIdWithParticipants(
  agreementId: string,
  token?: string
): Promise<ApiResponse<{ agreement: Agreement; participants: AgreementParticipant[] }>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}`,
      { method: "GET" }, token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const participants = (payload.participants as AgreementParticipant[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: { agreement, participants } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreement",
    }
  }
}

// ── Agreement Chat (messages via Nest + JWT) ──────────────────────────

export interface AgreementMessage {
  id: string
  agreement_id: string
  sender_wallet: string
  message: string
  created_at: string
  read_at: string | null
}

/**
 * Fetch messages for an agreement via Nest JWT endpoint.
 * GET /v1/agreements/:agreementId/messages
 */
export async function getAgreementMessagesApi(
  agreementId: string,
  token?: string
): Promise<ApiResponse<AgreementMessage[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/messages`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const messages = (payload.messages as AgreementMessage[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: messages }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch messages",
    }
  }
}

/**
 * Send a message in an agreement chat via Nest JWT endpoint.
 * POST /v1/agreements/:agreementId/messages
 */
export async function sendAgreementMessageApi(
  agreementId: string,
  message: string,
  senderWallet: string,
  token?: string
): Promise<ApiResponse<AgreementMessage>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ message: message.trim(), sender_wallet: senderWallet }),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const msg = payload.message as AgreementMessage | undefined
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    if (!msg) {
      return { success: false, error: "No message returned" }
    }

    return { success: true, data: msg }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to send message",
    }
  }
}
