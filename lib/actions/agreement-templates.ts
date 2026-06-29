"use server"

import { createClient } from "@/lib/supabase/server"

export interface TemplateMilestone {
  description: string
  amount: string
  status: "pending" | "approved" | "released"
}

export interface AgreementTemplate {
  id: string
  owner_wallet: string
  name: string
  title: string
  description: string | null
  amount: string | null
  asset: string
  agreement_type: "single" | "multi"
  milestones: TemplateMilestone[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CreateTemplateInput {
  owner_wallet: string
  name: string
  title: string
  description?: string
  amount?: string
  asset?: string
  agreement_type?: "single" | "multi"
  milestones?: TemplateMilestone[]
  metadata?: Record<string, unknown>
}

export async function createTemplate(
  input: CreateTemplateInput
): Promise<{ template: AgreementTemplate | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("agreement_templates")
      .insert({
        owner_wallet: input.owner_wallet,
        name: input.name,
        title: input.title,
        description: input.description || null,
        amount: input.amount || null,
        asset: input.asset || "USDC",
        agreement_type: input.agreement_type || "single",
        milestones: input.milestones || [],
        metadata: input.metadata || {},
      })
      .select()
      .single()

    if (error) return { template: null, error: error.message }
    return { template: data as AgreementTemplate, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create template"
    return { template: null, error: message }
  }
}

export async function updateTemplate(
  id: string,
  ownerWallet: string,
  updates: Partial<Omit<CreateTemplateInput, "owner_wallet">>
): Promise<{ template: AgreementTemplate | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("agreement_templates")
      .update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.asset !== undefined && { asset: updates.asset }),
        ...(updates.agreement_type !== undefined && { agreement_type: updates.agreement_type }),
        ...(updates.milestones !== undefined && { milestones: updates.milestones }),
        ...(updates.metadata !== undefined && { metadata: updates.metadata }),
      })
      .eq("id", id)
      .eq("owner_wallet", ownerWallet)
      .select()
      .single()

    if (error) return { template: null, error: error.message }
    return { template: data as AgreementTemplate, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update template"
    return { template: null, error: message }
  }
}

export async function deleteTemplate(
  id: string,
  ownerWallet: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("agreement_templates")
      .delete()
      .eq("id", id)
      .eq("owner_wallet", ownerWallet)

    if (error) return { success: false, error: error.message }
    return { success: true, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete template"
    return { success: false, error: message }
  }
}

export async function getTemplatesByOwner(
  ownerWallet: string
): Promise<{ templates: AgreementTemplate[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("agreement_templates")
      .select("*")
      .eq("owner_wallet", ownerWallet)
      .order("created_at", { ascending: false })

    if (error) return { templates: null, error: error.message }
    return { templates: data as AgreementTemplate[], error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch templates"
    return { templates: null, error: message }
  }
}

export async function getTemplateById(
  id: string,
  ownerWallet: string
): Promise<{ template: AgreementTemplate | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("agreement_templates")
      .select("*")
      .eq("id", id)
      .eq("owner_wallet", ownerWallet)
      .single()

    if (error) return { template: null, error: error.message }
    return { template: data as AgreementTemplate, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch template"
    return { template: null, error: message }
  }
}
