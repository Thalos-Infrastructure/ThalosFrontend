"use server"

import { createClient } from "@/lib/supabase/server"
import { createAgreementInDb, linkContractToAgreement } from "./agreements"

export type BountyStatus = "draft" | "open" | "funded" | "in_progress" | "validating" | "completed" | "cancelled"
export type SubmissionStatus = "pending" | "approved" | "rejected"

export interface Bounty {
  id: string
  agreement_id: string | null
  title: string
  description: string
  amount: string
  asset: string
  slug: string
  created_by: string
  status: BountyStatus
  required_validations: number
  deadline: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface BountyValidator {
  id: string
  bounty_id: string
  wallet_address: string
  added_at: string
}

export interface BountySubmission {
  id: string
  bounty_id: string
  submitter_wallet: string
  submission_url: string
  notes: string
  status: SubmissionStatus
  validations: { wallet: string; approved: boolean; timestamp: string }[]
  submitted_at: string
  resolved_at: string | null
}

export interface BountyWithDetails extends Bounty {
  validators: BountyValidator[]
  submissions: BountySubmission[]
}

export interface CreateBountyInput {
  title: string
  description: string
  amount: string
  asset?: string
  created_by: string
  validators: string[]
  required_validations?: number
  deadline?: string
  metadata?: Record<string, unknown>
}

/**
 * Generate a URL-friendly slug from title
 */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 30)
  
  // Add random hash
  const hash = Math.random().toString(36).substring(2, 6)
  return `${base}-${hash}`
}

/**
 * Create a new bounty
 */
export async function createBounty(
  input: CreateBountyInput
): Promise<{ bounty: Bounty | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const slug = generateSlug(input.title)
    const requiredValidations = input.required_validations || Math.ceil(input.validators.length / 2)

    // Create agreement in DB first
    const { agreement, error: agreementError } = await createAgreementInDb({
      title: input.title,
      description: input.description,
      amount: input.amount,
      asset: input.asset,
      agreement_type: "bounty",
      created_by: input.created_by,
      participants: [
        { wallet_address: input.created_by, role: "payer" },
        ...input.validators.map((v) => ({ wallet_address: v, role: "validator" as const })),
      ],
      metadata: { is_bounty: true, slug },
    })

    if (agreementError || !agreement) {
      return { bounty: null, error: agreementError || "Failed to create agreement" }
    }

    // Create bounty
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .insert({
        agreement_id: agreement.id,
        title: input.title,
        description: input.description,
        amount: input.amount,
        asset: input.asset || "USDC",
        slug,
        created_by: input.created_by,
        status: "draft",
        required_validations: requiredValidations,
        deadline: input.deadline || null,
        metadata: input.metadata || {},
      })
      .select()
      .single()

    if (bountyError) {
      console.error("Error creating bounty:", bountyError)
      return { bounty: null, error: bountyError.message }
    }

    // Add validators
    const validators = input.validators.map((wallet) => ({
      bounty_id: bounty.id,
      wallet_address: wallet,
    }))

    const { error: validatorsError } = await supabase
      .from("bounty_validators")
      .insert(validators)

    if (validatorsError) {
      console.error("Error adding validators:", validatorsError)
    }

    return { bounty: bounty as Bounty, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create bounty"
    return { bounty: null, error: message }
  }
}

/**
 * Get bounty by slug (for shareable links)
 */
export async function getBountyBySlug(
  slug: string
): Promise<{ bounty: BountyWithDetails | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .select("*")
      .eq("slug", slug)
      .single()

    if (bountyError) {
      if (bountyError.code === "PGRST116") {
        return { bounty: null, error: "Bounty not found" }
      }
      return { bounty: null, error: bountyError.message }
    }

    // Get validators
    const { data: validators } = await supabase
      .from("bounty_validators")
      .select("*")
      .eq("bounty_id", bounty.id)

    // Get submissions
    const { data: submissions } = await supabase
      .from("bounty_submissions")
      .select("*")
      .eq("bounty_id", bounty.id)
      .order("submitted_at", { ascending: false })

    return {
      bounty: {
        ...bounty,
        validators: validators || [],
        submissions: submissions || [],
      } as BountyWithDetails,
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch bounty"
    return { bounty: null, error: message }
  }
}

/**
 * Get bounty by ID
 */
export async function getBountyById(
  bountyId: string
): Promise<{ bounty: BountyWithDetails | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .select("*")
      .eq("id", bountyId)
      .single()

    if (bountyError) {
      return { bounty: null, error: bountyError.message }
    }

    const { data: validators } = await supabase
      .from("bounty_validators")
      .select("*")
      .eq("bounty_id", bounty.id)

    const { data: submissions } = await supabase
      .from("bounty_submissions")
      .select("*")
      .eq("bounty_id", bounty.id)
      .order("submitted_at", { ascending: false })

    return {
      bounty: {
        ...bounty,
        validators: validators || [],
        submissions: submissions || [],
      } as BountyWithDetails,
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch bounty"
    return { bounty: null, error: message }
  }
}

/**
 * Update bounty status
 */
export async function updateBountyStatus(
  bountyId: string,
  status: BountyStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("bounties")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", bountyId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update status"
    return { success: false, error: message }
  }
}

/**
 * Link contract to bounty after Trustless Work deployment
 */
