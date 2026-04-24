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

// Helper to make backend calls
async function backendFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

export async function getEscrowsBySigner(signerAddress: string): Promise<{
  success: boolean
  data?: unknown[]
  error?: string
  source: "backend" | "original"
}> {
  if (!MIGRATION_FLAGS.getEscrowsBySigner) {
    console.log("[v0] MIGRATION: getEscrowsBySigner DISABLED, using original")
    const result = await originalService.getEscrowsBySigner(signerAddress)
    return { ...result, source: "original" }
  }

  try {
    console.log("[v0] MIGRATION: Attempting BACKEND for getEscrowsBySigner", { signerAddress })
    
    const data = await backendFetch(`/escrow/by-signer/${signerAddress}`)
    
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for getEscrowsBySigner", { 
      count: Array.isArray(data) ? data.length : "N/A" 
    })
    
    return { success: true, data, source: "backend" }
  } catch (error) {
    console.warn("[v0] MIGRATION: FALLBACK to original for getEscrowsBySigner", { 
      error: error instanceof Error ? error.message : "Unknown error" 
    })
    
    const result = await originalService.getEscrowsBySigner(signerAddress)
    return { ...result, source: "original" }
  }
}

// ============================================================================
// MIGRATION #2: getEscrowsByRole
// ============================================================================

interface GetEscrowsByRoleParams {
  address: string
  role: "sender" | "receiver" | "approver" | "service_provider"
  status?: string
}

export async function getEscrowsByRole(params: GetEscrowsByRoleParams): Promise<{
  success: boolean
  data?: unknown[]
  error?: string
  source: "backend" | "original"
}> {
  if (!MIGRATION_FLAGS.getEscrowsByRole) {
    console.log("[v0] MIGRATION: getEscrowsByRole DISABLED, using original")
    const result = await originalService.getEscrowsByRole(params)
    return { ...result, source: "original" }
  }

  try {
    console.log("[v0] MIGRATION: Attempting BACKEND for getEscrowsByRole", params)
    
    const queryParams = new URLSearchParams({
      address: params.address,
      role: params.role,
      ...(params.status && { status: params.status }),
    })
    
    const data = await backendFetch(`/escrow/by-role?${queryParams}`)
    
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for getEscrowsByRole", { 
      count: Array.isArray(data) ? data.length : "N/A" 
    })
    
    return { success: true, data, source: "backend" }
  } catch (error) {
    console.warn("[v0] MIGRATION: FALLBACK to original for getEscrowsByRole", { 
      error: error instanceof Error ? error.message : "Unknown error" 
    })
    
    const result = await originalService.getEscrowsByRole(params)
    return { ...result, source: "original" }
  }
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
