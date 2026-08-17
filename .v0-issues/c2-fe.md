> **Depends on:** #__C1__ (Builder & Project profiles)
> **Campaign:** Thalos Connect · Phases 1–2 (Public showcase)

## Task Description
Build a read-only public page that renders a Builder/Project profile by `handle` — the shareable card a builder sends to get traction.

## Deliverable
`app/connect/[handle]/page.tsx`, server-rendered from Nest by `handle`.

## Requirements
- Fetch the profile server-side via `lib/api/profiles.ts` by `handle` (no auth to view).
- Builder view: headline, bio, skills, stack, availability, portfolio/social links.
- Project view: org info, website, `looking_for`.
- Reserve slots for reputation (C7) and verified GitHub (C6); render only if present.
- SEO metadata per profile; clean 404 for unknown handle.

## Technical Requirements
- RSC fetch only (no client fetching).
- Expose public-safe fields only (never email/KYB).

## Additional Notes
Read-only. Testing: renders both profile types, 404 for missing handle, metadata present. Proof: link PR + screenshots + a live preview handle.
