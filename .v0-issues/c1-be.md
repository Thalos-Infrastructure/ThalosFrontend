## Task Description

Add **Builder** and **Project** profile fields to the Nest `profiles` domain and expose them through the `/profiles` API, as the canonical source of truth for Thalos Connect. Profiles must NOT be written from the frontend directly to Supabase — this endpoint is what the FE consumes.

A single account can be **both** Builder and Project (types are additive, not mutually exclusive).

## Deliverable

A migration + `/profiles` endpoints supporting the new Builder/Project fields, returned with the standard response envelope.

## Requirements

- Migration adding the following nullable, backward-compatible columns:
  - **Builder:** `headline`, `bio`, `skills` (array), `tech_stack` (array), `hourly_rate`, `availability` (`available|open|unavailable`), `portfolio_links` (jsonb), `social_links` (jsonb), `handle` (unique, URL-safe slug).
  - **Project:** `org_name`, `org_description`, `org_website`, `looking_for` (array), `org_links` (jsonb).
- `GET /profiles/:id` (and/or `/profiles/me`) returns the new fields.
- `PATCH /profiles` accepts and persists the new fields.
- `handle` is unique and validated as URL-safe (consumed by the public profile page on FE).
- Enforce that the same account can hold both Builder and Project data.

## Technical Requirements

- Follow the existing Nest profiles module patterns and standard response envelope.
- Preserve existing profile fields and behavior (all new columns nullable).
- Do not reintroduce KYB fields into `profiles`; KYB stays in its own domain.

## Additional Notes

- Phase 1 of the Thalos Connect proposal.
- This is the **hard dependency** for the frontend profile work.

## Testing

- [ ] Migration applies cleanly and is reversible.
- [ ] `GET`/`PATCH /profiles` round-trip all Builder and Project fields.
- [ ] One account can populate both Builder and Project data.
- [ ] `handle` uniqueness + URL-safe validation enforced.

## Proof of Completion

- [ ] Link the merged PR (`Closes #<this issue>`).
- [ ] Paste the migration SQL.
- [ ] Paste the `/profiles` request/response contract.

---
_Frontend counterpart: Thalos-Infrastructure/ThalosFrontend (C1 — FE). This issue **blocks** it._
