> **Depends on:** #123 (profiles), #125 (opportunities)
> **Campaign:** Thalos Connect · Phase 3 (Discovery)

## Task Description
Build the discovery surface: a `/connect` directory with **Builders** and **Opportunities** tabs, search, and filters, so projects find talent and builders find work.

## Deliverable
Two filterable, paginated directories served from Nest.

## Requirements
- Builders tab: filter by skills, tech stack, availability; text search on headline/bio.
- Opportunities tab: filter by `skills_required`, `engagement_type`, budget range; only `open`.
- Server-side query + pagination (do not load the whole table client-side).
- Result cards link to the C2 public profile or an opportunity detail.
- Empty and loading states.

## Technical Requirements
- Query Nest via `lib/api`; ensure the filter params are supported (raise a small BE note if missing).
- Use SWR only for client-side filter state, not the initial fetch.

## Additional Notes
Highest-visibility surface for traction. Testing: filters/search correct on both tabs, pagination + empty states, closed opportunities excluded. Proof: link PR + screenshots of both tabs filtered.
