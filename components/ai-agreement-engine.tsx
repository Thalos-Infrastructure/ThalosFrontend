"use client"

import { useState } from "react"
import { Loader2, Sparkles, Check, AlertCircle, Copy, RefreshCw } from "lucide-react"
import {
  AgreementDraftSchema,
  type AgreementDraft,
  type DraftRequest,
} from "@/lib/ai/agreement-draft.types"
import { validateAgreementDraft } from "@/lib/ai/validate-agreement-draft"
import { USE_CASE_PROMPTS } from "@/lib/ai/use-case-prompts"
import { toast } from "sonner"

interface AIEngineResponse {
  success: boolean
  data?: {
    draft: AgreementDraft
    validationErrors?: string[]
    confidence?: number
  }
  error?: string
}

interface Props {
  onDraftGenerated: (draft: AgreementDraft) => void
  initialPrompt?: string
}

export function AIAgreementEngine({ onDraftGenerated, initialPrompt }: Props) {
  const [prompt, setPrompt] = useState(initialPrompt || "")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDraft, setGeneratedDraft] = useState<AgreementDraft | null>(null)
  const [response, setResponse] = useState<AIEngineResponse | null>(null)

  const useCases = [
    "Freelance software development with milestone payments",
    "Content creation (article, video, design) with revision rounds",
    "Consulting services with hourly billing",
    "E-commerce order fulfillment with quality checks",
    "Real estate transaction with legal verification",
    "Import/export with customs clearance milestone",
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description of the agreement")
      return
    }

    setIsGenerating(true)
    setResponse(null)

    try {
      const res = await fetch("/api/ai/agreement-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt } as DraftRequest),
      })

      const data = await res.json()
      const aiResponse: AIEngineResponse = {
        success: data.success,
        data: data.data,
        error: data.error,
      }

      setResponse(aiResponse)

      if (aiResponse.success && aiResponse.data?.draft) {
        setGeneratedDraft(aiResponse.data.draft)
        onDraftGenerated(aiResponse.data.draft)
        toast.success("Agreement draft generated successfully!")
      } else {
        toast.error(aiResponse.error || "Failed to generate draft")
      }
    } catch (e) {
      const errorResponse: AIEngineResponse = {
        success: false,
        error: "Network error or API failure",
      }
      setResponse(errorResponse)
      toast.error(errorResponse.error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyDraft = () => {
    if (generatedDraft) {
      navigator.clipboard.writeText(JSON.stringify(generatedDraft, null, 2))
      toast.success("Draft copied to clipboard")
    }
  }

  const handleRegenerate = () => {
    setGeneratedDraft(null)
    setResponse(null)
    handleGenerate()
  }

  const handleUsePrompt = (useCase: string) => {
    setPrompt(useCase)
  }

  return (
    <div className="w-full space-y-4">
      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Describe your agreement in natural language
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., I want to pay a developer $5000 for a React application. Payment will be split into 3 milestones: design ($1000), development ($3000), and deployment ($1000)..."
          className="w-full min-h-[120px] px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* Quick Use Cases */}
      <div>
        <p className="text-xs text-slate-400 mb-2">Quick templates:</p>
        <div className="flex flex-wrap gap-2">
          {useCases.map((uc) => (
            <button
              key={uc}
              onClick={() => handleUsePrompt(uc)}
              disabled={isGenerating}
              className="text-xs px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {uc}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating agreement draft...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate AI Draft
          </>
        )}
      </button>

      {/* Generated Draft */}
      {generatedDraft && (
        <div className="mt-6 p-4 rounded-lg bg-slate-900/30 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">Generated Draft</h4>
            <div className="flex gap-2">
              <button
                onClick={handleCopyDraft}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleRegenerate}
                className="p-1 rounded hover:bg-slate-800 text-slate-300"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Draft Preview */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400">Title</p>
              <p className="text-sm font-medium text-white">{generatedDraft.title}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Service Type</p>
              <p className="text-sm">
                {generatedDraft.serviceType === "multi-release"
                  ? "Multi-release (milestones)"
                  : "Single release"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Milestones</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {generatedDraft.milestones.map((m, i) => (
                  <li key={i} className="text-slate-300">
                    {m.description} (${m.amount})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Validation Status */}
          {response?.data?.validationErrors && response.data.validationErrors.length > 0 && (
            <div className="mt-3 p-3 rounded bg-amber-900/20 border border-amber-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-300 mb-1">Validation Warnings</p>
                  <ul className="text-xs text-amber-200 space-y-0.5">
                    {response.data.validationErrors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Confidence */}
          {response?.data?.confidence && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: response.data.confidence > 0.8 ? "#22c55e" : "#eab308",
                  }}
                />
                <span>Confidence: {Math.round(response.data.confidence * 100)}%</span>
              </div>
            </div>
          )}

          {/* Accept Button */}
          <button
            onClick={() => onDraftGenerated(generatedDraft)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            <Check className="h-4 w-4" />
            Use This Draft
          </button>
        </div>
      )}

      {/* Error State */}
      {!generatedDraft && response && !response.success && (
        <div className="mt-4 p-4 rounded-lg bg-red-900/20 border border-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300 mb-1">Generation Failed</p>
              <p className="text-xs text-red-200">{response.error || "Unknown error"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