export async function linkContractToBounty(
  bountyId: string,
  contractId: string,
  actorWallet: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get bounty's agreement_id
    const { data: bounty, error: fetchError } = await supabase
      .from("bounties")
      .select("agreement_id")
      .eq("id", bountyId)
      .single()

    if (fetchError || !bounty?.agreement_id) {
      return { success: false, error: "Bounty not found" }
    }

    // Link contract to agreement
    const result = await linkContractToAgreement(bounty.agreement_id, contractId, actorWallet)
    if (result.error) {
      return { success: false, error: result.error }
    }

    // Update bounty status
    await updateBountyStatus(bountyId, "funded")

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to link contract"
    return { success: false, error: message }
  }
}

/**
 * Submit work to a bounty
 */
export async function submitToBounty(
  bountyId: string,
  submitterWallet: string,
  submissionUrl: string,
  notes?: string
): Promise<{ submission: BountySubmission | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Check bounty status
    const { data: bounty, error: bountyError } = await supabase
      .from("bounties")
      .select("status")
      .eq("id", bountyId)
      .single()

    if (bountyError || !bounty) {
      return { submission: null, error: "Bounty not found" }
    }

    if (bounty.status !== "open" && bounty.status !== "funded" && bounty.status !== "in_progress") {
      return { submission: null, error: "Bounty is not accepting submissions" }
    }

    const { data: submission, error } = await supabase
      .from("bounty_submissions")
      .insert({
        bounty_id: bountyId,
        submitter_wallet: submitterWallet,
        submission_url: submissionUrl,
        notes: notes || "",
        status: "pending",
        validations: [],
      })
      .select()
      .single()

    if (error) {
      return { submission: null, error: error.message }
    }

    // Update bounty status if first submission
    await updateBountyStatus(bountyId, "in_progress")

    return { submission: submission as BountySubmission, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit"
    return { submission: null, error: message }
  }
}

/**
 * Validate a submission (by validator)
 */
export async function validateSubmission(
  submissionId: string,
  validatorWallet: string,
  approved: boolean
): Promise<{ success: boolean; completed: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get submission with bounty info
    const { data: submission, error: fetchError } = await supabase
      .from("bounty_submissions")
      .select("*, bounty:bounties(required_validations)")
      .eq("id", submissionId)
      .single()

    if (fetchError || !submission) {
      return { success: false, completed: false, error: "Submission not found" }
    }

    // Check if validator already voted
    const validations = (submission.validations as { wallet: string; approved: boolean; timestamp: string }[]) || []
    if (validations.some((v) => v.wallet === validatorWallet)) {
      return { success: false, completed: false, error: "You have already validated this submission" }
    }

    // Add validation
    validations.push({
      wallet: validatorWallet,
      approved,
      timestamp: new Date().toISOString(),
    })

    // Check if enough validations
    const approvals = validations.filter((v) => v.approved).length
    const rejections = validations.filter((v) => !v.approved).length
    const requiredValidations = submission.bounty?.required_validations || 1
    
    let newStatus: SubmissionStatus = "pending"
    let completed = false

    if (approvals >= requiredValidations) {
      newStatus = "approved"
      completed = true
    } else if (rejections >= requiredValidations) {
      newStatus = "rejected"
    }

    const { error: updateError } = await supabase
      .from("bounty_submissions")
      .update({
        validations,
        status: newStatus,
        resolved_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", submissionId)

    if (updateError) {
      return { success: false, completed: false, error: updateError.message }
    }

    // If approved, update bounty status to validating/completed
    if (completed) {
      await updateBountyStatus(submission.bounty_id, "completed")
    } else if (newStatus === "pending") {
      await updateBountyStatus(submission.bounty_id, "validating")
    }

    return { success: true, completed, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to validate"
    return { success: false, completed: false, error: message }
  }
}

/**
 * Get bounties created by a wallet
 */
export async function getBountiesByCreator(
  walletAddress: string
): Promise<{ bounties: Bounty[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("bounties")
      .select("*")
      .eq("created_by", walletAddress)
      .order("created_at", { ascending: false })

    if (error) {
      return { bounties: [], error: error.message }
    }

    return { bounties: data as Bounty[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch bounties"
    return { bounties: [], error: message }
  }
}

/**
 * Get bounties where wallet is a validator
 */
export async function getBountiesForValidator(
  walletAddress: string
): Promise<{ bounties: Bounty[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // Get bounty IDs where user is validator
    const { data: validatorRecords, error: valError } = await supabase
      .from("bounty_validators")
      .select("bounty_id")
      .eq("wallet_address", walletAddress)

    if (valError) {
      return { bounties: [], error: valError.message }
    }

    if (!validatorRecords || validatorRecords.length === 0) {
      return { bounties: [], error: null }
    }

    const bountyIds = validatorRecords.map((r) => r.bounty_id)

    const { data: bounties, error: bountyError } = await supabase
      .from("bounties")
      .select("*")
      .in("id", bountyIds)
      .order("created_at", { ascending: false })

    if (bountyError) {
      return { bounties: [], error: bountyError.message }
    }

    return { bounties: bounties as Bounty[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch bounties"
    return { bounties: [], error: message }
  }
}

/**
 * Get all open bounties
 */
export async function getOpenBounties(): Promise<{ bounties: Bounty[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("bounties")
      .select("*")
      .in("status", ["open", "funded"])
      .order("created_at", { ascending: false })

    if (error) {
      return { bounties: [], error: error.message }
    }

    return { bounties: data as Bounty[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch bounties"
    return { bounties: [], error: message }
  }
}

/**
 * Generate shareable link for bounty
 */
export function getBountyShareableLink(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://thalos.xyz")
  return `${base}/bounty/${slug}`
}
