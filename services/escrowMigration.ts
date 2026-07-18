/**
 * MIGRATION WRAPPER
 * 
 * This file wraps trustlessworkService functions to gradually migrate them to the backend.
 * Each function tries the backend first, falls back to the original service if it fails.
 * 
 * HOW TO VALIDATE:
 * 1. Open browser DevTools (F12) → Console
 * 2. Look for logs starting with "[v0] MIGRATION:"
 * 3. "Using BACKEND" = migration working
 * 4. "FALLBACK to original" = backend failed, using original
 * 
 * FEATURE FLAGS:
 * Set to false to disable migration for specific endpoints
 */

import { API_URL } from "@/lib/config"
import * as originalService from "./trustlessworkService"
import * as escrowApi from "@/lib/api/escrow"

// Feature flags - set to false to disable migration for specific endpoints
const MIGRATION_FLAGS = {
  getEscrowsBySigner: true,
  getEscrowsByRole: true,
  // Future migrations (set to true when ready)
  createAgreement: false,
  fundEscrow: false,
  approveMilestone: false,
  changeMilestoneStatus: false,
  releaseFunds: false,
  disputeMilestone: false,
  sendTransaction: false,
}

// Helper to make backend calls with authentication
async function backendFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Backend error" }))
    throw new Error(error.message || `Backend returned ${response.status}`)
  }
  
  return response.json()
}

// ============================================================================
// MIGRATION #1: getEscrowsBySigner
// ============================================================================

export async function getEscrowsBySigner(
  signerAddress: string,
  token?: string
): Promise<{
  success: boolean
  data?: unknown[]
  error?: string
  source: "backend" | "original"
}> {
  // Backend-only: we never call Trustless Work directly from the browser (it would
  // expose the API key and bypass our auth). No token or flag disabled => error,
  // NOT a direct-TW fallback.
  if (!token || !MIGRATION_FLAGS.getEscrowsBySigner) {
    console.warn("[v0] MIGRATION: getEscrowsBySigner - no token or disabled; not calling backend")
    return { success: false, error: "No autenticado", source: "backend" }
  }

  console.log("[v0] MIGRATION: Attempting BACKEND for getEscrowsBySigner", { signerAddress })
  const result = await escrowApi.getEscrowsBySigner(signerAddress, token)

  if (result.success && result.data) {
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for getEscrowsBySigner", {
      count: result.data.length,
    })
    return { success: true, data: result.data, source: "backend" }
  }

  console.warn("[v0] MIGRATION: BACKEND error for getEscrowsBySigner (no TW fallback)", {
    error: result.error,
  })
  return { success: false, error: result.error || "Backend returned no data", source: "backend" }
}

// ============================================================================
// MIGRATION #2: getEscrowsByRole
// ============================================================================

interface GetEscrowsByRoleParams {
  address: string
  role: "sender" | "receiver" | "approver" | "service_provider"
  status?: string
  type?: "single-release" | "multi-release"
}

export async function getEscrowsByRole(
  params: GetEscrowsByRoleParams,
  token?: string
): Promise<{
  success: boolean
  data?: unknown[]
  error?: string
  source: "backend" | "original"
}> {
  // Backend-only: never call Trustless Work directly from the browser.
  if (!token || !MIGRATION_FLAGS.getEscrowsByRole) {
    console.warn("[v0] MIGRATION: getEscrowsByRole - no token or disabled; not calling backend")
    return { success: false, error: "No autenticado", source: "backend" }
  }

  console.log("[v0] MIGRATION: Attempting BACKEND for getEscrowsByRole", params)
  const result = await escrowApi.getEscrowsByRole(params, token)

  if (result.success && result.data) {
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for getEscrowsByRole", {
      count: result.data.length,
    })
    return { success: true, data: result.data, source: "backend" }
  }

  console.warn("[v0] MIGRATION: BACKEND error for getEscrowsByRole (no TW fallback)", {
    error: result.error,
  })
  return { success: false, error: result.error || "Backend returned no data", source: "backend" }
}

// ============================================================================
// RE-EXPORT ORIGINAL FUNCTIONS (not migrated yet)
// ============================================================================

// These will be migrated later - for now, just re-export the originals
export const createAgreement = originalService.createAgreement
export const fundEscrow = originalService.fundEscrow
export const approveMilestone = originalService.approveMilestone
export const changeMilestoneStatus = originalService.changeMilestoneStatus
export const releaseFunds = originalService.releaseFunds
export const disputeMilestone = originalService.disputeMilestone
export const sendTransaction = originalService.sendTransaction

// Re-export types and other utilities
export * from "./trustlessworkService"
