> **Depends on (hard):** Thalos-Infrastructure/ThalosBackend#140 — GitHub link verification + project-repo PR fetch
> **Depends on:** #__C1__ (profiles), #__C5__ (agreements from opportunities)
> **Priority:** P2 — runs after the C1–C5 loop
> **Campaign:** Thalos Connect · Verified GitHub evidence (proposal §9)

## Task Description
Let a builder link GitHub (verified) and attach **merged PRs scoped to the project's repo** as milestone evidence, so paid work is backed by verifiable authorship.

## Background / Current State
- Milestone evidence is free-text today.
- Social auth is being moved **out** of Supabase → do NOT use Supabase social for this. The GitHub token lives **server-side in Nest** (BE#140).
- Scope PRs to the **project repo** (`repo:ORG/REPO author:USER is:pr is:merged`), not a generic `author:USER` query (weak evidence).

## Deliverable
A verified GitHub link + a picker listing the builder's merged PRs in the project repo, attachable to a milestone.

## Requirements
- UI to verify GitHub ownership and pick PRs returned by the Nest route (BE#140).
- Render attached PRs on the milestone (and reserve for C7 profile display).
- Token never touches the client.

## Technical Requirements
- All GitHub calls go through Nest; the FE only consumes the Nest route.

## Additional Notes
Proposal Section 9. Testing: PRs attachable only after verified link, list scoped to the project repo, renders with working links. Proof: link FE + BE PRs, recording of link → pick → attach, confirm token is server-only.
