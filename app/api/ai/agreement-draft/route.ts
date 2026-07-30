import { NextRequest, NextResponse } from "next/server";
import { DraftRequestSchema, DraftApiResponseSchema, type AgreementDraft } from "@/lib/ai/agreement-draft.types";
import { buildSystemPrompt, validateAgreementDraft } from "@/lib/ai/validate-agreement-draft";
import { USE_CASE_PROMPTS } from "@/lib/ai/use-case-prompts";

// AI SDK import - using OpenAI compatible endpoint
// Supports AI Gateway via OPENAI_BASE_URL env var
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "";

interface GenerateObjectResult {
  object: AgreementDraft;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generates an object using OpenAI-compatible API
 * This is a lightweight wrapper for generateObject functionality
 */
async function generateObject(
  system: string,
  userPrompt: string,
  schema: object,
): Promise<GenerateObjectResult> {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  try {
    const parsed = JSON.parse(content);
    return { object: parsed as AgreementDraft };
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${content}`);
  }
}

/**
 * POST /api/ai/agreement-draft
 * Generates an AI-powered agreement draft from a natural language prompt
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = DraftRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          data: null,
        },
        { status: 400 },
      );
    }

    const { prompt, useCase } = validation.data;

    if (!prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Prompt is required", data: null },
        { status: 400 },
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Prompt exceeds max length of 5000 characters", data: null },
        { status: 400 },
      );
    }

    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
          data: null,
        },
        { status: 500 },
      );
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(useCase);

    // Generate agreement draft
    let draft: AgreementDraft;
    try {
      const result = await generateObject(
        systemPrompt,
        prompt,
        { type: "object" }, // Schema placeholder - actual validation happens in validateAgreementDraft
      );
      draft = result.object;
    } catch (e: any) {
      console.error("AI generation failed:", e);
      return NextResponse.json(
        {
          success: false,
          error: e.message || "Failed to generate agreement draft",
          data: null,
        },
        { status: 500 },
      );
    }

    // Validate the generated draft
    const validationResult = validateAgreementDraft(draft);

    // Shared post-AI processing
    const { processDraftAfterAI } = await import("@/lib/ai/process-draft-after-ai");
    const processed = processDraftAfterAI({ draft });

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
      );
    }

    const response = {
      success: true,
      data: {
        draft: processed.data!.draft,
        validationErrors: validationResult.errors.length > 0 ? validationResult.errors : undefined,
        confidence: processed.data!.confidence,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        data: null,
      },
      { status: 500 },
    );
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
  }));

  return NextResponse.json({ success: true, data: { useCases } });
}