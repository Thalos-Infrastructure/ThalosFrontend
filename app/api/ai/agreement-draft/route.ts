import { NextRequest, NextResponse } from "next/server"
import {
  DraftRequestSchema,
  DraftApiResponseSchema,
  type AgreementDraft,
  type DraftApiResponse,
} from "@/lib/ai/agreement-draft.types"
import { buildSystemPrompt, validateAgreementDraft } from "@/lib/ai/validate-agreement-draft"
import { USE_CASE_PROMPTS } from "@/lib/ai/use-case-prompts"
import { verifyToken } from "@/lib/auth/utils"

// OpenAI-compatible API configuration
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
const MODEL_ID = process.env.OPENAI_MODEL || process.env.AI_MODEL_ID || "gpt-4o-mini"

// In-memory rate limiter (20 requests per user per hour)
// NOTE: process-local only. Replace with Redis/Upstash for multi-instance deployments.
const RATE_LIMIT = new Map<string, { count: number; resetTime: number }>()
const MAX_REQUESTS_PER_HOUR = 20

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = RATE_LIMIT.get(userId)

  if (!record || now > record.resetTime) {
    RATE_LIMIT.set(userId, { count: 1, resetTime: now + 60 * 60 * 1000 })
    return true
  }

  if (record.count >= MAX_REQUESTS_PER_HOUR) {
    return false
  }

  record.count++
  return true
}

interface GenerateObjectResult {
  object: AgreementDraft
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function generateObject(
  system: string,
  userPrompt: string,
  _schema: object,
): Promise<GenerateObjectResult> {
  const authHeader = "Bearer " + OPENAI_API_KEY
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("No content in OpenAI response")
  }

  try {
    const parsed = JSON.parse(content)
    return { object: parsed as AgreementDraft }
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${content}`)
  }
}

/**
 * POST /api/ai/agreement-draft
 * Generates an AI-powered agreement draft from a natural language prompt.
 * Requires Bearer JWT authentication + rate limiting.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check — Bearer JWT
    const auth = req.headers.get("authorization")
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
    if (!token) {
      const resp: DraftApiResponse = {
        success: false,
        error: "Missing authentication token",
      }
      return NextResponse.json(resp, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      const resp: DraftApiResponse = {
        success: false,
        error: "Invalid or expired token",
      }
      return NextResponse.json(resp, { status: 401 })
    }

    const userId = payload.sub as string

    // 2. Rate limiting
    if (!checkRateLimit(userId)) {
      const resp: DraftApiResponse = {
        success: false,
        error: "Rate limit exceeded. Maximum 20 requests per hour.",
      }
      return NextResponse.json(resp, { status: 429 })
    }

    // 3. Parse and validate request body
    const body = await req.json()
    const validation = DraftRequestSchema.safeParse(body)

    if (!validation.success) {
      const resp: DraftApiResponse = {
        success: false,
        error: `Invalid request: ${validation.error.issues.map((i) => i.message).join(", ")}`,
      }
      return NextResponse.json(resp, { status: 400 })
    }

    const { prompt, useCase } = validation.data

    if (!prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt is required", data: null },
        { status: 400 },
      )
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Prompt exceeds max length of 5000 characters", data: null },
        { status: 400 },
      )
    }

    // 4. Check API key
    if (!OPENAI_API_KEY) {
      const resp: DraftApiResponse = {
        success: false,
        error: "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
      }
      return NextResponse.json(resp, { status: 500 })
    }

    // 5. Build system prompt + generate
    const systemPrompt = buildSystemPrompt(useCase)

    let draft: AgreementDraft
    try {
      const result = await generateObject(systemPrompt, prompt, { type: "object" })
      draft = result.object
    } catch (e: unknown) {
      console.error("AI generation failed:", e)
      const resp: DraftApiResponse = {
        success: false,
        error: e instanceof Error ? e.message : "Failed to generate agreement draft",
      }
      return NextResponse.json(resp, { status: 500 })
    }

    // 6. Validate + post-process
    const validationResult = validateAgreementDraft(draft)
    const { processDraftAfterAI } = await import("@/lib/ai/process-draft-after-ai")
    const processed = processDraftAfterAI({ draft })

    if (!processed.success) {
      return NextResponse.json(
        {
          success: false,
          error: processed.error || "Processed draft failed validation",
          data: {
            draft,
            validationErrors: processed.data?.validationErrors,
            confidence: 0,
          },
        },
        { status: 422 },
      )
    }

    const response = {
      success: true,
      data: {
        draft: processed.data!.draft,
        validationErrors: validationResult.errors.length > 0 ? validationResult.errors : undefined,
        confidence: processed.data!.confidence,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Unexpected error:", error)
    const resp: DraftApiResponse = {
      success: false,
      error: "Internal server error",
    }
    return NextResponse.json(resp, { status: 500 })
  }
}

/**
 * GET /api/ai/agreement-draft
 * Returns available use cases for agreement drafting
 */
export async function GET() {
  const useCases = USE_CASE_PROMPTS.map((prompt, index) => ({
    id: `use-case-${index + 1}`,
    name: prompt,
    description: prompt,
  }))

  return NextResponse.json({ success: true, data: { useCases } })
}
