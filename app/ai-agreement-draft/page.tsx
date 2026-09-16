"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AIAgreementEngine } from "@/components/ai-agreement-engine"
import { AgreementDraftSchema, type AgreementDraft } from "@/lib/ai/agreement-draft.types"
import { buildCreateEscrow, type BackendCreateEscrowDto } from "@/lib/api/escrow"
import { useAuthStore } from "@/lib/auth-store"
import { toast } from "sonner"

// Convert AI draft to backend DTO
function draftToBackendDto(draft: AgreementDraft): BackendCreateEscrowDto {
  const isMulti = draft.serviceType === "multi-release"

  return {
    title: draft.title,
    description: draft.description,
    amount: draft.amount.toString(),
    platformFee: draft.platformFee || "0",
    signer: draft.roles.serviceProvider, // Will be replaced by JWT user's wallet
    serviceType: draft.serviceType,
    roles: {
      approver: draft.roles.approver,
      serviceProvider: draft.roles.serviceProvider,
      releaseSigner: draft.roles.releaseSigner,
      ...(draft.roles.receiver ? { receiver: draft.roles.receiver } : {}),
    },
    milestones: draft.milestones.map((m) => ({
      description: m.description,
      ...(isMulti ? { amount: m.amount.toString(), status: m.status } : {}),
    })),
  }
}

export default function AIAgreementDraftPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false)

  const handleDraftGenerated = async (draft: AgreementDraft) => {
    // Validate the draft
    const validation = AgreementDraftSchema.safeParse(draft)
    if (!validation.success) {
      toast.error("Invalid draft generated")
      return
    }

    // If we have a token, create the escrow
    if (token) {
      setIsCreatingEscrow(true)
      try {
        const dto = draftToBackendDto(draft)
        const response = await buildCreateEscrow(dto, token)

        if (response.success && response.data?.unsignedTransaction) {
          toast.success("Escrow created! Ready to sign.")
          router.push("/dashboard")
        } else {
          toast.error(response.error || "Failed to create escrow")
        }
      } catch (e) {
        toast.error("Error creating escrow")
      } finally {
        setIsCreatingEscrow(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">AI Agreement Draft Engine</h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Describe your agreement in natural language and let our AI generate a structured draft.
            The draft can then be used to create an escrow contract on Thalos.
          </p>
        </div>

        {/* AI Engine */}
        <div className="rounded-2xl border border-white/10 bg-[#0c1220] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <AIAgreementEngine
            onDraftGenerated={handleDraftGenerated}
            initialPrompt="I want to pay a developer $5000 for a React application. Payment will be split into 3 milestones: design ($1000), development ($3000), and deployment ($1000)."
          />
        </div>

        {/* Requirements */}
        <div className="mt-8 rounded-xl bg-amber-900/20 border border-amber-700 p-4">
          <h3 className="text-sm font-medium text-amber-300 mb-2">Requirements</h3>
          <ul className="text-sm text-amber-200 space-y-1">
            <li>• You must be logged in to create escrow contracts</li>
            <li>• The generated draft will be validated before creating the escrow</li>
            <li>• All wallet addresses should be in Stellar format (G...)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
