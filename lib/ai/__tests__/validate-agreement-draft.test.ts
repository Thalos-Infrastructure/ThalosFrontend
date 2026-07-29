/**
 * Unit tests for AI agreement draft validation.
 * Run with: npx tsx --test lib/ai/__tests__/validate-agreement-draft.test.ts
 * (or: node --import tsx --test lib/ai/__tests__/validate-agreement-draft.test.ts)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateMilestoneSum,
  inferAgreementType,
  flagRisks,
  validateAgreementDraft,
} from "../validate-agreement-draft";
import type { DraftMilestone } from "../agreement-draft.types";

// ─── helpers ────────────────────────────────────────────────────────────────

function ms(description: string, amount: string): DraftMilestone {
  return { description, amount, status: "pending" };
}

// ─── 1. Milestone sum rule ──────────────────────────────────────────────────

describe("validateMilestoneSum", () => {
  it("passes when milestones sum to total", () => {
    const milestones = [ms("Design", "300"), ms("Build", "400"), ms("Deploy", "300")];
    const r = validateMilestoneSum(milestones, "1000");
    assert.equal(r.match, true);
    assert.equal(r.error, null);
  });

  it("fails when milestones under-sum", () => {
    const milestones = [ms("A", "100"), ms("B", "200")];
    const r = validateMilestoneSum(milestones, "500");
    assert.equal(r.match, false);
    assert.ok(r.error?.includes("300"));
  });

  it("fails when milestones over-sum", () => {
    const milestones = [ms("A", "600"), ms("B", "600")];
    const r = validateMilestoneSum(milestones, "1000");
    assert.equal(r.match, false);
  });

  it("allows 0.01 rounding tolerance", () => {
    // 33.33 * 3 = 99.99, close enough to 100
    const milestones = [ms("A", "33.33"), ms("B", "33.33"), ms("C", "33.34")];
    const r = validateMilestoneSum(milestones, "100");
    assert.equal(r.match, true);
  });

  it("treats empty total as lenient pass", () => {
    const milestones = [ms("A", "100")];
    const r = validateMilestoneSum(milestones, "0");
    assert.equal(r.match, true);
  });
});

// ─── 2. Type inference ──────────────────────────────────────────────────────

describe("inferAgreementType", () => {
  it("infers single for 1 milestone", () => {
    const r = inferAgreementType([ms("Full payment on delivery", "5000")]);
    assert.equal(r.type, "single");
  });

  it("infers multi for 2+ milestones", () => {
    const r = inferAgreementType([
      ms("Design", "1000"),
      ms("Build", "2000"),
      ms("Deploy", "1000"),
    ]);
    assert.equal(r.type, "multi");
  });

  it("respects explicit requested type", () => {
    const r = inferAgreementType([ms("X", "100")], "bounty");
    assert.equal(r.type, "bounty");
  });

  it("defaults single for empty milestones", () => {
    const r = inferAgreementType([]);
    assert.equal(r.type, "single");
  });
});

// ─── 3. Risk flag rules ─────────────────────────────────────────────────────

describe("flagRisks", () => {
  it("flags missing amounts", () => {
    const flags = flagRisks([ms("Work", "0"), ms("Done", "100")], "100", "do work");
    assert.ok(flags.some((f) => f.includes("missing or invalid amounts")));
  });

  it("flags vague milestone descriptions", () => {
    const flags = flagRisks(
      [ms("Phase 1", "500"), ms("Phase 2", "500")],
      "1000",
      "two phases"
    );
    assert.ok(flags.some((f) => f.includes("vague")));
  });

  it("flags single lump-sum with no release condition", () => {
    const flags = flagRisks(
      [ms("Full payment", "10000")],
      "10000",
      "pay 10000 for the house"
    );
    assert.ok(flags.some((f) => f.includes("no explicit release condition")));
  });

  it("does NOT flag single lump-sum when condition present", () => {
    const flags = flagRisks(
      [ms("Full payment upon delivery of goods", "10000")],
      "10000",
      "pay 10000 upon delivery"
    );
    assert.ok(!flags.some((f) => f.includes("no explicit release condition")));
  });

  it("flags uncaptured deadlines from prompt", () => {
    const flags = flagRisks(
      [ms("Design complete", "500"), ms("Final delivery", "500")],
      "1000",
      "Software project, design by March 15, final by April 30"
    );
    assert.ok(flags.some((f) => f.includes("Deadline")));
  });

  it("flags front-loaded payments", () => {
    const flags = flagRisks(
      [ms("Kickoff", "8000"), ms("Final", "2000")],
      "10000",
      "big upfront"
    );
    assert.ok(flags.some((f) => f.includes("Front-loaded")));
  });
});

// ─── 4. Full validation pipeline ────────────────────────────────────────────

describe("validateAgreementDraft", () => {
  it("returns combined result for valid multi-milestone draft", () => {
    const milestones = [
      ms("Design mockups delivered", "300"),
      ms("Backend API complete", "400"),
      ms("Production deployment", "300"),
    ];
    const r = validateAgreementDraft(milestones, "1000", "software project");
    assert.equal(r.milestone_sum_match, true);
    assert.equal(r.type_inference.type, "multi");
  });

  it("rejects sum mismatch", () => {
    const milestones = [ms("Only one", "100")];
    const r = validateAgreementDraft(milestones, "500", "pay 500");
    assert.equal(r.milestone_sum_match, false);
  });
});
