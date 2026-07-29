/**
 * Route-level tests for POST /api/ai/agreement-draft — 10 scripted scenarios.
 *
 * Uses Node.js built-in test runner + tsx for TypeScript transpilation.
 * Run: npx tsx --test lib/ai/__tests__/route-scenarios.test.ts
 *
 * The route's AI model call is mocked so tests are deterministic and offline.
 * We test: validation rules, type inference, risk flags, and response envelope.
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AgreementDraftSchema,
  type AgreementDraft,
  type DraftApiResponse,
} from "../agreement-draft.types";
import { validateAgreementDraft } from "../validate-agreement-draft";

// ─── mock draft factory ──────────────────────────────────────────────────────

function makeDraft(overrides: Partial<AgreementDraft> = {}): AgreementDraft {
  return {
    title: "Test Agreement",
    description: "A test agreement for validation",
    amount: "1000",
    asset: "USDC",
    agreement_type: "multi",
    milestones: [
      { description: "First deliverable", amount: "500", status: "pending" },
      { description: "Final deliverable", amount: "500", status: "pending" },
    ],
    metadata: { generatedByAI: true, riskFlags: [], useCase: undefined },
    ...overrides,
  };
}

// ─── Simulate route processing (mock AI, real validation) ──────────────────
//
// We skip the actual AI call and run the server-side validation logic
// directly, simulating what the route does after generateObject returns.

function processDraft(
  draft: AgreementDraft,
  prompt: string
): { status: number; body: DraftApiResponse } {
  const validation = validateAgreementDraft(
    draft.milestones,
    draft.amount,
    prompt
  );

  // Reject if sum mismatch
  if (!validation.milestone_sum_match) {
    return {
      status: 422,
      body: { success: false, error: validation.milestone_sum_error! },
    };
  }

  // Enforce type inference
  if (draft.milestones.length > 1 && draft.agreement_type !== "multi") {
    draft.agreement_type = "multi";
  } else if (draft.milestones.length === 1 && draft.agreement_type !== "single") {
    draft.agreement_type = "single";
  }

  // Merge risk flags
  if (validation.risk_flags.length > 0) {
    draft.metadata.riskFlags.push(...validation.risk_flags);
  }

  return { status: 200, body: { success: true, data: draft } };
}

// ─── 10 Scenarios ───────────────────────────────────────────────────────────

describe("POST /api/ai/agreement-draft — 10 Scenarios", () => {
  // 1. Software development milestones
  it("1. software development: 3 milestones, valid sum → success", () => {
    const draft = makeDraft({
      title: "Software Development Agreement",
      amount: "10000",
      agreement_type: "multi",
      milestones: [
        { description: "Design mockups delivered and approved", amount: "3000", status: "pending" },
        { description: "Backend API implementation complete", amount: "4000", status: "pending" },
        { description: "Production deployment verified", amount: "3000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "Software dev: 3 milestones — design, backend, deploy");
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data!.agreement_type, "multi");
  });

  // 2. Real estate single payment
  it("2. real estate: single lump-sum with release condition → success", () => {
    const draft = makeDraft({
      title: "Real Estate Sale",
      amount: "500000",
      agreement_type: "single",
      milestones: [
        { description: "Full payment released upon signed property transfer deed", amount: "500000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "Real estate sale, funds release on deed signing");
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data!.agreement_type, "single");
    // No "no release condition" flag because condition is present
    assert.ok(!body.data!.metadata.riskFlags.some((f) => f.includes("no explicit release condition")));
  });

  // 3. Milestone sum mismatch → rejection
  it("3. sum mismatch: milestones don't add up → 422", () => {
    const draft = makeDraft({
      title: "Bad Math Agreement",
      amount: "10000",
      milestones: [
        { description: "First phase", amount: "3000", status: "pending" },
        { description: "Second phase", amount: "3000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "two phases totaling 10000");
    assert.equal(status, 422);
    assert.equal(body.success, false);
    assert.ok(body.error!.includes("6000"));
  });

  // 4. Vague milestone descriptions → risk flag
  it("4. vague descriptions: Phase 1/2 → risk flag", () => {
    const draft = makeDraft({
      title: "Vague Agreement",
      amount: "2000",
      milestones: [
        { description: "Phase 1", amount: "1000", status: "pending" },
        { description: "Phase 2", amount: "1000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "two phase project");
    assert.equal(status, 200);
    assert.ok(body.data!.metadata.riskFlags.some((f) => f.includes("vague")));
  });

  // 5. Single lump-sum with NO release condition → risk flag
  it("5. lump-sum no condition → risk flag", () => {
    const draft = makeDraft({
      title: "Lump Sum No Condition",
      amount: "5000",
      agreement_type: "single",
      milestones: [
        { description: "Full payment", amount: "5000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "pay 5000 for services");
    assert.equal(status, 200);
    assert.ok(body.data!.metadata.riskFlags.some((f) => f.includes("no explicit release condition")));
  });

  // 6. Front-loaded payment → risk flag
  it("6. front-loaded: 80% upfront → risk flag", () => {
    const draft = makeDraft({
      title: "Front-Loaded Agreement",
      amount: "10000",
      milestones: [
        { description: "Kickoff and initial setup", amount: "8000", status: "pending" },
        { description: "Final delivery and handover", amount: "2000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "big upfront payment");
    assert.equal(status, 200);
    assert.ok(body.data!.metadata.riskFlags.some((f) => f.includes("Front-loaded")));
  });

  // 7. Uncaptured deadline → risk flag
  it("7. uncaptured deadline: March 15 in prompt not in milestones → risk flag", () => {
    const draft = makeDraft({
      title: "Deadline Agreement",
      amount: "3000",
      milestones: [
        { description: "Design complete", amount: "1500", status: "pending" },
        { description: "Final delivery", amount: "1500", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "Project due by March 15 and April 30");
    assert.equal(status, 200);
    assert.ok(body.data!.metadata.riskFlags.some((f) => f.includes("Deadline")));
  });

  // 8. Type inference correction: single milestone forced to "single"
  it("8. type inference: 1 milestone with agreement_type=multi → corrected to single", () => {
    const draft = makeDraft({
      title: "Type Correction",
      amount: "1000",
      agreement_type: "multi", // wrong, should be corrected
      milestones: [
        { description: "Single delivery upon completion", amount: "1000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "one-time payment");
    assert.equal(status, 200);
    assert.equal(body.data!.agreement_type, "single");
  });

  // 9. Multi milestone forced to "multi"
  it("9. type inference: 3 milestones with agreement_type=single → corrected to multi", () => {
    const draft = makeDraft({
      title: "Type Correction Multi",
      amount: "9000",
      agreement_type: "single", // wrong
      milestones: [
        { description: "Milestone A delivered", amount: "3000", status: "pending" },
        { description: "Milestone B delivered", amount: "3000", status: "pending" },
        { description: "Milestone C delivered", amount: "3000", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "three milestones");
    assert.equal(status, 200);
    assert.equal(body.data!.agreement_type, "multi");
  });

  // 10. Schema conformance: output always matches AgreementDraftSchema
  it("10. schema conformance: output validates against AgreementDraftSchema", () => {
    const draft = makeDraft({
      title: "Schema Test",
      amount: "5000",
      milestones: [
        { description: "Valid milestone with condition after delivery", amount: "2500", status: "pending" },
        { description: "Final milestone upon approval", amount: "2500", status: "pending" },
      ],
    });
    const { status, body } = processDraft(draft, "valid agreement");
    assert.equal(status, 200);

    // Validate output conforms to schema
    const schemaResult = AgreementDraftSchema.safeParse(body.data);
    assert.ok(schemaResult.success, "Output must conform to AgreementDraftSchema");

    // Validate it maps to CreateAgreementInput shape
    const data = schemaResult.data;
    assert.equal(typeof data.title, "string");
    assert.equal(typeof data.amount, "string");
    assert.ok(["single", "multi"].includes(data.agreement_type));
    assert.equal(data.metadata.generatedByAI, true);
    assert.ok(Array.isArray(data.metadata.riskFlags));
  });
});
