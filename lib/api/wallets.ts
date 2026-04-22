import { API_URL } from "@/lib/config"

export interface LinkedWallet {
  id: string
  wallet_address: string
  wallet_type: "custodial" | "freighter" | "lobstr" | "xbull" | "albedo" | "other"
  label: string | null
  is_primary: boolean
  linked_at: string
}

export interface WalletWithBalance extends LinkedWallet {
  balance: {
    xlm: string
    usdc: string
  }
  agreements_count: number
}

export interface WalletWithAgreements extends LinkedWallet {
  agreements_count: number
  agreements: Array<{
    id: string
    title: string
    status: string
    amount: string
    role: "buyer" | "seller" | "approver"
  }>
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

// Get all linked wallets for the user
export async function getLinkedWallets(token: string): Promise<ApiResponse<LinkedWallet[]>> {
  return apiRequest<LinkedWallet[]>("/wallets", { method: "GET" }, token)
}

// Get wallets with XLM and USDC balances
export async function getWalletsWithBalances(token: string): Promise<ApiResponse<WalletWithBalance[]>> {
  return apiRequest<WalletWithBalance[]>("/wallets/with-balances", { method: "GET" }, token)
}

// Get agreements grouped by wallet
export async function getWalletsWithAgreements(token: string): Promise<ApiResponse<WalletWithAgreements[]>> {
  return apiRequest<WalletWithAgreements[]>("/wallets/agreements", { method: "GET" }, token)
}

// Get primary wallet
export async function getPrimaryWallet(token: string): Promise<ApiResponse<LinkedWallet>> {
  return apiRequest<LinkedWallet>("/wallets/primary", { method: "GET" }, token)
}

// Get balance for a specific wallet
export async function getWalletBalance(
  walletAddress: string,
  token: string
): Promise<ApiResponse<{ xlm: string; usdc: string }>> {
  return apiRequest<{ xlm: string; usdc: string }>(
    `/wallets/${walletAddress}/balance`,
    { method: "GET" },
    token
  )
}

// Link a new wallet
export async function linkWallet(
  data: {
    wallet_address: string
    wallet_type: LinkedWallet["wallet_type"]
    label?: string
  },
  token: string
): Promise<ApiResponse<LinkedWallet>> {
  return apiRequest<LinkedWallet>(
    "/wallets",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  )
}

// Update wallet (label or is_primary)
export async function updateWallet(
  walletId: string,
  data: { label?: string; is_primary?: boolean },
  token: string
): Promise<ApiResponse<LinkedWallet>> {
  return apiRequest<LinkedWallet>(
    `/wallets/${walletId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
    token
  )
}

// Unlink/remove a wallet
export async function unlinkWallet(
  walletId: string,
  token: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest<{ success: boolean }>(
    `/wallets/${walletId}`,
    { method: "DELETE" },
    token
  )
}
