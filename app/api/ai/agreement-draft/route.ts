import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";

import {
  DraftRequestSchema,
  AgreementDraftSchema,
  type AgreementDraft,
  type DraftApiResponse,
} from "@/lib/ai/agreement-draft.types";
import { validateAgreementDraft } from "@/lib/ai/validate-agreement-draft";

const USE_CASE_PROMPTS = [
  "Real Estate Sale: Buyer reserves house, funds locked until legal documents signed.",
  "Agriculture Pre-Sale: Distributor locks payment for harvest, releases on delivery confirmation.",
  "Event Management: Client pays in milestones — deposit, venue confirmation, event completion.",
  "Car Dealership: Buyer secures car, funds release on ownership transfer.",
  "Software Development: 3 milestones — design, backend, deployment.",
  "Import / Export: Funds locked until shipment clears customs.",
  "Online Coaching: Payments unlock after each session milestone.",
];

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

export async function POST(req: Request) {
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

    // Call AI model via Vercel AI SDK with generateObject
    const { object: draft } = await generateObject({
      model: "openai/gpt-4o-mini",
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
    const inferred = validation.type_inference.type;
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
