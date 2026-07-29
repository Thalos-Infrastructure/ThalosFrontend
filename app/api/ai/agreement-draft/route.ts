import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

import {
  DraftRequestSchema,
  AgreementDraftSchema,
  type AgreementDraft,
  type DraftApiResponse,
} from "@/lib/ai/agreement-draft.types";
import { validateAgreementDraft } from "@/lib/ai/validate-agreement-draft";
import { verifyToken } from "@/lib/auth/utils";

// Shared use-case prompts (extracted from components/use-cases.tsx)
const USE_CASE_PROMPTS = [
  "Real Estate Sale: Buyer reserves house, funds locked until legal documents signed.",
  "Agriculture Pre-Sale: Distributor locks payment for harvest, releases on delivery confirmation.",
  "Event Management: Client pays in milestones — deposit, venue confirmation, event completion.",
  "Car Dealership: Buyer secures car, funds release on ownership transfer.",
  "Software Development: 3 milestones — design, backend, deployment.",
  "Import / Export: Funds locked until shipment clears customs.",
  "Online Coaching: Payments unlock after each session milestone.",
];

// Simple in-memory rate limiter (for demo; use Redis/Upstash in production)
const RATE_LIMIT = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 20;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = RATE_LIMIT.get(userId);

  if (!record || now > record.resetTime) {
    // New window
    RATE_LIMIT.set(userId, { count: 1, resetTime: now + 60 * 60 * 1000 });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
}

function buildSystemPrompt(): string {
  return `You are a specialized agreement draft engine for Thalos, a blockchain-based escrow platform.

## Your Task
Turn a natural-language deal description into a structured agreement draft with milestones.

## Key Rules
- Milestone amounts MUST sum exactly to the total amount. Use exact numbers, not ranges.
- Agreement type is "single" if exactly 1 milestone, "multi" if > 1.
- Milestone descriptions must be specific deliverables or conditions, not generic labels like "Phase 1".
- Include at least one risk flag when an applicable condition is missing.
- Asset defaults to "USDC".
- Dates in the prompt should be captured as milestone conditions.

## Example Use-Cases
${USE_CASE_PROMPTS.join("\n")}

## Output Format
Return a JSON object with:
- title (string, required)
- description (string)
- amount (string, total amount in numbers)
- asset ("USDC")
- agreement_type ("single" | "multi")
- milestones (array of { description, amount, status: "pending" })
- metadata ({ generatedByAI: true, riskFlags: string[], useCase?: string })

Do NOT include markdown code blocks or explanations. Return ONLY the JSON object.`;
}

// Create OpenAI-compatible provider. Supports:
// - OPENAI_API_KEY env var (direct OpenAI)
// - Vercel AI Gateway via OPENAI_BASE_URL
function getOpenAIProvider() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

const MODEL_ID = process.env.AI_MODEL_ID || "gpt-4o-mini";

export async function POST(req: Request) {
  // 1. Auth check
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    const resp: DraftApiResponse = {
      success: false,
      error: "Missing authentication token",
    };
    return NextResponse.json(resp, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    const resp: DraftApiResponse = {
      success: false,
      error: "Invalid or expired token",
    };
    return NextResponse.json(resp, { status: 401 });
  }

  const userId = payload.sub as string;

  // 2. Rate limiting
  if (!checkRateLimit(userId)) {
    const resp: DraftApiResponse = {
      success: false,
      error: "Rate limit exceeded. Maximum 20 requests per hour.",
    };
    return NextResponse.json(resp, { status: 429 });
  }

  try {
    const body = await req.json();
    const parseResult = DraftRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const resp: DraftApiResponse = {
        success: false,
        error: `Invalid request: ${parseResult.error.issues.map((i) => i.message).join(", ")}`,
      };
      return NextResponse.json(resp, { status: 400 });
    }

    const request = parseResult.data;

    // Optional: prompt length check to prevent abuse
    if (request.prompt.length > 5000) {
      const resp: DraftApiResponse = {
        success: false,
        error: "Prompt too long. Maximum 5000 characters.",
      };
      return NextResponse.json(resp, { status: 400 });
    }

    const provider = getOpenAIProvider();

    // Call AI model via Vercel AI SDK with generateObject
    const { object: draft } = await generateObject({
      model: provider(MODEL_ID),
      schema: AgreementDraftSchema,
      prompt: `Generate an agreement draft for: ${request.prompt}${request.useCase ? `\nUse-case context: ${request.useCase}` : ""}`,
      system: buildSystemPrompt(),
    });

    // Server-side validation as safety net
    const validation = validateAgreementDraft(
      draft.milestones,
      draft.amount,
      request.prompt
    );

    // Reject if milestone sum doesn't match
    if (!validation.milestone_sum_match) {
      const resp: DraftApiResponse = {
        success: false,
        error: validation.milestone_sum_error || "Milestone amounts do not sum to total",
      };
      return NextResponse.json(resp, { status: 422 });
    }

    // Enforce type inference rule: multi if milestones > 1
    if (draft.milestones.length > 1 && draft.agreement_type !== "multi") {
      draft.agreement_type = "multi";
    } else if (draft.milestones.length === 1 && draft.agreement_type !== "single") {
      draft.agreement_type = "single";
    }

    // Merge risk flags from validation into metadata
    if (validation.risk_flags.length > 0) {
      draft.metadata.riskFlags.push(...validation.risk_flags);
    }

    const resp: DraftApiResponse = { success: true, data: draft };
    return NextResponse.json(resp);
  } catch (error) {
    console.error("AI agreement draft error:", error);
    const resp: DraftApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate agreement draft",
    };
    return NextResponse.json(resp, { status: 500 });
  }
}
