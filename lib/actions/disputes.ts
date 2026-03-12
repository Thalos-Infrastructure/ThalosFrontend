"use server"

import { createClient } from "@/lib/supabase/server"
import { updateAgreementStatus, logAgreementActivity } from "./agreements"

export type DisputeStatus = "open" | "under_review" | "resolved" | "cancelled"

export interface Dispute {
  id: string
  agreement_id: string
  opened_by: string
  reason: string
  evidence_urls: string[]
  status: DisputeStatus
  resolver_wallet: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
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

export interface DisputeWithAgreement extends Dispute {
  agreement: {
    id: string
    title: string
    amount: string
    contract_id: string | null
  }
}

export interface OpenDisputeInput {
  agreement_id: string
  opened_by: string
  reason: string
  evidence_urls?: string[]
}

export interface ResolveDisputeInput {
  dispute_id: string
  resolved_by: string
  payer_percentage: number
  payee_percentage: number
  resolution_notes?: string
}

/**
 * Open a new dispute on an agreement
 */
export async function openDispute(
  input: OpenDisputeInput
): Promise<{ dispute: Dispute | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Check if there's already an open dispute
    const { data: existingDispute } = await supabase
      .from("disputes")
      .select("id")
      .eq("agreement_id", input.agreement_id)
      .in("status", ["open", "under_review"])
      .single()

    if (existingDispute) {
      return { dispute: null, error: "There is already an open dispute for this agreement" }
    }

    const { data: dispute, error } = await supabase
      .from("disputes")
      .insert({
        agreement_id: input.agreement_id,
        opened_by: input.opened_by,
        reason: input.reason,
        evidence_urls: input.evidence_urls || [],
        status: "open",
      })
      .select()
      .single()

    if (error) {
      console.error("Error opening dispute:", error)
      return { dispute: null, error: error.message }
    }

    // Update agreement status to disputed
    await updateAgreementStatus(input.agreement_id, "disputed", input.opened_by)

    // Log activity
    await logAgreementActivity(input.agreement_id, input.opened_by, "dispute_opened", {
      dispute_id: dispute.id,
      reason: input.reason,
    })

    return { dispute: dispute as Dispute, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to open dispute"
    return { dispute: null, error: message }
  }
}

/**
 * Assign a resolver to a dispute
 */
export async function assignDisputeResolver(
  disputeId: string,
  resolverWallet: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: dispute, error: fetchError } = await supabase
      .from("disputes")
      .select("agreement_id, status")
      .eq("id", disputeId)
      .single()

    if (fetchError || !dispute) {
      return { success: false, error: fetchError?.message || "Dispute not found" }
    }

    if (dispute.status !== "open") {
      return { success: false, error: "Can only assign resolver to open disputes" }
    }

    const { error } = await supabase
      .from("disputes")
      .update({
        resolver_wallet: resolverWallet,
        status: "under_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", disputeId)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAgreementActivity(dispute.agreement_id, resolverWallet, "dispute_resolver_assigned", {
      dispute_id: disputeId,
      resolver_wallet: resolverWallet,
    })

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to assign resolver"
    return { success: false, error: message }
  }
}

/**
 * Resolve a dispute with fund distribution percentages
 */
export async function resolveDispute(
  input: ResolveDisputeInput
): Promise<{ resolution: DisputeResolution | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Validate percentages
    if (input.payer_percentage < 0 || input.payee_percentage < 0) {
      return { resolution: null, error: "Percentages cannot be negative" }
    }
    
    if (input.payer_percentage + input.payee_percentage !== 100) {
      return { resolution: null, error: "Percentages must sum to 100%" }
    }

    // Get dispute
    const { data: dispute, error: fetchError } = await supabase
      .from("disputes")
      .select("id, agreement_id, status, resolver_wallet")
      .eq("id", input.dispute_id)
      .single()

    if (fetchError || !dispute) {
      return { resolution: null, error: fetchError?.message || "Dispute not found" }
    }

    if (dispute.status === "resolved") {
      return { resolution: null, error: "Dispute is already resolved" }
    }

    // Create resolution
    const { data: resolution, error: resError } = await supabase
      .from("dispute_resolutions")
      .insert({
        dispute_id: input.dispute_id,
        resolved_by: input.resolved_by,
        payer_percentage: input.payer_percentage,
        payee_percentage: input.payee_percentage,
        resolution_notes: input.resolution_notes || "",
      })
      .select()
      .single()

    if (resError) {
      console.error("Error creating resolution:", resError)
      return { resolution: null, error: resError.message }
    }

    // Update dispute status
    const { error: updateError } = await supabase
      .from("disputes")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.dispute_id)

    if (updateError) {
      console.error("Error updating dispute:", updateError)
    }

    // Update agreement status to resolved
    await updateAgreementStatus(dispute.agreement_id, "resolved", input.resolved_by)

    // Log activity
    await logAgreementActivity(dispute.agreement_id, input.resolved_by, "dispute_resolved", {
      dispute_id: input.dispute_id,
      payer_percentage: input.payer_percentage,
      payee_percentage: input.payee_percentage,
      resolution_notes: input.resolution_notes,
    })

    return { resolution: resolution as DisputeResolution, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to resolve dispute"
    return { resolution: null, error: message }
  }
}

