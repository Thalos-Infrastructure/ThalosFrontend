# Escrow migration flags and telemetry

Escrow operations are routed independently through either the Thalos Nest
backend or the legacy direct Trustless Work browser client. Set a flag to
`true` to use Nest and `false` to use Trustless Work.

These are `NEXT_PUBLIC_*` build-time variables. Restart the development server
after changing them, and redeploy the frontend when changing them in a hosted
environment.

| Environment variable | Operation | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_ESCROW_MIGRATION_GET_ESCROWS_BY_SIGNER_USE_NEST` | `getEscrowsBySigner` | `true` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_GET_ESCROWS_BY_ROLE_USE_NEST` | `getEscrowsByRole` | `true` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_CREATE_AGREEMENT_USE_NEST` | `createAgreement` | `false` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_FUND_ESCROW_USE_NEST` | `fundEscrow` | `false` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_APPROVE_MILESTONE_USE_NEST` | `approveMilestone` | `false` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_CHANGE_MILESTONE_STATUS_USE_NEST` | `changeMilestoneStatus` | `false` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_RELEASE_FUNDS_USE_NEST` | `releaseFunds` | `false` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_DISPUTE_MILESTONE_USE_NEST` | `disputeMilestone` | `false` |
| `NEXT_PUBLIC_ESCROW_MIGRATION_SEND_TRANSACTION_USE_NEST` | `sendTransaction` | `false` |

Unset or invalid values use the defaults above. The defaults preserve the
pre-cutover behavior: reads go to Nest and writes remain on Trustless Work.
There is intentionally no automatic fallback between write paths because a
retry on another provider could create a duplicate on-chain operation.

Nest writes require the app JWT. The migration wrapper accepts it as the last
optional argument and otherwise reads the existing `auth_token` browser session.

## Rollout

Enable one write flag at a time. Exercise that operation, verify successful
`escrow_migration.route` events with `"path":"nest"`, and monitor failures
before enabling the next operation. Roll back one operation by setting only its
flag to `false` and rebuilding the frontend.

## Telemetry

Every routed call emits exactly one JSON record. It includes the canonical
operation, selected path, outcome, elapsed time, schema version, and timestamp.
Failures also include the returned error message. The routing layer never adds
request payloads, wallet addresses, JWTs, XDRs, or API keys to the record.

Success example:

```json
{"event":"escrow_migration.route","schemaVersion":1,"timestamp":"2026-08-22T14:30:00.000Z","operation":"fundEscrow","path":"nest","outcome":"success","durationMs":184}
```

Failure example:

```json
{"event":"escrow_migration.route","schemaVersion":1,"timestamp":"2026-08-22T14:31:00.000Z","operation":"releaseFunds","path":"trustless_work","outcome":"failure","durationMs":311,"error":"HTTP 503"}
```
