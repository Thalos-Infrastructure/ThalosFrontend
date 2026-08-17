> **Depends on (hard):** Thalos-Infrastructure/ThalosBackend#139 — Applications entity + endpoints
> **Depends on:** #125 (opportunities), #126 (discovery)
> **Campaign:** Thalos Connect · Phase 4 (Opportunity → Agreement)

## Task Description
Close the loop: a builder applies to an opportunity, the project reviews, and on acceptance they spin up a **Thalos Agreement pre-filled from the opportunity**, reusing the existing agreement creation flow (no new on-chain path).

## Background / Current State
- Agreements + milestones + Trustless Work are fully built. The CTA must land in the **existing** `createAgreement` flow, pre-filled — do not fork it.

## Deliverable
Application submit/review UI + a CTA that opens the existing agreement creation pre-filled from an accepted application.

## Requirements
- Builder applies once to an `open` opportunity; duplicate blocked.
- Project lists applicants, accepts/rejects.
- On accept: CTA opens the existing agreement form pre-filled (title, amount/asset, counterparty = builder wallet).
- Opportunity → `filled` when the agreement is created.

## Technical Requirements
- Reuse the existing agreement creation path. Counterparty resolved from the builder's linked wallet.
- Applications data via Nest (BE#139).

## Additional Notes
The moment Connect monetizes via escrow. Testing: full apply → review → accept → pre-filled agreement, duplicate blocked, opportunity flips to `filled`. Proof: link FE + BE PRs, recording of the flow.
