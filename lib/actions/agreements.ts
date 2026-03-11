"use server"

import { createClient } from "@/lib/supabase/server"

export type AgreementStatus = "pending" | "funded" | "active" | "completed" | "disputed" | "resolved" | "cancelled"
export type AgreementType = "single" | "multi" | "bounty"
export type ParticipantRole = "payer" | "payee" | "approver" | "dispute_resolver" | "validator"

export interface AgreementMilestone {
  description: string
  amount: string
  status: "pending" | "approved" | "released"
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

/**
 * Create a new agreement in the database
 */
export async function createAgreementInDb(
  input: CreateAgreementInput
): Promise<{ agreement: Agreement | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Insert agreement
    const { data: agreement, error: agreementError } = await supabase
      .from("agreements")
      .insert({
        contract_id: input.contract_id || null,
        title: input.title,
        description: input.description || null,
        amount: input.amount,
        asset: input.asset || "USDC",
        status: "pending",
        agreement_type: input.agreement_type || "single",
        milestones: input.milestones || [],
        metadata: input.metadata || {},
        created_by: input.created_by,
      })
      .select()
      .single()

    if (agreementError) {
      console.error("Error creating agreement:", agreementError)
      return { agreement: null, error: agreementError.message }
    }

    // Insert participants
    const participants = input.participants.map((p) => ({
      agreement_id: agreement.id,
      wallet_address: p.wallet_address,
      role: p.role,
    }))

    const { error: participantsError } = await supabase
      .from("agreement_participants")
      .insert(participants)

    if (participantsError) {
      console.error("Error adding participants:", participantsError)
    }

    // Log activity
    await logAgreementActivity(agreement.id, input.created_by, "created", {
      title: input.title,
      amount: input.amount,
    })

    return { agreement: agreement as Agreement, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create agreement"
    return { agreement: null, error: message }
  }
}

/**
 * Update agreement with contract_id after Trustless Work deployment
 */
export async function linkContractToAgreement(
  agreementId: string,
  contractId: string,
  actorWallet: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("agreements")
      .update({
        contract_id: contractId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agreementId)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAgreementActivity(agreementId, actorWallet, "contract_linked", { contract_id: contractId })

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to link contract"
    return { success: false, error: message }
  }
}

/**
 * Update agreement status
 */
export async function updateAgreementStatus(
  agreementId: string,
  status: AgreementStatus,
  actorWallet: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "funded") {
      updates.funded_at = new Date().toISOString()
    } else if (status === "completed" || status === "resolved") {
      updates.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("agreements")
      .update(updates)
      .eq("id", agreementId)

    if (error) {
      return { success: false, error: error.message }
    }

    await logAgreementActivity(agreementId, actorWallet, `status_changed_to_${status}`, { status })

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update status"
    return { success: false, error: message }
  }
}

/**
 * Update milestone status
 */
export async function updateMilestoneStatus(
  agreementId: string,
  milestoneIndex: number,
  status: AgreementMilestone["status"],
  actorWallet: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get current agreement
    const { data: agreement, error: fetchError } = await supabase
      .from("agreements")
      .select("milestones")
      .eq("id", agreementId)
      .single()

    if (fetchError || !agreement) {
      return { success: false, error: fetchError?.message || "Agreement not found" }
    }

    const milestones = agreement.milestones as AgreementMilestone[]
    if (milestoneIndex < 0 || milestoneIndex >= milestones.length) {
      return { success: false, error: "Invalid milestone index" }
    }

    milestones[milestoneIndex].status = status

    const { error: updateError } = await supabase
      .from("agreements")
      .update({
        milestones,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agreementId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    await logAgreementActivity(agreementId, actorWallet, `milestone_${status}`, {
      milestone_index: milestoneIndex,
      milestone_description: milestones[milestoneIndex].description,
    })

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update milestone"
    return { success: false, error: message }
  }
}

/**
 * Get agreements by wallet (as participant)
 */
export async function getAgreementsByWallet(
  walletAddress: string
): Promise<{ agreements: Agreement[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get agreement IDs where user is a participant
    const { data: participations, error: partError } = await supabase
      .from("agreement_participants")
      .select("agreement_id")
      .eq("wallet_address", walletAddress)

    if (partError) {
      return { agreements: [], error: partError.message }
    }

    if (!participations || participations.length === 0) {
      return { agreements: [], error: null }
    }

    const agreementIds = participations.map((p) => p.agreement_id)

    const { data: agreements, error: agError } = await supabase
      .from("agreements")
      .select("*")
      .in("id", agreementIds)
      .order("created_at", { ascending: false })

    if (agError) {
      return { agreements: [], error: agError.message }
    }

    return { agreements: agreements as Agreement[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch agreements"
    return { agreements: [], error: message }
  }
}

/**
 * Get agreement by ID with participants
 */
export async function getAgreementById(
  agreementId: string
): Promise<{ agreement: Agreement | null; participants: AgreementParticipant[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: agreement, error: agError } = await supabase
      .from("agreements")
      .select("*")
      .eq("id", agreementId)
      .single()

    if (agError) {
      return { agreement: null, participants: [], error: agError.message }
    }

    const { data: participants, error: partError } = await supabase
      .from("agreement_participants")
      .select("*")
      .eq("agreement_id", agreementId)

    if (partError) {
      return { agreement: agreement as Agreement, participants: [], error: partError.message }
    }

    return {
      agreement: agreement as Agreement,
      participants: participants as AgreementParticipant[],
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch agreement"
    return { agreement: null, participants: [], error: message }
  }
}

/**
 * Get agreement by contract_id
 */
export async function getAgreementByContractId(
  contractId: string
): Promise<{ agreement: Agreement | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .eq("contract_id", contractId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return { agreement: null, error: null }
      }
      return { agreement: null, error: error.message }
    }

    return { agreement: data as Agreement, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch agreement"
    return { agreement: null, error: message }
  }
}

/**
 * Log activity on an agreement
 */
export async function logAgreementActivity(
  agreementId: string,
  actorWallet: string,
  action: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.from("agreement_activity").insert({
      agreement_id: agreementId,
      actor_wallet: actorWallet,
      action,
      details,
    })
  } catch (e) {
    console.error("Failed to log activity:", e)
  }
}

/**
 * Get activity log for an agreement
 */
export async function getAgreementActivity(
  agreementId: string
): Promise<{ activities: AgreementActivity[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("agreement_activity")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("created_at", { ascending: false })

    if (error) {
      return { activities: [], error: error.message }
    }

    return { activities: data as AgreementActivity[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch activity"
    return { activities: [], error: message }
  }
}
