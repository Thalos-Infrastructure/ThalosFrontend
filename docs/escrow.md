# Escrow operations

Every escrow operation in the frontend goes through the Thalos Nest backend,
which relays to Trustless Work with a **server-side** API key. The browser never
talks to Trustless Work.

`services/escrowService.ts` is the only entry point. It maps the UI's
`AgreementPayload` onto the backend DTOs, resolves the session token, emits one
telemetry record per call, and never throws — failures come back as
`{ success: false, error }`.

| Operation               | Backend route                           | Session |
| ----------------------- | --------------------------------------- | ------- |
| `getEscrowsBySigner`    | `GET /escrows/by-signer/:address`       | no      |
| `getEscrowsByRole`      | `GET /escrows/by-role`                  | no      |
| `createAgreement`       | `POST /escrows/create`                  | yes     |
| `fundEscrow`            | `POST /escrows/fund`                    | yes     |
| `approveMilestone`      | `POST /escrows/approve-milestone`       | yes     |
| `changeMilestoneStatus` | `POST /escrows/change-milestone-status` | yes     |
| `releaseFunds`          | `POST /escrows/release`                 | yes     |
| `disputeMilestone`      | `POST /escrows/dispute`                 | yes     |
| `sendTransaction`       | `POST /escrows/send-transaction`        | yes     |

Reads are `@Public()` on the backend because escrows are public on-chain data,
so a freshly connected wallet lists its agreements without a signature prompt.

## Writes require a session

Writes send the app JWT. `escrowService` takes it as the last optional argument
and otherwise reads the `auth_token` browser session. With no session a write
returns `{ success: false, error: "Escrow writes require an authenticated
wallet session" }` without calling the backend.

This is deliberate. There is no unauthenticated path that moves funds.

## Why the direct path is gone

Until September 2026 each operation could be pointed at Trustless Work directly
from the browser, selected by `NEXT_PUBLIC_ESCROW_MIGRATION_*` flags whose
defaults sent **every write** down that path. It was removed because it:

- shipped `NEXT_PUBLIC_TRUSTLESSWORK_API_KEY` in the client bundle, where anyone
  could read it, while the billing and quota hung off that key;
- had no retry or backstop — the backend enqueues an idempotent job when
  Trustless Work returns 5xx, the browser just dropped the operation;
- had no rate limiting;
- left no place to enforce authorization, since the check has to happen
  somewhere the client cannot edit.

**Do not reintroduce a direct-to-Trustless-Work call** in the frontend. If an
operation is missing, add the relay route in
`ThalosBackend/src/internal-trustless/` and call it from `lib/api/escrow.ts`.

## Telemetry

Every call emits exactly one JSON record: `escrow.operation`, schema version 2,
with the operation, outcome, elapsed time and timestamp; failures also carry the
error message. Records never include request payloads, wallet addresses, JWTs,
XDRs or API keys.

Schema 1 also carried a `path` field recording which provider served the call.
It was dropped with the direct path, which was the only thing it distinguished.
