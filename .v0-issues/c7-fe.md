> **Depends on:** #__C1__ (profiles), #__C6__ (verified GitHub), #__C2__ (public profile)
> **Priority:** P2
> **Campaign:** Thalos Connect · Phase 5 (Reputation)

## Task Description
Give profiles a lightweight, honest reputation layer: completed agreements, released milestones, a verified-GitHub badge, and PR-backed milestone count — the trust signal that differentiates Thalos Connect.

## Deliverable
A reputation summary shown on the private profile and the public showcase (C2).

## Requirements
- Aggregate per builder from real data: completed agreements, released milestones, total value released (opt-in), verified-GitHub badge, PR-backed milestone count.
- Read-only, computed from real data (no manual editing → no fake reputation).
- Render on both the authed profile and `/connect/[handle]`.
- Respect privacy: value/earnings display is opt-in.

## Technical Requirements
- Compute server-side via `lib/api` from existing agreement/milestone queries scoped to the builder; avoid N+1.

## Additional Notes
Minimal and truthful for this stage; richer scoring comes later. Testing: counts match seeded data, badge tied to real verification, opt-in value respected. Proof: link PR + screenshot on private + public profile.
