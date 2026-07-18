# ThalosFrontend — CLAUDE.md

Next.js 16 (App Router, **webpack** — `next dev --webpack`) app for Thalos. Uses Supabase
(auth_users + profiles), the Stellar Wallets Kit (Freighter/xBull/LOBSTR/…), and calls the
ThalosBackend (`/v1`) which relays to Trustless Work. Runs at http://localhost:3000.

## Runtime & commands

- **Node 22 required** (same reason/setup as the backend — see ThalosBackend/CLAUDE.md).
  Node 22 at `C:\Users\leandro.masotti\AppData\Local\nvm\v22.23.1` (prepend to PATH).
- Package manager: **pnpm**.
- Install: `pnpm install` · Dev: `pnpm dev` → http://localhost:3000 · Build: `pnpm build`
  (`next build --webpack`) · Lint: `pnpm lint`.

## Environment (`.env.local`)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase → Settings → API),
`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (HS256; **must match ThalosBackend**),
`SUPABASE_JWT_SECRET` (only for Supabase-Auth token verification), `THALOS_INTERNAL_SECRET`
(must match backend), `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/v1`),
`RESEND_API_KEY`, `NEXT_PUBLIC_STELLAR_NETWORK` (TESTNET). Most `NEXT_PUBLIC_*` have working
defaults in `lib/config.ts`.

## Architecture — two auth systems that must stay in sync

1. **App JWT** — `AuthProvider` / `useAuthStore()` (`lib/auth-provider.tsx`, re-exported by
   `lib/auth-store.ts`). `login(user, token)` persists to `localStorage` (`auth_user`,
   `auth_token`); on mount it re-validates via `GET /api/auth/me`. `AuthUser` shape in
   `lib/auth/types.ts`. **The JWT is minted by Next.js API routes** (`app/api/auth/*`) via
   `signToken({ sub, email })` in `lib/auth/utils.ts` (HS256, 7d) — the backend only validates.
2. **Stellar wallet** — `StellarWalletProvider` / `useStellarWallet()` (`lib/stellar-wallet.tsx`),
   state in `sessionStorage`. `useCurrentAddress()` resolves the active address (external
   wallet wins, else the JWT user's embedded wallet).

`AuthProvider` wraps `StellarWalletProvider` (see `app/layout.tsx`), so the wallet provider
can call `login()`.

### Wallet → backend JWT flow (so wallet logins use OUR backend)

Connecting any wallet in `openWalletModal` (`lib/stellar-wallet.tsx`) now authenticates:
`requestWalletChallenge` → `kit.signMessage(challenge)` → `verifyWalletLogin` → `login(user, token)`
(`lib/api/wallet-auth.ts`, routes `app/api/auth/wallet/{challenge,verify}`). The verify route
checks the HMAC challenge (`lib/auth/wallet-challenge.ts`) + the Stellar signature, upserts an
`auth_users` row keyed by wallet, and mints the JWT. **Freighter signs via SEP-0053**, so the
verify route tries multiple signature schemes (`raw`/`sep53`/`sha256`/`prefixed`) and logs which
matched. Non-fatal: if the user rejects signing, the wallet stays connected in wallet-only mode.

### Calling the backend

`lib/api/*` (escrow.ts, wallets.ts, …) each define `apiRequest(endpoint, opts, token?)` — base
URL `API_URL`, Bearer token passed **explicitly** (callers read `token` from `useAuthStore`).
`services/escrowMigration.ts` is a wrapper: it hits the backend **only when a `token` is passed**,
otherwise (or on backend error) it **falls back to `services/trustlessworkService.ts` which calls
Trustless Work directly**. So dashboards must pass `token` AND the user must be authenticated, or
you'll silently see direct `dev.api.trustlesswork.com` calls.

## Gotchas

- If dashboard escrow calls go straight to `dev.api.trustlesswork.com`: the user has no app
  JWT (wallet-only without the flow above) OR the backend returned an error (fallback). Check
  the browser console for `[v0] MIGRATION:` logs.
- `next dev` holds `.next/dev/lock`; kill stray node on :3000 and delete the lock before restart.
- This machine's C: drive fills up easily; the npm cache and `.next`/node_modules are common
  culprits — `npm cache clean --force` + deleting `.next` reclaims the most within this repo.
