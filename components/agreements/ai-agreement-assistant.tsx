"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"

export interface AiDraftData {
  title: string
  description: string
  escrowType: "single" | "multi"
  useCase: string | null
  milestones: { description: string; amount: string }[]
  riskFlags: string[]
  totalAmount: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface EngineMilestone {
  description: string
  // Live #121 engine returns numeric amounts; tolerate string amounts too.
  amount: number | string
  status?: string
}

interface EngineDraft {
  title: string
  description: string
  amount: number | string
  platformFee?: string
  signer?: string
  // The engine on `main` uses `serviceType`; some builds expose `agreement_type`.
  serviceType?: "single-release" | "multi-release"
  agreement_type?: "single" | "multi"
  roles?: { approver: string; serviceProvider: string; releaseSigner: string; receiver?: string }
  milestones: EngineMilestone[]
  // Risk flags may arrive under `metadata.riskFlags` or at the top level.
  riskFlags?: string[]
  metadata?: { riskFlags?: string[] }
}

interface DraftEnvelope {
  success?: boolean
  error?: string
  data?: (EngineDraft & { draft?: EngineDraft; validationErrors?: string[] }) | null
}

// The engine response envelope has drifted across builds. The route on `main`
// wraps the draft as `{ data: { draft, validationErrors } }`, but the reviewed
// contract describes `{ data: AgreementDraft }` (draft at the top of `data`).
// Unwrap either shape so a successful response is never misread as a failure.
function extractDraft(env: DraftEnvelope | null | undefined): EngineDraft | undefined {
  const container = env?.data
  if (!container) return undefined
  if (container.draft) return container.draft
  if (container.title || Array.isArray(container.milestones)) {
    return container as EngineDraft
  }
  return undefined
}

function extractValidationErrors(env: DraftEnvelope | null | undefined): string[] | undefined {
  return env?.data?.validationErrors
}

function toAmountString(value: number | string | null | undefined): string {
  if (value == null) return ""
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : ""
  return String(value).trim()
}

function resolveEscrowType(draft: EngineDraft): "single" | "multi" {
  if (draft.agreement_type === "single" || draft.agreement_type === "multi") {
    return draft.agreement_type
  }
  return draft.serviceType === "multi-release" ? "multi" : "single"
}

const USE_CASE_KEYWORDS: Record<string, string[]> = {
  freelancer: ["freelanc", "freelance", "contractor", "web dev", "design", "develop", "writing", "consulting"],
  rental: ["rent", "rental", "lease", "property", "apartment", "house", "tenant"],
  "car-sale": ["car", "vehicle", "auto", "automotive", "dealership", "vin"],
  coaching: ["coach", "course", "training", "mentor", "lesson", "class", "educational"],
  "home-repair": ["repair", "home", "renovation", "plumber", "electrician", "contractor", "remodel"],
  "car-rental": ["car rental", "fleet", "rental vehicle", "rental car"],
  travel: ["travel", "package", "trip", "vacation", "tour", "hotel", "destination"],
  dealership: ["dealership", "vehicle purchase", "car purchase", "inventory"],
  "rental-platform": ["short-term", "booking", "platform rental", "vacation rental", "airbnb"],
  event: ["event", "management", "venue", "conference", "wedding", "party"],
}

function detectUseCase(text: string, profile: string): string | null {
  const lower = text.toLowerCase()
  const keywords =
    profile === "business"
      ? ["car-rental", "travel", "dealership", "rental-platform", "event"]
      : ["freelancer", "rental", "car-sale", "coaching", "home-repair"]

  for (const [id, words] of Object.entries(USE_CASE_KEYWORDS)) {
    if (keywords.includes(id) && words.some((w) => lower.includes(w))) {
      return id
    }
  }
  return null
}

function mapEngineDraft(
  draft: EngineDraft,
  useCase: string | null,
  validationErrors?: string[],
): AiDraftData {
  const riskFlags =
    (draft.metadata?.riskFlags?.length ? draft.metadata.riskFlags : undefined) ??
    (draft.riskFlags?.length ? draft.riskFlags : undefined) ??
    (validationErrors?.length ? validationErrors : [])

  return {
    title: draft.title,
    description: draft.description,
    escrowType: resolveEscrowType(draft),
    useCase,
    milestones: (draft.milestones || []).map((m) => ({
      description: m.description,
      amount: toAmountString(m.amount),
    })),
    riskFlags,
    totalAmount: toAmountString(draft.amount),
  }
}

function buildDraftMessage(draft: AiDraftData): string {
  const lines: string[] = []
  lines.push("### ✅ Draft Ready")
  lines.push("")
  lines.push(`**${draft.title}**`)
  if (draft.description) lines.push(draft.description)
  lines.push("")
  lines.push(`- Agreement type: ${draft.escrowType === "multi" ? "Multi Release" : "Single Release"}`)
  if (draft.useCase) lines.push(`- Category: ${draft.useCase}`)
  if (draft.totalAmount && !Number.isNaN(Number(draft.totalAmount))) {
    lines.push(`- Total amount: $${Number(draft.totalAmount).toLocaleString()} USDC`)
  }
  if (draft.milestones.length > 0) {
    lines.push("")
    lines.push("### Milestones")
    draft.milestones.forEach((m, i) => {
      const amount = m.amount && !Number.isNaN(Number(m.amount))
        ? ` — $${Number(m.amount).toLocaleString()} USDC`
        : ""
      lines.push(`${i + 1}. ${m.description}${amount}`)
    })
  }
  if (draft.riskFlags.length > 0) {
    lines.push("")
    draft.riskFlags.forEach((flag) => lines.push(`⚠️ ${flag}`))
  }
  lines.push("")
  lines.push("Review the draft and confirm to open the pre-filled form.")
  return lines.join("\n")
}

interface Props {
  profile: "personal" | "business"
  onDraftComplete: (draft: AiDraftData) => void
  onClose: () => void
}

export function AiAgreementAssistant({ profile, onDraftComplete, onClose }: Props) {
  const { token } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [draftData, setDraftData] = useState<AiDraftData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialGreetingDone, setInitialGreetingDone] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!initialGreetingDone) {
      const greeting = profile === "business"
        ? "Hello! I'm your AI Agreement Assistant for Enterprise. I'll help you create a secure escrow agreement on Thalos.\n\nTell me about the deal you'd like to set up — what's the agreement for? Please include details like the amount, parties involved, and deliverables."
        : "Hello! I'm your AI Agreement Assistant. I'll help you create a secure escrow agreement on Thalos.\n\nTell me about the deal you'd like to set up — what's the agreement for? Please include details like the amount, parties involved, and deliverables."
      setMessages([{ role: "assistant", content: greeting }])
      setInitialGreetingDone(true)
    }
  }, [initialGreetingDone, profile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!loading && !draftData) {
      inputRef.current?.focus()
    }
  }, [loading, draftData])

  const sendMessage = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || loading) return

    setInput("")
    setError(null)
    const updatedMessages: Message[] = [...messages, { role: "user", content: trimmed }]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const prompt = updatedMessages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n\n")
      const detectedUseCase = detectUseCase(prompt, profile)

      const res = await fetch("/api/ai/agreement-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, useCase: detectedUseCase ?? undefined }),
      })

      const data = (await res.json()) as DraftEnvelope

      if (!res.ok || data.success === false || data.error) {
        const engineDraft = extractDraft(data)
        const validationErrors = extractValidationErrors(data)
        if (engineDraft && validationErrors && validationErrors.length > 0) {
          const mapped = mapEngineDraft(engineDraft, detectedUseCase, validationErrors)
          setDraftData(mapped)
          setMessages([...updatedMessages, { role: "assistant", content: buildDraftMessage(mapped) }])
        } else {
          const errorMsg =
            data.error || "I ran into an issue. Please try again or use the manual form below."
          setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }])
          setError(data.error ?? null)
        }
        setLoading(false)
        return
      }

      const engineDraft = extractDraft(data)
      if (!engineDraft) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I couldn't draft that yet. Please try again." },
        ])
        setLoading(false)
        return
      }

      const mapped = mapEngineDraft(engineDraft, detectedUseCase, extractValidationErrors(data))
      setDraftData(mapped)
      setMessages([...updatedMessages, { role: "assistant", content: buildDraftMessage(mapped) }])
    } catch {
      const errorMsg = "Connection error. Please check your network and try again."
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }])
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleConfirmDraft = () => {
    if (draftData) {
      onDraftComplete(draftData)
    }
  }

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Let's start over. Tell me about your deal and I'll help you create an agreement.",
      },
    ])
    setDraftData(null)
    setError(null)
    setInput("")
  }

  const renderMessage = (msg: Message, idx: number) => {
    if (msg.role === "user") {
      return (
        <div key={idx} className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl bg-[#f0b400]/10 px-4 py-2.5 border border-[#f0b400]/15">
            <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
          </div>
        </div>
      )
    }

    const parts = msg.content.split(/(### .+)/g)
    return (
      <div key={idx} className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl bg-white/[0.04] px-4 py-2.5 border border-white/[0.06]">
          {parts.map((part, i) => {
            if (part.startsWith("### ")) {
              const text = part.replace("### ", "")
              if (text.includes("Draft Ready") || text.includes("✅")) {
                return (
                  <p key={i} className="text-base font-bold text-[#f0b400] mt-3 mb-2">
                    {text}
                  </p>
                )
              }
              return (
                <p key={i} className="text-sm font-bold text-white mt-2 mb-1">
                  {text.replace(/\*\*/g, "")}
                </p>
              )
            }
            if (part.startsWith("⚠️")) {
              return (
                <p key={i} className="text-xs text-amber-400/80 mt-1 flex items-start gap-1.5">
                  {part}
                </p>
              )
            }
            if (part.startsWith("---")) return null
            if (part.includes("**") || part.includes("*")) {
              const rendered = part
                .split(/(\*\*[^*]+\*\*)/g)
                .map((seg, j) => {
                  if (seg.startsWith("**") && seg.endsWith("**")) {
                    return (
                      <strong key={j} className="text-white font-semibold">
                        {seg.slice(2, -2)}
                      </strong>
                    )
                  }
                  if (seg.startsWith("_") && seg.endsWith("_") && seg.length > 2) {
                    return (
                      <em key={j} className="text-white/70">
                        {seg.slice(1, -1)}
                      </em>
                    )
                  }
                  const withLineBreaks = seg.split("\n").map((line, k) => (
                    <React.Fragment key={k}>
                      {k > 0 && <br />}
                      {line}
                    </React.Fragment>
                  ))
                  return withLineBreaks
                })
              return (
                <p key={i} className="text-sm text-white/80 whitespace-pre-wrap">
                  {rendered}
                </p>
              )
            }
            if (part.trim().startsWith("1.") || part.trim().startsWith("2.") || part.trim().startsWith("-")) {
              return (
                <p key={i} className="text-sm text-white/80 ml-2">
                  {part}
                </p>
              )
            }
            return (
              <p key={i} className="text-sm text-white/80 whitespace-pre-wrap">
                {part}
              </p>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            AI Agreement Assistant
          </h2>
          <p className="text-xs text-white/40">
            Describe your deal in natural language
          </p>
        </div>
        <div className="flex items-center gap-2">
          {draftData && (
            <button
              onClick={handleReset}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Start over
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {error && !draftData && (
        <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs text-amber-400/80">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[280px] max-h-[360px] pr-1">
        {messages.map((msg, idx) => renderMessage(msg, idx))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white/[0.04] px-4 py-3 border border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#f0b400] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 rounded-full bg-[#f0b400] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-2 w-2 rounded-full bg-[#f0b400] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {draftData ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{draftData.title}</p>
              <span className={cn(
                "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                draftData.escrowType === "multi"
                  ? "bg-sky-500/10 text-sky-400"
                  : "bg-[#f0b400]/10 text-[#f0b400]"
              )}>
                {draftData.escrowType === "multi" ? "Multi Release" : "Single Release"}
              </span>
            </div>

            {draftData.useCase && (
              <p className="text-xs text-white/40">Category: {draftData.useCase}</p>
            )}

            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Milestones</p>
              {draftData.milestones.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-white/70">{m.description}</span>
                  {m.amount && <span className="text-white font-medium">${parseFloat(m.amount).toLocaleString()} USDC</span>}
                </div>
              ))}
            </div>

            {draftData.riskFlags.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/60">Risk Flags</p>
                {draftData.riskFlags.map((flag, i) => (
                  <p key={i} className="text-xs text-amber-400/70 flex items-start gap-1.5">
                    <span>⚠️</span>
                    <span>{flag}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConfirmDraft}
              className="flex-1 rounded-full bg-[#f0b400] text-sm font-semibold text-background hover:bg-[#d4a000]"
            >
              Generate Agreement Draft
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-full border-white/10 text-sm text-white/60 hover:bg-white/5"
            >
              Edit description
            </Button>
          </div>
          <p className="text-[10px] text-white/30 text-center">
            The form will open pre-filled and fully editable. No agreement is created until you submit.
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your deal..."
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#f0b400]/40 focus:ring-1 focus:ring-[#f0b400]/15 transition-all disabled:opacity-50"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="rounded-xl bg-[#f0b400] text-background font-semibold hover:bg-[#d4a000] disabled:opacity-30 px-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}
