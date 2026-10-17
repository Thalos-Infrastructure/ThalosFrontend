# Vendored copy — do not edit in place

| | |
| --- | --- |
| Upstream | https://github.com/Trustless-Work/trustlesswork-skill |
| Path | `trustless-work-dev/` |
| Commit | `80e2467f34041b9f70e66d6c2f567fc76ba9b1bb` |
| Dated | 2026-09-26 |
| Vendored | 2026-10-03 |
| License | Apache-2.0 (`LICENSE` in this directory) |

Everything here except this file is upstream's, byte for byte. Refresh by
re-copying `trustless-work-dev/` from a newer commit and updating the table —
never by patching a file, or the next refresh silently drops the patch.

This directory is in `.prettierignore` for the same reason. It is not an
oversight: formatting it rewrote every file on the first run and would have made
each future refresh an unreadable diff.

## What it is for, and what it is not

This is the **protocol** reference: escrow roles, the lifecycle, which role may
perform which operation, single-release versus multi-release semantics, fee and
trustline rules. That is the layer this repo models and keeps getting wrong, so
it is the layer worth having on hand.

It is **not** the authority on the wire format. The backend talks to Trustless
Work, and `ThalosBackend/src/internal-trustless/CLAUDE.md` is written from the
live OpenAPI spec. Where the two disagree about endpoint paths, parameter names
or casing, that file wins — it already documents several quirks this package
omits, such as `get-escrows-by-signer` taking `signer` rather than `address`,
and roles being camelCase upstream.

## Rules found here belong in code

A rule read from a document is a rule someone has to remember. When this package
settles a question about who may do what, encode it in
`lib/permissions/escrowActions.ts` with a test and a comment citing the source,
the way the backend DTOs already are. The first one found this way:

> Single-release requires ALL milestones approved before any release: you cannot
> call release-funds until every milestone is individually approved.
> Multi-release allows per-milestone releases.

That is now the `escrowType` dimension in `canPerform`, with tests. Before it,
the dashboard would have offered Release on a single-release escrow with one
milestone approved and three pending, and Trustless Work would have rejected it.

## MCP servers

`SKILL.md` declares two MCP servers in `allowed-tools`
(`mcp__trustless-work__searchDocumentation`, `mcp__trustless-work__getPage`).
Neither is configured here and the files in this directory work without them.

Note before wiring them up that they are different in kind: the docs server
(`docs.trustlesswork.com/.../mcp`) only searches documentation, while
`mcp.trustlesswork.com` exposes escrow **operations**. Connecting the second
gives a session the ability to act on real escrows, which is a decision about
blast radius, not about documentation.
