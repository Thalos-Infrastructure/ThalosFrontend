"use server"

import { createClient } from "@/lib/supabase/server"

export interface AgreementMessage {
  id: string
  agreement_id: string
  sender_id: string
  sender_wallet: string
  message: string
  created_at: string
}

export async function getAgreementMessages(agreementId: string): Promise<{ messages: AgreementMessage[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { messages: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("agreement_messages")
    .select("*")
    .eq("agreement_id", agreementId)
    .order("created_at", { ascending: true })

  if (error) {
    return { messages: [], error: error.message }
  }

  return { messages: data || [], error: null }
}

export async function sendAgreementMessage(
  agreementId: string,
  message: string,
  senderWallet: string
): Promise<{ message: AgreementMessage | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { message: null, error: "Not authenticated" }
  }

  if (!message.trim()) {
    return { message: null, error: "Message cannot be empty" }
  }

  const { data, error } = await supabase
    .from("agreement_messages")
    .insert({
      agreement_id: agreementId,
      sender_id: user.id,
      sender_wallet: senderWallet,
      message: message.trim(),
    })
    .select()
    .single()

  if (error) {
    return { message: null, error: error.message }
  }

  return { message: data, error: null }
}
