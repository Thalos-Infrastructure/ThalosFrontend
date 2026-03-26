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

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, wallet_address")
    .neq("id", user.id)
    .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,wallet_address.ilike.%${query}%`)
    .limit(10)

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
