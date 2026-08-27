# Wallet stores: `user_wallets` and `linked_wallets`

The application currently has two independent wallet stores. They are not
aliases, are not synchronized by the wallet API client, and must not be treated
as interchangeable sources.

| Store | Access path | Current consumers | Purpose |
| --- | --- | --- | --- |
| Nest `user_wallets` | `lib/api/wallets.ts` → `${NEXT_PUBLIC_API_URL}/wallets/*` | Profile linked-wallet UI, dashboard wallet selector, wallet-agreement panel, and wallet persistence in the Stellar/Accesly login flows | Authenticated operating wallets, primary/verified state, balances, and agreement grouping |
| Next BFF `linked_wallets` | `app/api/wallets/{linked,link,unlink,set-primary}` → Supabase | No current UI caller; `lib/email/notifications.ts` still queries the table directly | Legacy wallet-linking routes and notification recipient lookup |

## Nest `user_wallets`

Use `lib/api/wallets.ts` for wallet UI and new frontend code. The client sends
the app JWT to the Nest `/v1/wallets` endpoints and returns normalized values:

- list endpoints always return arrays, whether Nest sent `T[]` or
  `{ wallets: T[] }`;
- primary-wallet responses return the wallet or `null`;
- balance responses return `{ xlm, usdc }`;
- verification challenges return `{ challenge, expires_at? }`.

Components must consume these normalized results and must not unwrap response
envelopes themselves.

## Next BFF `linked_wallets`

The routes under `app/api/wallets/*` access the separate `linked_wallets` table
through the Supabase service client. They do not call Nest and are not used by
`lib/api/wallets.ts`. GF-1 intentionally does not alter their behavior.

Before changing or removing this legacy store, migrate its notification lookup
and confirm whether any external client still calls the BFF routes. Writing to
one store does not guarantee that the same wallet exists in the other.
