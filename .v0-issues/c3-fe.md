> **Depends on (hard):** Thalos-Infrastructure/ThalosBackend#138 — Opportunities entity + endpoints
> **Depends on:** #123 (profiles)
> **Campaign:** Thalos Connect · Phase 2 (Opportunities)

## Task Description
Let Project profiles publish **Opportunities**. **Decision required up front:** extend the existing `bounties` feature or create a new `opportunities` entity — do not create a second parallel marketplace by accident. Record the decision in the first comment before building.

## Background / Current State
- `bounties` already exists in production (`app/dashboard/bounties/page.tsx`) with a publish + submissions/review pattern.
- Recommendation: **extend bounties** unless the data models diverge enough to justify a new table.

## Deliverable
Opportunities publishing + owner listing, reusing bounties where possible, backed by Nest (BE#138).

## Requirements
- Create/edit form for Project owners; owner dashboard listing with status controls (`open|closed|filled`).
- Public read of `open` only.
- Fields (mirror BE#138): `title`, `description`, `skills_required[]`, `budget_amount`, `budget_asset` (default USDC), `engagement_type` (`fixed|milestone|hourly`), `status`.

## Technical Requirements
- Talk to Nest via `lib/api`; no direct Supabase writes.

## Additional Notes
The bounties-vs-new-table decision MUST be settled in the first comment. Testing: CRUD + status transitions, owner-only edit, public read of `open`. Proof: link FE + BE PRs, screenshot of form + owner list, note the decision taken.
