import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { verifyToken } from "@/lib/auth";

// Real AI provider configuration: OpenAI

const AgreementDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  amount: z.string(),
  asset: z.literal("USDC"),
  agreement_type: z.union([z.literal("single"), z.literal("multi")]),
  milestones: z.array(
    z.object({
      description: z.string(),
      amount: z.string(),
      status: z.literal("pending"),
    })
  ),
  metadata: z.object({
    generatedByAI: z.literal(true),
    riskFlags: z.array(z.string()),
    useCase: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid JWT token" }, { status: 401 });
    }

    // Parse user input
    const { title, description, amount, milestones, useCase } = await request.json();

    // Build prompt for AI
    const prompt = `Generate an agreement draft with the following details:\nTitle: ${title}\nDescription: ${description}\nAmount: ${amount}\nUse case: ${useCase ?? "N/A"}\nMilestones: ${JSON.stringify(milestones)}`;

    // Generate draft using OpenAI
    const { object: aiDraft } = await generateObject({
      model: openai("gpt-4o"),
      schema: AgreementDraftSchema,
      prompt,
    });

    // Validate draft (schema already validated)
    const validatedDraft = AgreementDraftSchema.parse(aiDraft);

    return NextResponse.json(validatedDraft);
  } catch (error) {
    console.error("Error generating agreement draft:", error);
    return NextResponse.json(
      { error: "Failed to generate agreement draft" },
      { status: 500 }
    );
  }
}
