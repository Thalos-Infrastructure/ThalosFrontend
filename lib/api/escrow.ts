import { API_URL } from "@/lib/config"

export interface Milestone {
  description: string
  amount: string
  status: "pending" | "completed" | "approved"
}

export interface Escrow {
  id: string
  contract_id: string
  title: string
  description: string
  amount: string
  balance: string
  platform_fee: string
  payer: string
  payee: string
  approver?: string
  release_signer?: string
  dispute_resolver?: string
  milestones: Milestone[]
  status: "pending" | "funded" | "active" | "completed" | "disputed" | "cancelled"
  created_at: string
  funded_at?: string
  completed_at?: string
}

export interface CreateEscrowData {
  title: string
  description: string
  amount: string
  payee: string
  approver?: string
  milestones?: Array<{ description: string; amount: string }>
  release_signer?: string
  dispute_resolver?: string
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

// Initialize/deploy a new escrow contract
export async function initializeEscrow(
  data: CreateEscrowData,
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(
    "/escrow/initialize",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  )
}

// Get escrow by contract ID
export async function getEscrow(
  contractId: string,
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(`/escrow/${contractId}`, { method: "GET" }, token)
}

// Get all escrows for user (as payer, payee, or approver)
export async function getMyEscrows(token: string): Promise<ApiResponse<Escrow[]>> {
  return apiRequest<Escrow[]>("/escrow/my-escrows", { method: "GET" }, token)
}

// Fund escrow
export async function fundEscrow(
  contractId: string,
  token: string
): Promise<ApiResponse<{ transaction_hash: string }>> {
  return apiRequest<{ transaction_hash: string }>(
    `/escrow/${contractId}/fund`,
    { method: "POST" },
    token
  )
}

// Submit evidence for milestone
export async function submitEvidence(
  contractId: string,
  milestoneIndex: number,
  evidence: { description: string; files?: string[] },
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(
    `/escrow/${contractId}/milestones/${milestoneIndex}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(evidence),
    },
    token
  )
}

// Approve milestone and release funds
export async function approveMilestone(
  contractId: string,
  milestoneIndex: number,
  token: string
): Promise<ApiResponse<{ transaction_hash: string }>> {
  return apiRequest<{ transaction_hash: string }>(
    `/escrow/${contractId}/milestones/${milestoneIndex}/approve`,
    { method: "POST" },
    token
  )
}

// Cancel escrow (before funding)
export async function cancelEscrow(
  contractId: string,
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(
    `/escrow/${contractId}/cancel`,
    { method: "POST" },
    token
  )
}

// Get escrow balance from blockchain
export async function getEscrowBalance(
  contractId: string,
  token: string
): Promise<ApiResponse<{ xlm: string; usdc: string }>> {
  return apiRequest<{ xlm: string; usdc: string }>(
    `/escrow/${contractId}/balance`,
    { method: "GET" },
    token
  )
}
