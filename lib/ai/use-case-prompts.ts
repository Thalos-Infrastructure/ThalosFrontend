/**
 * Shared use-case prompt seeds for AI Agreement Draft.
 *
 * Single source of truth for `USE_CASE_PROMPTS`. Import this from:
 * - `app/api/ai/agreement-draft/route.ts`
 * - `components/ai-agreement-engine.tsx`
 */

export const USE_CASE_PROMPTS = [
  "Freelance software development with milestone payments",
  "Content creation (article, video, design) with revision rounds",
  "Consulting services with hourly billing",
  "E-commerce order fulfillment with quality checks",
  "Real estate transaction with legal verification",
  "Import/export with customs clearance milestone",
];

export type UseCasePrompt = (typeof USE_CASE_PROMPTS)[number];
