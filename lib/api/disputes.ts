import { apiRequest, type ApiResponse } from "./client"

export type DisputeStatus = "open" | "under_review" | "resolved" | "cancelled"

export interface Dispute {
  id: string
  agreement_id: string
  opened_by: string
  reason: string
  evidence_urls: string[]
  status: DisputeStatus
  resolver_wallet: string | null
  payer_percentage: number | null
  payee_percentage: number | null
  resolution_notes: string | null
  created_at: string
  resolved_at: string | null
}

interface DisputeAgreement {
  id: string
  title: string
  amount: string
  contract_id: string | null
}

export interface DisputeWithAgreement extends Dispute {
  agreement?: DisputeAgreement
}

export interface DisputeResolution {
  id: string
  dispute_id: string
  resolved_by: string
  payer_percentage: number
  payee_percentage: number
  resolution_notes: string
  created_at: string
}

/**
 * Open a new dispute
 * Backend returns: { dispute, error }
 */
export async function openDispute(
  data: { agreement_id: string; reason: string; opened_by: string },
  token: string
): Promise<ApiResponse<Dispute>> {
  try {
    const response = await apiRequest<unknown>(
      "/disputes",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const dispute = payload.dispute as Dispute
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: dispute }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to open dispute",
    }
  }
}

/**
 * Get all open disputes
 * Backend returns: { disputes, error }
 */
export async function getOpenDisputes(
  token: string
): Promise<ApiResponse<DisputeWithAgreement[]>> {
  try {
    const response = await apiRequest<unknown>(
      "/disputes/open",
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const disputes = (payload.disputes as DisputeWithAgreement[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: disputes }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch open disputes",
    }
  }
}

/**
 * Get disputes assigned to a resolver
 * Backend returns: { disputes, error }
 */
export async function getDisputesByResolver(
  walletAddress: string,
  token: string
): Promise<ApiResponse<DisputeWithAgreement[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/disputes/by-resolver?wallet=${walletAddress}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const disputes = (payload.disputes as DisputeWithAgreement[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: disputes }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch disputes by resolver",
    }
  }
}

/**
 * Get disputes for a specific agreement
 * Backend returns: { disputes, error }
 */
export async function getDisputesByAgreement(
  agreementId: string,
  token: string
): Promise<ApiResponse<DisputeWithAgreement[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/disputes/by-agreement/${agreementId}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const disputes = (payload.disputes as DisputeWithAgreement[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: disputes }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch disputes by agreement",
    }
  }
}

/**
 * Get dispute details
 * Backend returns: { dispute, error }
 */
export async function getDispute(
  disputeId: string,
  token: string
): Promise<ApiResponse<DisputeWithAgreement>> {
  try {
    const response = await apiRequest<unknown>(
      `/disputes/${disputeId}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const dispute = payload.dispute as DisputeWithAgreement
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: dispute }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch dispute",
    }
  }
}

/**
 * Assign resolver to dispute
 * Backend returns: { success, error }
 */
export async function assignResolver(
  disputeId: string,
  resolverWallet: string,
  token: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiRequest<unknown>(
      `/disputes/${disputeId}/assign-resolver`,
      {
        method: "PATCH",
        body: JSON.stringify({ resolver_wallet: resolverWallet }),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = payload.success as boolean
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: { success } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to assign resolver",
    }
  }
}

/**
 * Resolve dispute
 * Backend returns: { resolution, error }
 */
export async function resolveDispute(
  disputeId: string,
  data: {
    resolved_by: string
    payer_percentage: number
    payee_percentage: number
    resolution_notes?: string
  },
  token: string
): Promise<ApiResponse<DisputeResolution>> {
  try {
    const response = await apiRequest<unknown>(
      `/disputes/${disputeId}/resolve`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const resolution = payload.resolution as DisputeResolution
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: resolution }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to resolve dispute",
    }
  }
}

/**
 * Cancel a dispute
 * Backend returns: { success, error }
 */
export async function cancelDispute(
  disputeId: string,
  cancelledBy: string,
  token: string
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiRequest<unknown>(
      `/disputes/${disputeId}/cancel`,
      {
        method: "PATCH",
        body: JSON.stringify({ cancelled_by: cancelledBy }),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = payload.success as boolean
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: { success } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to cancel dispute",
    }
  }
}
