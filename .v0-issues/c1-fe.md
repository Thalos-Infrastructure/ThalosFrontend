> **Depends on (hard):** Thalos-Infrastructure/ThalosBackend#137 — Nest `/profiles` endpoint + migration
> **Recommended before (non-blocking):** GF-9 (consolidate `apiRequest`) — can proceed on the existing `client.ts` helper.
> **Campaign:** Thalos Connect · Phase 1 (Profiles)

## Task Description
Extend profiles into **Builder** and **Project** profile types for Thalos Connect. A single account can be **both** Builder and Project (types are additive, not exclusive). All profile writes go through the **Nest API** via `lib/api`, not directly to Supabase.

## Background / Current State
- The FE currently writes profiles directly to Supabase (`lib/actions/profile.ts` → `createClient` insert/update). This conflicts with the completed "Migrate Profiles off Supabase" work in the backend.
- Two divergent `profiles` schemas exist (Supabase FE vs Nest BE). **Nest is canonical.** Do NOT extend `scripts/001_create_profiles.sql`.

## Deliverable
An FE profile editor that reads/writes Builder + Project fields through Nest `/profiles`.

## Requirements
- New `lib/api/profiles.ts` using the shared `apiRequest` from `client.ts`.
- Update `components/profile/profile-editor.tsx` with Builder and Project sections (both selectable, not XOR).
- Remove direct Supabase writes from the profile save path.
- `handle` unique + URL-safe (consumed by C2).

## Technical Requirements
- FE talks only to Nest via `lib/api`; no direct Supabase profile writes.
- Fields (mirror BE#137): Builder — `headline`, `bio`, `skills[]`, `tech_stack[]`, `hourly_rate`, `availability`, `portfolio_links`, `social_links`, `handle`; Project — `org_name`, `org_description`, `org_website`, `looking_for[]`, `org_links`.

## Additional Notes
The hard dependency is the Nest endpoint (BE#137), not any FE cleanup. Testing: save/load round-trip for both types on one account; confirm no Supabase write remains. Proof: link FE + BE PRs, screenshot of both editor sections.
