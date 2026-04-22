import { API_URL } from "@/lib/config"

export interface Dispute {
  id: string
  agreement_id: string
  opened_by: string
  reason: string
  status: "open" | "assigned" | "resolved"
  resolver_wallet: string | null
  payer_percentage: number | null
  payee_percentage: number | null
  resolution_notes: string | null
  created_at: string
  resolved_at: string | null
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Request failed" }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error" 
    }
  }
}

// Open a new dispute
export async function openDispute(
  data: { agreement_id: string; reason: string },
  token: string
): Promise<ApiResponse<Dispute>> {
  return apiRequest<Dispute>(
    "/disputes",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  )
}

// Get all open disputes
export async function getOpenDisputes(token: string): Promise<ApiResponse<Dispute[]>> {
  return apiRequest<Dispute[]>("/disputes/open", { method: "GET" }, token)
}

// Get disputes I need to resolve (as resolver)
export async function getDisputesByResolver(
  walletAddress: string,
  token: string
): Promise<ApiResponse<Dispute[]>> {
  return apiRequest<Dispute[]>(
    `/disputes/by-resolver?wallet=${walletAddress}`,
    { method: "GET" },
    token
  )
}

// Get disputes for a specific agreement
export async function getDisputesByAgreement(
  agreementId: string,
  token: string
): Promise<ApiResponse<Dispute[]>> {
  return apiRequest<Dispute[]>(
    `/disputes/by-agreement/${agreementId}`,
    { method: "GET" },
    token
  )
}

// Get dispute details
export async function getDispute(
  disputeId: string,
  token: string
): Promise<ApiResponse<Dispute>> {
  return apiRequest<Dispute>(`/disputes/${disputeId}`, { method: "GET" }, token)
}

// Assign resolver to dispute
export async function assignResolver(
  disputeId: string,
  resolverWallet: string,
  token: string
): Promise<ApiResponse<Dispute>> {
  return apiRequest<Dispute>(
    `/disputes/${disputeId}/assign-resolver`,
    {
      method: "PATCH",
      body: JSON.stringify({ resolver_wallet: resolverWallet }),
    },
    token
  )
}

// Resolve dispute
export async function resolveDispute(
  disputeId: string,
  data: {
    payer_percentage: number
    payee_percentage: number
    resolution_notes?: string
  },
  token: string
): Promise<ApiResponse<Dispute>> {
  return apiRequest<Dispute>(
    `/disputes/${disputeId}/resolve`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token
  )
}
