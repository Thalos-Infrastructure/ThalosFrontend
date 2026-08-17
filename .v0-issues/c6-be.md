## Task Description

Add backend support for **GitHub-backed milestone evidence**: store the builder's verified GitHub identity and provide a server-side endpoint that lists the builder's **merged PRs scoped to the project's repo**, to be attached as verifiable evidence on agreement milestones.

The GitHub token lives server-side in Nest (not the client, not Supabase social).

## Deliverable

Verified GitHub identity storage + a server endpoint returning project-repo merged PRs + persistence of attached PRs on a milestone.

## Requirements

- Store `github_username` + `github_verified_at` on the builder profile (verified ownership, not Supabase social auth).
- Server endpoint calling the GitHub Search API scoped to the project repo, e.g. `repo:ORG/REPO author:USER is:pr is:merged` — NOT a generic `author:USER` query (weak evidence).
- Persist attached PRs (`repo`, `number`, `title`, `url`, `merged_at`) linked to the milestone.
- Handle GitHub rate limits gracefully; brief caching.

## Technical Requirements

- GitHub token stored as a server-only secret in Nest; never returned to the client.
- Social auth for GitHub is handled outside Supabase social (which is being removed).
- Standard response envelope.

## Additional Notes

- Proposal Section 9 ("Verified GitHub profiles / evidence").
- Priority P2 — runs after the C1–C5 loop.

## Testing

- [ ] Verified link sets `github_username` + `github_verified_at`.
- [ ] Endpoint returns project-repo merged PRs; token never exposed.
- [ ] Attach/detach PRs persisted against a milestone.
- [ ] Rate-limit / error path handled.

## Proof of Completion

- [ ] Link the merged PR (`Closes #<this issue>`).
- [ ] Confirm the token is server-only (config/diff).
- [ ] Paste the endpoint contract.

---
_Frontend counterpart: Thalos-Infrastructure/ThalosFrontend (C6 — FE). This issue **blocks** it._
