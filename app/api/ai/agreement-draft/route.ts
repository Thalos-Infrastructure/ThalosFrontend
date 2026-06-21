import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";

// Since we don't have a specific AI provider configured, we'll create a mock response
// In a real implementation, you'd configure a provider like OpenAI, Anthropic, etc.

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
    const { userInput, useCases } = await request.json();

    // Mock AI response for demonstration
    // In a real scenario, you'd use generateObject with a proper AI provider
    const mockDraft = {
      title: "AI Generated Agreement",
      description: userInput,
      amount: "1000",
      asset: "USDC" as const,
      agreement_type: "single" as const,
      milestones: [
        {
          description: "Full delivery",
          amount: "1000",
          status: "pending" as const,
        },
      ],
      metadata: {
        generatedByAI: true,
        riskFlags: ["Consider adding specific deliverables"],
        useCase: "other",
      },
    };

    // Validate the mock draft
    const validatedDraft = AgreementDraftSchema.parse(mockDraft);

    return NextResponse.json(validatedDraft);
  } catch (error) {
    console.error("Error generating agreement draft:", error);
    return NextResponse.json(
      { error: "Failed to generate agreement draft" },
      { status: 500 }
    );
  }
}
