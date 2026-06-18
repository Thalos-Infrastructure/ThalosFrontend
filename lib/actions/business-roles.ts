"use server"

import { createServiceClient } from "@/lib/supabase/service"
import { type Profile } from "@/lib/actions/profile"

export interface BusinessMember {
  id: string
  business_wallet: string
  member_wallet: string
  role: "Admin" | "Finance" | "Operator"
  created_at: string
  updated_at: string
  display_name?: string | null
  email?: string | null
  avatar_url?: string | null
}

/**
 * Fetch all team members for a given business wallet
 */
export async function getBusinessMembers(
  businessWallet: string
): Promise<{ members: BusinessMember[]; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { data: members, error } = await supabase
      .from("business_members")
      .select("*")
      .eq("business_wallet", businessWallet)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching business members:", error)
      return { members: [], error: error.message }
    }

    if (!members || members.length === 0) {
      return { members: [], error: null }
    }

    // Populate profile details (display_name, email, avatar_url) for each member
    const memberWallets = members.map((m) => m.member_wallet)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("wallet_address, display_name, email, avatar_url")
      .in("wallet_address", memberWallets)

    if (profilesError) {
      console.warn("Could not fetch profile details for business members:", profilesError)
    }

    const profileMap = new Map(profiles?.map((p) => [p.wallet_address, p]) || [])

    const populatedMembers = members.map((m) => {
      const profile = profileMap.get(m.member_wallet)
      return {
        ...m,
        display_name: profile?.display_name || null,
        email: profile?.email || null,
        avatar_url: profile?.avatar_url || null,
      } as BusinessMember
    })

    return { members: populatedMembers, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get business members"
    return { members: [], error: message }
  }
}

/**
 * Add a member to a business workspace with a role
 */
export async function addBusinessMember(
  businessWallet: string,
  memberWallet: string,
  role: "Admin" | "Finance" | "Operator"
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("business_members")
      .insert({
        business_wallet: businessWallet,
        member_wallet: memberWallet,
        role,
      })

    if (error) {
      console.error("Error adding business member:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to add business member"
    return { success: false, error: message }
  }
}

/**
 * Update the role of a business member
 */
export async function updateBusinessMemberRole(
  businessWallet: string,
  memberWallet: string,
  role: "Admin" | "Finance" | "Operator"
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("business_members")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("business_wallet", businessWallet)
      .eq("member_wallet", memberWallet)

    if (error) {
      console.error("Error updating business member role:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update business member role"
    return { success: false, error: message }
  }
}

/**
 * Remove a member from the business workspace
 */
export async function removeBusinessMember(
  businessWallet: string,
  memberWallet: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("business_members")
      .delete()
      .eq("business_wallet", businessWallet)
      .eq("member_wallet", memberWallet)

    if (error) {
      console.error("Error removing business member:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to remove business member"
    return { success: false, error: message }
  }
}

/**
 * Retrieve all business accounts/wallets that the given wallet address is a member of
 */
export async function getUserBusinessAccounts(
  memberWallet: string
): Promise<{ accounts: { business_wallet: string; role: "Admin" | "Finance" | "Operator" }[]; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("business_members")
      .select("business_wallet, role")
      .eq("member_wallet", memberWallet)

    if (error) {
      console.error("Error fetching user's business accounts:", error)
      return { accounts: [], error: error.message }
    }

    return { accounts: data || [], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch user's business accounts"
    return { accounts: [], error: message }
  }
}
