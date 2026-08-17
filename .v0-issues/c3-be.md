## Task Description

Add backend support for **Opportunities** — the roles/tasks a Project publishes for builders to discover and apply to in Thalos Connect.

**Decision required up front (record in the first comment):** extend the existing `bounties` domain or create a new `opportunities` entity. Do not create a second parallel marketplace by accident. Recommendation: extend bounties unless the models diverge enough to justify a new table.

## Deliverable

Endpoints for opportunity CRUD + status transitions, scoped to the owning Project.

## Requirements

- Entity/fields: `id`, `project_id` (fk profiles), `title`, `description`, `skills_required` (array), `budget_amount`, `budget_asset` (default `USDC`), `engagement_type` (`fixed|milestone|hourly`), `status` (`open|closed|filled`), `created_at`.
- CRUD endpoints for the owning Project.
- Status transitions: `open` → `closed` / `filled`.
- Public read returns only `status = open`.
- Authorization: only the owning Project can create/edit; any authenticated user can read `open`.

## Technical Requirements

- Follow existing Nest module + authorization patterns.
- If extending bounties, reuse its table/policies; if new, mirror the bounties access model.
- Standard response envelope.

## Additional Notes

- Phase 2 of the Thalos Connect proposal.
- Feeds discovery and the application → agreement flow.

## Testing

- [ ] CRUD + status transitions.
- [ ] Owner-only edit; public read limited to `open`.
- [ ] Validation on budget/skills fields.

## Proof of Completion

- [ ] Link the merged PR (`Closes #<this issue>`).
- [ ] Note the bounties-vs-new-table decision taken.
- [ ] Paste the endpoint contract.

---
_Frontend counterpart: Thalos-Infrastructure/ThalosFrontend (C3 — FE). This issue **blocks** it._
