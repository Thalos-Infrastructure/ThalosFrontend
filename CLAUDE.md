# ThalosFrontend — CLAUDE.md

Next.js 16 (App Router, **webpack** — `next dev --webpack`) app for Thalos. Uses Supabase
(auth_users + profiles), the Stellar Wallets Kit (Freighter/xBull/LOBSTR/…), and calls the
ThalosBackend (`/v1`) which relays to Trustless Work. Runs at http://localhost:3000.

## Runtime & commands

- **Node 22 required** (same reason/setup as the backend — see `ThalosBackend/CLAUDE.md`).
  Node 22 at `C:\Users\leandro.masotti\AppData\Local\nvm\v22.23.1` (prepend to PATH).
- Package manager: **pnpm**.
- Install: `pnpm install` · Dev: `pnpm dev` → http://localhost:3000 · Build: `pnpm build`
  (`next build --webpack`).
- **There is no CI in this repo** — no `.github/workflows`, so nothing is checked on push.
  `pnpm lint` is also a dead script: ESLint is not installed. `tsc --noEmit` reports ~192
  pre-existing errors and `next.config.mjs` sets `ignoreBuildErrors: true`, so a green
  build does not mean a clean typecheck. Run `pnpm build` before opening a PR; it is the
  only real gate.

## Environment (`.env.local`)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase → Settings → API),
`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (HS256; **must match ThalosBackend**),
`SUPABASE_JWT_SECRET` (only for Supabase-Auth token verification), `THALOS_INTERNAL_SECRET`
(must match backend), `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/v1`),
`RESEND_API_KEY`, `NEXT_PUBLIC_STELLAR_NETWORK` (TESTNET). Most `NEXT_PUBLIC_*` have working
defaults in `lib/config.ts`. There is **no `.env.example`** despite the README linking one.

`NEXT_PUBLIC_*` values are inlined at build time — changing one needs a dev-server restart,
not just a reload.

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

Because the address lives in `sessionStorage` and the JWT in `localStorage`, the two can
drift: a tab can show a connected wallet with no session. After changing anything in this
area, **disconnect and reconnect** — reloading restores the old state without re-running
the login.

### Wallet → backend JWT flow

`openWalletModal` (`lib/stellar-wallet.tsx`) authenticates on connect:
`requestWalletChallenge` → unified `signMessage(challenge)` → `verifyWalletLogin` →
`login(user, token)` (`lib/api/wallet-auth.ts`, routes `app/api/auth/wallet/{challenge,verify}`).
The verify route checks the HMAC challenge (`lib/auth/wallet-challenge.ts`) plus the Stellar
signature, upserts an `auth_users` row keyed by wallet, and mints the JWT. **Freighter signs
via SEP-0053**, so the verify route tries several schemes (`raw`/`sep53`/`sha256`/`prefixed`)
and logs which matched. Rejecting the signature is non-fatal — the wallet stays connected in
wallet-only mode.

The signature is **skipped** when this device already holds a session for the *same* wallet.
A session for a different address does not count: that would let a stale login speak for the
wallet just connected.

> Historical note: this block used to sit behind `NEXT_PUBLIC_SHOW_SIGN_MESSAGE_TEST`, off by
> default, so connecting a wallet minted no JWT at all. The flag is gone. If wallet login ever
> stops working, check nobody reintroduced a gate before debugging the backend.

### Calling the backend

`lib/api/*` (escrow.ts, wallets.ts, …) each define `apiRequest(endpoint, opts, token?)` — base
URL `API_URL`, Bearer token passed **explicitly** (callers read `token` from `useAuthStore`);
the header is simply omitted when there is no token.

`services/escrowMigration.ts` is a migration wrapper with per-operation flags
configured by `NEXT_PUBLIC_ESCROW_MIGRATION_*_USE_NEST`. See
`docs/escrow-migration.md` for the full list, defaults, and telemetry schema:

- **Reads** (`getEscrowsBySigner`, `getEscrowsByRole`) → backend by default, **token
  optional**. The backend exposes them as `@Public()`, so a freshly connected wallet
  lists its agreements with no signature. Setting a read flag to `false` explicitly
  selects the direct Trustless Work path; failures never auto-fallback between paths.
- **Writes** (create, fund, approve, changeMilestoneStatus, release, dispute,
  sendTransaction) → default to
  `false`, so they call `services/trustlessworkService.ts`, which hits
  `dev.api.trustlesswork.com` **straight from the browser**. Enable each Nest path
  independently during rollout.

> ⚠️ `services/trustlessworkService.ts` carries a **hardcoded Trustless Work API key** as a
> fallback for `NEXT_PUBLIC_TRUSTLESSWORK_API_KEY`. It is committed to a public repo and
> shipped in the browser bundle. Rotate it, and migrate each write to the backend relay
> (`ThalosBackend/src/internal-trustless/`) — that relay exists precisely so the key stays
> server-side. Do not add new direct-to-TW calls.

## Gotchas

- **Freighter intermittently shows as "not installed".** `@stellar/freighter-api@6`'s
  `isConnected()` takes a fast path on the `window.freighter` global and otherwise falls back
  to a `postMessage` handshake **that resolves `{isConnected: false}` after a 2s timeout**.
  The kit's `FreighterModule.isAvailable()` trusts that answer, so a slow content script (cold
  browser, many tabs) renders the Install button even though the extension is there. Making it
  worse, `openWalletModal` calls `clearKit()` on every open, which re-runs the 3s
  `waitForFreighter` poll and re-inits the kit each time. Fixes, in order of value: stop
  clearing the kit on every open, pre-warm `isConnected()` at app mount, and retry once before
  believing "unavailable".
- **No emails?** Agreements created from the dashboard go straight to Trustless Work and are
  never POSTed to `/v1/agreements`, so the backend emits no event and sends nothing. See the
  notifications section of `ThalosBackend/CLAUDE.md`.
- **Accesly `/app-config` CORS error in the console** is harmless — the unregistered app id
  `thalos-local` gets a 403 on preflight and the SDK falls back to testnet defaults. Never set
  `NEXT_PUBLIC_ACCESLY_APP_ID` to a placeholder: a set-but-unregistered id makes the provider
  run a bootstrap fetch, fail, and render its error fallback **in place of the whole app**.
- `next dev` holds `.next/dev/lock`; kill stray node on :3000 and delete the lock before restart.
- This machine's C: drive fills up easily; the npm cache and `.next`/node_modules are common
  culprits — deleting `~/AppData/Local/npm-cache/_cacache` and `.next` reclaims the most. A
  disk-full during `next dev` corrupts `.next` and shows up as 500s with `ENOSPC`.
