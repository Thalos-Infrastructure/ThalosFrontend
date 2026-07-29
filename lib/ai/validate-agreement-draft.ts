import type { DraftMilestone, DraftRequest } from "./agreement-draft.types";

export interface ValidationResult {
  milestone_sum_match: boolean;
  milestone_sum_error: string | null;
  type_inference: { type: "single" | "multi" | "bounty"; reasoning: string };
  risk_flags: string[];
}

/**
 * Validates milestone amounts sum to the total.
 * Returns {match: true} if no total provided (lenient mode).
 */
export function validateMilestoneSum(
  milestones: DraftMilestone[],
  totalAmount: string
): { match: boolean; error: string | null } {
  const total = parseFloat(totalAmount);
  if (isNaN(total) || total <= 0) return { match: true, error: null };

  const sum = milestones.reduce((acc, m) => {
    const v = parseFloat(m.amount);
    return acc + (isNaN(v) ? 0 : v);
  }, 0);

  // 0.01 rounding tolerance
  if (Math.abs(sum - total) > 0.01) {
    return {
      match: false,
      error: `Milestone amounts sum to ${sum.toFixed(2)}, expected ${total.toFixed(2)}`,
    };
  }
  return { match: true, error: null };
}

/**
 * Infers agreement type from milestones count.
 * - 1 milestone → "single"
 * - > 1 milestone → "multi"
 * - 0 milestones → "single" (default, but validation should reject)
 */
export function inferAgreementType(
  milestones: DraftMilestone[],
  requestedType?: string
): { type: "single" | "multi" | "bounty"; reasoning: string } {
  if (requestedType === "single" || requestedType === "multi" || requestedType === "bounty") {
    return {
      type: requestedType,
      reasoning: `User explicitly specified ${requestedType} type.`,
    };
  }

  if (milestones.length <= 1) {
    return {
      type: "single",
      reasoning: `${milestones.length} milestone(s) detected — single-payment agreement.`,
    };
  }

  return {
    type: "multi",
    reasoning: `${milestones.length} milestones detected — multi-milestone agreement.`,
  };
}

/**
 * Flags potential risks in the agreement structure.
 * Minimum rules per issue requirements:
 * 1. Missing amount (empty or zero)
 * 2. Missing deliverable/condition (vague description)
 * 3. Single lump-sum with no release condition
 * 4. Deadline present in text but not captured as a milestone
 */
export function flagRisks(
  milestones: DraftMilestone[],
  totalAmount: string,
  promptText: string
): string[] {
  const flags: string[] = [];

  // 1. Missing amount
  const missingAmounts = milestones.filter(
    (m) => !m.amount || parseFloat(m.amount) <= 0 || isNaN(parseFloat(m.amount))
  );
  if (missingAmounts.length > 0) {
    flags.push(
      `${missingAmounts.length} milestone(s) have missing or invalid amounts.`
    );
  }

  // 2. Missing deliverable/condition (vague description)
  const vaguePatterns = /^(phase|step|milestone|part|stage|payment)\s*\d*$/i;
  const vague = milestones.filter((m) => vaguePatterns.test(m.description.trim()));
  if (vague.length > 0) {
    flags.push(
      `${vague.length} milestone(s) have vague descriptions — specific deliverables or conditions reduce dispute risk.`
    );
  }

  // 3. Single lump-sum with no release condition
  if (milestones.length === 1) {
    const desc = milestones[0].description.toLowerCase();
    const hasCondition =
      /after|upon|when|delivery|deliver|complete|sign|transfer|confirm|approv|receiv|inspect/.test(
        desc
      );
    if (!hasCondition) {
      flags.push(
        "Single lump-sum payment with no explicit release condition — funds may release without verification."
      );
    }
  }

  // 4. Deadline present in text but not captured as a milestone
  const deadlinePatterns =
    /(?:by|before|after|on|until)\s+(\d{1,2}(?:st|nd|rd|th)?\s+\w+|\w+\s+\d{1,2}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2})/gi;
  const deadlines = promptText.match(deadlinePatterns);
  if (deadlines && deadlines.length > 0) {
    const milestoneText = milestones.map((m) => m.description.toLowerCase()).join(" ");
    const uncaptured = deadlines.filter((d) => {
      const datePart = d.replace(/^(?:by|before|after|on|until)\s+/i, "").toLowerCase();
      return !milestoneText.includes(datePart);
    });
    if (uncaptured.length > 0) {
      flags.push(
        `Deadline(s) found in prompt but not captured in milestones: ${uncaptured.join(", ")}`
      );
    }
  }

  // Additional: front-loaded payment
  if (milestones.length > 1) {
    const total = parseFloat(totalAmount);
    if (total > 0) {
      const firstPct = (parseFloat(milestones[0].amount) / total) * 100;
      if (firstPct > 50) {
        flags.push(
          `Front-loaded: first milestone is ${firstPct.toFixed(0)}% of total — payee receives majority before work completion.`
        );
      }
    }
  }

  // Additional: uneven distribution
  if (milestones.length >= 2) {
    const amounts = milestones
      .map((m) => parseFloat(m.amount))
      .filter((v) => !isNaN(v) && v > 0);
    if (amounts.length >= 2) {
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      if (min > 0 && max / min > 10) {
        flags.push(
          `Uneven distribution: largest milestone is ${(max / min).toFixed(1)}x the smallest — may indicate scope imbalance.`
        );
      }
    }
  }

  return flags;
}

/**
 * Runs all validations on a draft and returns combined result.
 */
export function validateAgreementDraft(
  milestones: DraftMilestone[],
  totalAmount: string,
  promptText: string,
  requestedType?: string
): ValidationResult {
  const sumResult = validateMilestoneSum(milestones, totalAmount);
  const typeResult = inferAgreementType(milestones, requestedType);
  const risks = flagRisks(milestones, totalAmount, promptText);

  return {
    milestone_sum_match: sumResult.match,
    milestone_sum_error: sumResult.error,
    type_inference: typeResult,
    risk_flags: risks,
  };
}