/**
 * Cancel a dispute (by the opener)
 */
export async function cancelDispute(
  disputeId: string,
  cancelledBy: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: dispute, error: fetchError } = await supabase
      .from("disputes")
      .select("agreement_id, opened_by, status")
      .eq("id", disputeId)
      .single()

    if (fetchError || !dispute) {
      return { success: false, error: fetchError?.message || "Dispute not found" }
    }

    if (dispute.opened_by !== cancelledBy) {
      return { success: false, error: "Only the dispute opener can cancel it" }
    }

    if (dispute.status === "resolved") {
      return { success: false, error: "Cannot cancel a resolved dispute" }
    }

    const { error } = await supabase
      .from("disputes")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", disputeId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revert agreement status to active
    await updateAgreementStatus(dispute.agreement_id, "active", cancelledBy)

    await logAgreementActivity(dispute.agreement_id, cancelledBy, "dispute_cancelled", {
      dispute_id: disputeId,
    })

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to cancel dispute"
    return { success: false, error: message }
  }
}

/**
 * Get all open disputes (for dispute resolvers)
 */
export async function getOpenDisputes(): Promise<{ disputes: DisputeWithAgreement[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("disputes")
      .select(`
        *,
        agreement:agreements (
          id,
          title,
          amount,
          contract_id
        )
      `)
      .in("status", ["open", "under_review"])
      .order("created_at", { ascending: false })

    if (error) {
      return { disputes: [], error: error.message }
    }

    return { disputes: data as DisputeWithAgreement[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch disputes"
    return { disputes: [], error: message }
  }
}

/**
 * Get disputes assigned to a specific resolver
 */
export async function getDisputesByResolver(
  resolverWallet: string
): Promise<{ disputes: DisputeWithAgreement[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("disputes")
      .select(`
        *,
        agreement:agreements (
          id,
          title,
          amount,
          contract_id
        )
      `)
      .eq("resolver_wallet", resolverWallet)
      .order("created_at", { ascending: false })

    if (error) {
      return { disputes: [], error: error.message }
    }

    return { disputes: data as DisputeWithAgreement[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch disputes"
    return { disputes: [], error: message }
  }
}

/**
 * Get dispute by ID with full details
 */
export async function getDisputeById(
  disputeId: string
): Promise<{ dispute: DisputeWithAgreement | null; resolution: DisputeResolution | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select(`
        *,
        agreement:agreements (
          id,
          title,
          amount,
          contract_id
        )
      `)
      .eq("id", disputeId)
      .single()

    if (disputeError) {
      return { dispute: null, resolution: null, error: disputeError.message }
    }

    // Get resolution if exists
    const { data: resolution } = await supabase
      .from("dispute_resolutions")
      .select("*")
      .eq("dispute_id", disputeId)
      .single()

    return {
      dispute: dispute as DisputeWithAgreement,
      resolution: resolution as DisputeResolution | null,
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch dispute"
    return { dispute: null, resolution: null, error: message }
  }
}

/**
 * Get disputes for an agreement
 */
export async function getDisputesByAgreement(
  agreementId: string
): Promise<{ disputes: Dispute[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("created_at", { ascending: false })

    if (error) {
      return { disputes: [], error: error.message }
    }

    return { disputes: data as Dispute[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch disputes"
    return { disputes: [], error: message }
  }
}
