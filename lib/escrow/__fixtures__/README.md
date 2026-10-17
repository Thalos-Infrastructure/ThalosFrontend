# Trustless Work contract fixtures

Payloads the escrow parser is tested against, so a change in Trustless Work's
response shape shows up as a failing test rather than as a feature that quietly
stops working.

## Where these came from, and what that is worth

They are transcribed from the **documented examples** in the vendored skill
(`.claude/skills/trustless-work-dev/skills/api/`), not captured from a live
response. That is a real limitation and worth stating plainly: a fixture copied
from documentation proves we parse what the docs describe. It does not prove the
docs match the API.

The documentation has already been wrong about this integration — the backend's
`src/internal-trustless/CLAUDE.md` records that the narrative docs omit most
endpoint paths, that `get-escrows-by-signer` takes `signer` and not `address`,
and that roles are camelCase upstream. None of that is in the skill.

So treat these as a floor, not a ceiling.

## Replacing them with captured responses

This is the whole point and it takes one command. With the backend running and
an address that holds escrows:

```bash
curl -s "http://localhost:3001/v1/escrows/by-role?address=G...&role=approver" \
  | python -m json.tool > captured-by-role.json
```

Then replace the corresponding fixture, keeping the structure of this directory,
and note the capture date below. Scrub nothing: these are public on-chain
records, and an address that only ever held testnet funds is not a secret. If a
capture ever comes from mainnet, redact the addresses — the shape is what
matters, not whose escrow it was.

| Fixture                 | Source                                               | Captured   |
| ----------------------- | ---------------------------------------------------- | ---------- |
| `indexerEscrow.ts`      | skill docs, single-release-escrow.md                 | —          |
| `captured-by-role.json` | `GET /escrows/by-role?role=platformAddress`, testnet | 2026-10-05 |

## What belongs here

Payloads **as Trustless Work returns them**: nested `roles`, optional `balance`,
`flags` as an object. Not our view models. The parser's job is to turn the first
into the second, and a fixture written in our own shape would test nothing.

## What the first capture settled

The documentation and the API disagree in three places, all found the moment a
real response was run through the parser:

- `fundedBy` is documented on the indexer response and was absent from all eight
  escrows returned. Nothing may depend on it.
- `balance` is documented optional and was present on all eight, including as
  `0` for escrows nobody funded. An absent balance is not how an unfunded escrow
  is reported.
- `createdAt` is documented as a `Date` and arrives as a Firestore timestamp,
  `{ _seconds }`. Read as a string it yields nothing, and every agreement then
  renders with today's date.

This is the argument for capturing rather than transcribing, in three lines.
