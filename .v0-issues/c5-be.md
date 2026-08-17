## Task Description

Add backend support for **Applications** to Opportunities: a builder applies, the Project reviews and accepts/rejects. On acceptance, the frontend spins up an existing Thalos Agreement pre-filled from the opportunity — this issue provides the application data + endpoints only (no new on-chain path).

## Deliverable

Applications entity + endpoints for apply / list applicants / accept / reject.

## Requirements

- Entity/fields: `id`, `opportunity_id`, `builder_id`, `message`, `status` (`pending|accepted|rejected`), `created_at`.
- `POST` apply — one application per (opportunity, builder); duplicate blocked.
- `GET` applicants for an opportunity (owning Project only).
- `PATCH` accept/reject (owning Project only).
- When an agreement is created for an accepted application, support marking the opportunity `filled`.

## Technical Requirements

- Follow existing Nest module + authorization patterns.
- Do NOT create a new agreement/on-chain path — the FE reuses the existing agreement creation flow. This issue only exposes application data.
- Standard response envelope.

## Additional Notes

- Phase 4 of the Thalos Connect proposal — the point Connect monetizes via existing escrow.

## Testing

- [ ] Apply once; duplicate blocked.
- [ ] Owner-only list/accept/reject; authorization enforced.
- [ ] Opportunity can transition to `filled`.

## Proof of Completion

- [ ] Link the merged PR (`Closes #<this issue>`).
- [ ] Paste the endpoint contract.

---
_Frontend counterpart: Thalos-Infrastructure/ThalosFrontend (C5 — FE). This issue **blocks** it._
