"use server"

import { createClient } from "@/lib/supabase/server"

export type Profile = {
  id: string
  wallet_address: string
  display_name: string | null
  email: string | null
  avatar_url: string | null
  account_type: "personal" | "business"
  role: "user" | "validator" | "dispute_resolver" | "admin"
  created_at: string
  updated_at: string
}

export type ProfileUpdateInput = {
  display_name?: string
  email?: string
  avatar_url?: string
  account_type?: "personal" | "business"
}

/**
 * Get or create a profile by wallet address.
 * If the profile doesn't exist, it creates one with default values.
 */
export async function getOrCreateProfile(
  walletAddress: string,
  accountType: "personal" | "business" = "personal"
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    // First, try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()

    if (existingProfile) {
      return { profile: existingProfile as Profile, error: null }
    }

    // Profile doesn't exist, create one
    if (fetchError && fetchError.code === "PGRST116") {
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          wallet_address: walletAddress,
          account_type: accountType,
          role: "user",
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating profile:", insertError)
        return { profile: null, error: insertError.message }
      }

      return { profile: newProfile as Profile, error: null }
    }

    if (fetchError) {
      console.error("Error fetching profile:", fetchError)
      return { profile: null, error: fetchError.message }
    }

    return { profile: null, error: "Unknown error" }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get or create profile"
    return { profile: null, error: message }
  }
}

/**
 * Get a profile by wallet address
 */
export async function getProfileByWallet(
  walletAddress: string
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return { profile: null, error: null } // Not found, but not an error
      }
      return { profile: null, error: error.message }
    }

    return { profile: data as Profile, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch profile"
    return { profile: null, error: message }
  }
}

/**
 * Update a profile by wallet address
 */
export async function updateProfile(
  walletAddress: string,
  updates: ProfileUpdateInput
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      return { profile: null, error: error.message }
    }

    return { profile: data as Profile, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update profile"
    return { profile: null, error: message }
  }
}

/**
 * Get all profiles with a specific role (e.g., dispute_resolver)
 */
export async function getProfilesByRole(
  role: Profile["role"]
): Promise<{ profiles: Profile[]; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false })

    if (error) {
      return { profiles: [], error: error.message }
    }

    return { profiles: data as Profile[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch profiles"
    return { profiles: [], error: message }
  }
}

/**
 * Promote a user to a specific role (admin only)
 */
export async function setUserRole(
  walletAddress: string,
  role: Profile["role"]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("wallet_address", walletAddress)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update role"
    return { success: false, error: message }
  }
}
