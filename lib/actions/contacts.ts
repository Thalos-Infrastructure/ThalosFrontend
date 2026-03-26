"use server"

import { createClient } from "@/lib/supabase/server"

export interface Contact {
  id: string
  user_id: string
  contact_user_id: string | null
  name: string
  email: string | null
  phone: string | null
  wallet_address: string | null
  status: "pending" | "active"
  created_at: string
  updated_at: string
}

export async function getContacts(): Promise<{ contacts: Contact[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { contacts: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    return { contacts: [], error: error.message }
  }

  return { contacts: data || [], error: null }
}

export async function addContact(data: {
  name: string
  email?: string
  phone?: string
  wallet_address?: string
}): Promise<{ contact: Contact | null; inviteLink: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { contact: null, inviteLink: null, error: "Not authenticated" }
  }

  // Check if contact already exists by email or wallet
  if (data.email) {
    const { data: existingByEmail } = await supabase
      .from("profiles")
      .select("id, wallet_address")
      .eq("email", data.email)
      .single()

    if (existingByEmail) {
      // User exists on Thalos, create active contact
      const { data: contact, error } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          contact_user_id: existingByEmail.id,
          name: data.name,
          email: data.email,
          wallet_address: existingByEmail.wallet_address,
          status: "active",
        })
        .select()
        .single()

      if (error) {
        return { contact: null, inviteLink: null, error: error.message }
      }

      return { contact, inviteLink: null, error: null }
    }
  }

  // User doesn't exist, create pending contact and generate invite link
  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      wallet_address: data.wallet_address || null,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    return { contact: null, inviteLink: null, error: error.message }
  }

  // Generate invite link
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://thalos.app"}/invite?ref=${user.id}&contact=${contact.id}`

  return { contact, inviteLink, error: null }
}

export async function searchThalosUsers(query: string): Promise<{ users: Array<{ id: string; name: string; email: string; wallet_address: string }>; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { users: [], error: "Not authenticated" }
  }

  // Sanitize query for safe use
  const sanitizedQuery = query.replace(/[%_]/g, "")
  
  // Check if it looks like a UUID (user ID)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query)
  
  let data
  let error
  
  if (isUUID) {
    // Search by exact ID match
    const result = await supabase
      .from("profiles")
      .select("id, display_name, email, wallet_address")
      .eq("id", query)
      .neq("id", user.id)
      .limit(1)
    data = result.data
    error = result.error
  } else {
    // Search by name, email, or wallet address
    const result = await supabase
      .from("profiles")
      .select("id, display_name, email, wallet_address")
      .neq("id", user.id)
      .or(`display_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%,wallet_address.ilike.%${sanitizedQuery}%`)
      .limit(10)
    data = result.data
    error = result.error
  }

  if (error) {
    return { users: [], error: error.message }
  }

  return {
    users: (data || []).map(u => ({
      id: u.id,
      name: u.display_name || "Unknown",
      email: u.email || "",
      wallet_address: u.wallet_address || "",
    })),
    error: null,
  }
}

export async function deleteContact(contactId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", user.id)

  return { error: error?.message || null }
}

/**
 * Creates a mutual contact relationship when a user signs up via referral
 * This ensures both the referrer and the new user have each other as contacts
 */
export async function createContactFromReferral(
  referrerId: string, 
  newUserId: string, 
  newUserProfile: { display_name?: string; email?: string; wallet_address?: string }
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  // Get referrer's profile
  const { data: referrerProfile, error: referrerError } = await supabase
    .from("profiles")
    .select("display_name, email, wallet_address")
    .eq("id", referrerId)
    .single()

  if (referrerError || !referrerProfile) {
    return { success: false, error: "Referrer not found" }
  }

  // Create contact for the referrer (the new user as their contact)
  const { error: error1 } = await supabase
    .from("contacts")
    .upsert({
      user_id: referrerId,
      contact_user_id: newUserId,
      name: newUserProfile.display_name || "New Contact",
      email: newUserProfile.email,
      wallet_address: newUserProfile.wallet_address,
      status: "active",
    }, { onConflict: "user_id,contact_user_id" })

  if (error1) {
    console.error("Error creating contact for referrer:", error1)
  }

  // Create contact for the new user (the referrer as their contact)
  const { error: error2 } = await supabase
    .from("contacts")
    .upsert({
      user_id: newUserId,
      contact_user_id: referrerId,
      name: referrerProfile.display_name || "Referrer",
      email: referrerProfile.email,
      wallet_address: referrerProfile.wallet_address,
      status: "active",
    }, { onConflict: "user_id,contact_user_id" })

  if (error2) {
    console.error("Error creating contact for new user:", error2)
  }

  return { success: !error1 && !error2, error: error1?.message || error2?.message || null }
}
