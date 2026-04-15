"use server"

import { createServiceClient } from "@/lib/supabase/service"

export interface Contact {
  id: string
  owner_wallet: string
  contact_wallet: string | null
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  status: "pending" | "active" | "invited"
  created_at: string
  updated_at: string
}

export async function getContacts(ownerWallet: string): Promise<{ contacts: Contact[]; error: string | null }> {
  if (!ownerWallet) {
    return { contacts: [], error: "Wallet address is required" }
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("owner_wallet", ownerWallet)
    .order("contact_name", { ascending: true })

  if (error) {
    return { contacts: [], error: error.message }
  }

  return { contacts: data || [], error: null }
}

export async function addContact(
  ownerWallet: string,
  data: {
    name: string
    email?: string
    phone?: string
    wallet_address?: string
    notes?: string
  }
): Promise<{ contact: Contact | null; error: string | null }> {
  if (!ownerWallet) {
    return { contact: null, error: "Wallet address is required" }
  }

  const supabase = createServiceClient()

  // Check if contact already exists
  if (data.wallet_address) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("owner_wallet", ownerWallet)
      .eq("contact_wallet", data.wallet_address)
      .maybeSingle()

    if (existing) {
      return { contact: null, error: "Contact already exists" }
    }
  }

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      owner_wallet: ownerWallet,
      contact_wallet: data.wallet_address || null,
      contact_name: data.name,
      contact_email: data.email || null,
      contact_phone: data.phone || null,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    return { contact: null, error: error.message }
  }

  return { contact, error: null }
}

export async function searchThalosUsers(
  query: string,
  excludeWallet?: string
): Promise<{ users: Array<{ id: string; name: string; email: string; wallet_address: string }>; error: string | null }> {
  if (!query || query.length < 2) {
    return { users: [], error: null }
  }

  const supabase = createServiceClient()

  // Sanitize query for safe use
  const sanitizedQuery = query.replace(/[%_]/g, "")
  
  // Check if it looks like a wallet address (starts with G)
  const isWalletAddress = query.startsWith("G") && query.length >= 10
  
  let data
  let error
  
  if (isWalletAddress) {
    // Search by wallet address prefix
    const result = await supabase
      .from("profiles")
      .select("id, display_name, email, wallet_address")
      .ilike("wallet_address", `${sanitizedQuery}%`)
      .limit(10)
    data = result.data
    error = result.error
  } else {
    // Search by name or email
    const result = await supabase
      .from("profiles")
      .select("id, display_name, email, wallet_address")
      .or(`display_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
      .limit(10)
    data = result.data
    error = result.error
  }

  if (error) {
    return { users: [], error: error.message }
  }

  // Filter out the exclude wallet if provided
  const filtered = excludeWallet 
    ? (data || []).filter(u => u.wallet_address !== excludeWallet)
    : (data || [])

  return {
    users: filtered.map(u => ({
      id: u.id,
      name: u.display_name || "Unknown",
      email: u.email || "",
      wallet_address: u.wallet_address || "",
    })),
    error: null,
  }
}

export async function deleteContact(ownerWallet: string, contactId: string): Promise<{ error: string | null }> {
  if (!ownerWallet || !contactId) {
    return { error: "Wallet and contact ID are required" }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("owner_wallet", ownerWallet)

  return { error: error?.message || null }
}

/**
 * Update an existing contact
 */
export async function updateContact(
  ownerWallet: string,
  contactId: string, 
  data: {
    name?: string
    email?: string
    phone?: string
    wallet_address?: string
    notes?: string
  }
): Promise<{ contact: Contact | null; error: string | null }> {
  if (!ownerWallet || !contactId) {
    return { contact: null, error: "Wallet and contact ID are required" }
  }

  const supabase = createServiceClient()

  const updateData: Record<string, string | null> = {}
  if (data.name !== undefined) updateData.contact_name = data.name
  if (data.email !== undefined) updateData.contact_email = data.email || null
  if (data.phone !== undefined) updateData.contact_phone = data.phone || null
  if (data.wallet_address !== undefined) updateData.contact_wallet = data.wallet_address || null

  const { data: contact, error } = await supabase
    .from("contacts")
    .update(updateData)
    .eq("id", contactId)
    .eq("owner_wallet", ownerWallet)
    .select()
    .single()

  if (error) {
    return { contact: null, error: error.message }
  }

  return { contact, error: null }
}
