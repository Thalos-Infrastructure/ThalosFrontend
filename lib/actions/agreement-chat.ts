"use server"

import { createServiceClient } from "@/lib/supabase/service"

export interface AgreementMessage {
  id: string
  agreement_id: string
  sender_wallet: string
  message: string
  created_at: string
  read_at: string | null
}

export async function getAgreementMessages(agreementId: string): Promise<{ messages: AgreementMessage[]; error: string | null }> {
  if (!agreementId) {
    return { messages: [], error: "Agreement ID is required" }
  }

  const supabase = createServiceClient()

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
  if (!agreementId) {
    return { message: null, error: "Agreement ID is required" }
  }

  if (!senderWallet) {
    return { message: null, error: "Sender wallet is required" }
  }

  if (!message.trim()) {
    return { message: null, error: "Message cannot be empty" }
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("agreement_messages")
    .insert({
      agreement_id: agreementId,
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
