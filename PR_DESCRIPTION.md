# Agreement Chat: real backend integration

## Summary

`AgreementChat` no longer uses mock/local actions (`lib/actions/agreement-chat.ts`)
— it now talks directly to ThalosBackend (`/v1/agreements`). The component can
also resolve a chat from a **Soroban contract ID**, not just a DB agreement
UUID, creating the agreement record on-demand the first time either party
opens the chat.

## Changes

- **`lib/api/agreements.ts` (new)** — replaces `lib/actions/agreement-chat.ts`.
  - `createAgreement` / `getAgreementByContractId`: CRUD against
    `POST /agreements` and `GET /agreements/by-contract/:contractId`.
  - `findOrCreateAgreementByContractId`: looks up (or creates, with both
    `payer`/`payee` participants) the DB agreement for a Trustless Work
    contract ID. Handles the race when both parties open chat at once — the
    losing side just retries the `GET` once.
  - `getAgreementMessages` / `sendAgreementMessage`: against
    `GET/POST /agreements/:agreementId/messages`, normalizing snake_case →
    camelCase. Sending requires `sender_wallet`, validated server-side
    against the JWT user's wallet.

- **`components/agreements/agreement-chat.tsx` (rewritten)**
  - Classifies `agreementId` as `uuid` / `contract` / `mock` via new
    `isValidUuid` / `isSorobanContractId` helpers; `contract` IDs are
    resolved through `findOrCreateAgreementByContractId` before loading
    messages.
  - Uses `useAuthStore()` for the JWT, passed explicitly to every API call.
  - New props: `agreementTitle`, `agreementAmount`, `agreementAsset`,
    `myRole` — needed to auto-create the agreement when only the contract ID
    is known.
  - Visible loading/"linking chat"/error states; `isOwnMessage` now compares
    by `senderId` first, falling back to wallet address.

- **`lib/utils.ts`** — adds `isValidUuid` and `isSorobanContractId` helpers.

- **`app/dashboard/business/page.tsx` / `app/dashboard/personal/page.tsx`** —
  pass the extra agreement fields (`agreementTitle`, `agreementAmount`,
  `agreementAsset`, `myRole`) into `AgreementChat` so it can resolve by
  contract ID.

- **`lib/config.ts`** — `SHOW_MOCKED_AGREEMENTS` now defaults to `false`
  (previously defaulted to `true`); opt in with
  `NEXT_PUBLIC_SHOW_MOCKED_AGREEMENTS=true`.

- **`lib/api/index.ts`** — re-exports `./agreements`.

## Test plan
- [ ] With two wallets/sessions, open chat on an agreement backed by a real
      Trustless Work `contract_id`; confirm the first opener creates the DB
      row and the second finds it.
- [ ] Send messages from both sides, confirm they appear on the other side
      (5s polling) and align correctly via `isOwnMessage`.
- [ ] Open chat without a session (no JWT) — should show an error, not crash.
- [ ] Confirm `NEXT_PUBLIC_SHOW_MOCKED_AGREEMENTS=true` still shows mocks in
      dev.

## Risks
- Requires `/v1/agreements` and `/v1/agreements/:id/messages` to be deployed
  on ThalosBackend.
- `SHOW_MOCKED_AGREEMENTS` default flip is a behavior change for anyone
  relying on the old default in dev.
