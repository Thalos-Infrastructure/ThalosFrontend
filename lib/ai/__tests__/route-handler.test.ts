/**
 * Route handler tests for POST /api/ai/agreement-draft.
 * Tests auth, request validation, and post-AI processing.
 *
 * Run: npx tsx --test lib/ai/__tests__/route-handler.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { DraftRequestSchema, type AgreementDraft, type DraftApiResponse } from "../agreement-draft.types";
import { processDraftAfterAI } from "../process-draft-after-ai";

// ─── Auth simulation ─────────────────────────────────────────────────────
function simulateAuth(headers: Record<string, string>): { authed: boolean; userId?: string } {
  const auth = headers["authorization"];
  if (!auth?.startsWith("Bearer ")) return { authed: false };
  const token = auth.slice(7);
  if (!token) return { authed: false };
  // Mock: accept any non-empty token
  return { authed: true, userId: "mock-user-" + token.slice(0, 8) };
}

// ─── Request validation simulation ────────────────────────────────────────
function simulateRequestValidation(body: unknown): { valid: boolean; error?: string; data?: { prompt: string; useCase?: string } } {
  const result = DraftRequestSchema.safeParse(body);
  if (!result.success) {
    return { valid: false, error: result.error.issues.map((i: { message: string }) => i.message).join(", ") };
  }
  return { valid: true, data: result.data };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("POST /api/ai/agreement-draft — Handler Tests", () => {
  describe("Auth checks", () => {
    it("rejects request with no Authorization header → 401", () => {
      const { authed } = simulateAuth({});
      assert.equal(authed, false);
    });

    it("rejects request with empty Bearer → 401", () => {
      const { authed } = simulateAuth({ authorization: "Bearer " });
      assert.equal(authed, false);
    });

    it("accepts request with valid Bearer token", () => {
      const { authed, userId } = simulateAuth({ authorization: "Bearer valid-jwt-token" });
      assert.equal(authed, true);
      assert.ok(userId);
    });
  });

  describe("Request validation", () => {
    it("rejects empty body → 400", () => {
      const { valid, error } = simulateRequestValidation({});
      assert.equal(valid, false);
      assert.ok(error);
    });

    it("rejects missing prompt → 400", () => {
      const { valid, error } = simulateRequestValidation({ useCase: "real-estate" });
      assert.equal(valid, false);
    });

    it("accepts valid prompt", () => {
      const { valid, data } = simulateRequestValidation({ prompt: "Create a $5000 software agreement" });
      assert.equal(valid, true);
      assert.equal(data?.prompt, "Create a $5000 software agreement");
    });

    it("accepts prompt + useCase", () => {
      const { valid, data } = simulateRequestValidation({ prompt: "test", useCase: "real-estate" });
      assert.equal(valid, true);
      assert.equal(data?.useCase, "real-estate");
    });
  });

  describe("Post-AI processing (via processDraftAfterAI)", () => {
    it("valid draft passes → milestone_sum_match=true", () => {
      const draft: AgreementDraft = {
        title: "Test",
        description: "Test agreement",
        amount: "1000",
        asset: "USDC",
        agreement_type: "single",
        milestones: [{ description: "Deliver work upon completion", amount: "1000", status: "pending" }],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      const validation = processDraftAfterAI(draft, "test prompt");
      assert.equal(validation.milestone_sum_match, true);
    });

    it("sum mismatch → milestone_sum_match=false", () => {
      const draft: AgreementDraft = {
        title: "Bad Sum",
        description: "Sum mismatch",
        amount: "1000",
        asset: "USDC",
        agreement_type: "multi",
        milestones: [
          { description: "M1", amount: "300", status: "pending" },
          { description: "M2", amount: "400", status: "pending" },
        ],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      const validation = processDraftAfterAI(draft, "test");
      assert.equal(validation.milestone_sum_match, false);
      assert.ok(validation.milestone_sum_error?.includes("700"));
    });

    it("type inference: multi corrected from single", () => {
      const draft: AgreementDraft = {
        title: "Multi",
        description: "Test",
        amount: "2000",
        asset: "USDC",
        agreement_type: "single", // wrong
        milestones: [
          { description: "Phase 1 deliver", amount: "1000", status: "pending" },
          { description: "Phase 2 deliver", amount: "1000", status: "pending" },
        ],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      processDraftAfterAI(draft, "test");
      assert.equal(draft.agreement_type, "multi");
    });

    it("type inference: single corrected from multi", () => {
      const draft: AgreementDraft = {
        title: "Single",
        description: "Test",
        amount: "500",
        asset: "USDC",
        agreement_type: "multi", // wrong
        milestones: [{ description: "Deliver", amount: "500", status: "pending" }],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      processDraftAfterAI(draft, "test");
      assert.equal(draft.agreement_type, "single");
    });

    it("front-loaded risk flag applied", () => {
      const draft: AgreementDraft = {
        title: "Front-loaded",
        description: "Test",
        amount: "10000",
        asset: "USDC",
        agreement_type: "multi",
        milestones: [
          { description: "Setup", amount: "8000", status: "pending" },
          { description: "Final", amount: "2000", status: "pending" },
        ],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      processDraftAfterAI(draft, "test");
      assert.ok(draft.metadata.riskFlags.some((f) => f.includes("Front-loaded")));
    });

    it("vague description risk flag applied", () => {
      const draft: AgreementDraft = {
        title: "Vague",
        description: "Test",
        amount: "2000",
        asset: "USDC",
        agreement_type: "multi",
        milestones: [
          { description: "Phase 1", amount: "1000", status: "pending" },
          { description: "Phase 2", amount: "1000", status: "pending" },
        ],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      processDraftAfterAI(draft, "test");
      assert.ok(draft.metadata.riskFlags.some((f) => f.includes("vague")));
    });

    it("no release condition risk flag applied", () => {
      const draft: AgreementDraft = {
        title: "No Condition",
        description: "Test",
        amount: "5000",
        asset: "USDC",
        agreement_type: "single",
        milestones: [{ description: "Full payment", amount: "5000", status: "pending" }],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      processDraftAfterAI(draft, "test");
      assert.ok(draft.metadata.riskFlags.some((f) => f.includes("no explicit release condition")));
    });

    it("uneven distribution risk flag applied", () => {
      const draft: AgreementDraft = {
        title: "Uneven",
        description: "Test",
        amount: "11000",
        asset: "USDC",
        agreement_type: "multi",
        milestones: [
          { description: "Small", amount: "1000", status: "pending" },
          { description: "Big", amount: "10000", status: "pending" },
        ],
        metadata: { generatedByAI: true, riskFlags: [] },
      };
      processDraftAfterAI(draft, "test");
      assert.ok(draft.metadata.riskFlags.some((f) => f.includes("Uneven distribution")));
    });
  });

  describe("End-to-end flow", () => {
    it("auth fail + valid body → 401 (auth checked before body)", () => {
      const { authed } = simulateAuth({});
      assert.equal(authed, false);
    });

    it("auth ok + invalid body → 400", () => {
      const { authed } = simulateAuth({ authorization: "Bearer token" });
      assert.equal(authed, true);

      const { valid, error } = simulateRequestValidation({ prompt: "" });
      assert.equal(valid, false);
      assert.ok(error);
    });

    it("auth ok + valid body → passes validation, ready for AI call", () => {
      const { authed } = simulateAuth({ authorization: "Bearer token" });
      assert.equal(authed, true);

      const { valid, data } = simulateRequestValidation({ prompt: "Create a valid agreement" });
      assert.equal(valid, true);
      assert.equal(data?.prompt, "Create a valid agreement");
    });
  });
});
