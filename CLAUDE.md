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
- **CI runs five blocking checks** (`.github/workflows/ci.yml`), the same shape as
  ThalosBackend: `format:check` (Prettier), `lint:check` (ESLint), `typecheck`
  (`tsc --noEmit`), `test`, `build` — plus a gitleaks secret scan and a non-blocking
  coverage report. Run them locally before opening a PR; `pnpm lint` and `pnpm format`
  auto-fix.
- The typecheck baseline is **zero errors** and `next.config.mjs` sets
  `ignoreBuildErrors: false`, so the build is a real typecheck again. Do not flip that
  back on to turn a red build green.
- ESLint is pinned to **9.x**: `eslint-plugin-react` (via `eslint-config-next`) still uses
  the pre-10 rule context API and crashes on ESLint 10. The backend is on 10 because it
  does not use that plugin.
- `react-hooks/set-state-in-effect` and `exhaustive-deps` are **warnings**, not errors:
  there are ~44 pre-existing hits across ~20 components, and fixing them means changing
  effect behaviour with no UI tests to catch regressions. They are a deliberate backlog,
  not noise — do not add new ones.
- The footer renders a build stamp (`branch · vX.Y.Z · sha`) so you can tell which deploy
  you are looking at; see `lib/version.ts` and the `env` block in `next.config.mjs`.

## Environment (`.env.local`)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase → Settings → API),
`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` (HS256; **must match ThalosBackend**),
`SUPABASE_JWT_SECRET` (only for Supabase-Auth token verification), `THALOS_INTERNAL_SECRET`
(must match backend), `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/v1`),
`RESEND_API_KEY`, `NEXT_PUBLIC_STELLAR_NETWORK` (TESTNET). Most `NEXT_PUBLIC_*` have working
defaults in `lib/config.ts`. There is **no `.env.example`** despite the README linking one.

`NEXT_PUBLIC_*` values are inlined at build time — changing one needs a dev-server restart,
not just a reload.

**Pollar** (social/email login with a provisioned wallet): `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY`
(`pub_…`, browser-safe) and `POLLAR_SECRET_KEY` (`sec_…`, **server-only**, never `NEXT_PUBLIC_*`
— it authenticates `POST /v1/tokens/verify`). Both from dashboard.pollar.xyz → Build → API Keys,
and both are **network-scoped** (`pub_testnet_` / `pub_mainnet_`), so they must match
`NEXT_PUBLIC_STELLAR_NETWORK`. Optional `POLLAR_SERVER_API_URL` (default
`https://server.api.pollar.xyz/v1` — that host, _not_ the `api.pollar.xyz` in Pollar's
server-api docs, which serves no routes; docs at https://server.api.pollar.xyz/docs). With no
publishable key the Pollar login button is simply hidden
(`POLLAR_ENABLED` in `lib/config.ts`), so a deploy without these vars still works. USDC must be
an enabled asset with sponsoring ON in the Pollar dashboard, or trustline setup fails with an
explicit error.

## Architecture — two auth systems that must stay in sync

1. **App JWT** — `AuthProvider` / `useAuthStore()` (`lib/auth-provider.tsx`, re-exported by
   `lib/auth-store.ts`). `login(user, token)` persists to `localStorage` (`auth_user`,
   `auth_token`); on mount it re-validates via `GET /api/auth/me`. `AuthUser` shape in
   `lib/auth/types.ts`. **The JWT is minted by Next.js API routes** (`app/api/auth/*`) via
   `signToken({ sub, email })` in `lib/auth/utils.ts` (HS256, 7d) — the backend only validates.
2. **Stellar wallet** — `StellarWalletProvider` / `useStellarWallet()` (`lib/stellar-wallet.tsx`),
   state in `sessionStorage`. `useCurrentAddress()` resolves the active address (external
   wallet wins, else the JWT user's embedded wallet).
3. **Pollar wallet** — `PollarWalletProvider` / `usePollarWallet()` (`lib/pollar-wallet.tsx`).
   Social/email login that provisions a custodial G-address, so the user needs no extension
   and no XLM. Feeds system 1: the JWT user's `wallet.publicKey`, which `useCurrentAddress()`
   already resolves — no downstream changes.

`AuthProvider` wraps both wallet providers (see `app/layout.tsx`), so either can call `login()`.

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

The signature is **skipped** when this device already holds a session for the _same_ wallet.
A session for a different address does not count: that would let a stale login speak for the
wallet just connected.

> Historical note: this block used to sit behind `NEXT_PUBLIC_SHOW_SIGN_MESSAGE_TEST`, off by
> default, so connecting a wallet minted no JWT at all. The flag is gone. If wallet login ever
> stops working, check nobody reintroduced a gate before debugging the backend.

### Pollar → app JWT flow (social/email login, #108)

`openLogin()` (`lib/pollar-wallet.tsx`) runs: Pollar login modal → wait for a **`verified`**
session (not just `isAuthenticated`; a cold-start session is optimistic) → wait for the
provisioned G-address → `setTrustline(USDC)` (sponsored by the app, which is what makes "no XLM"
work) → `loginWithPollar(accessToken)` → `login(user, token)` → `linkWallet(…, 'custodial')`.

`app/api/auth/pollar/route.ts` takes **only** the Pollar access token and calls
`POST /v1/tokens/verify` with `POLLAR_SECRET_KEY`; the wallet address, user id and provider all
come from that response, never from the request body — otherwise anyone could claim someone
else's G-address. It fills `auth_users.wallet_public_key`, which OAuth signup deliberately
leaves NULL (`scripts/011`, `app/api/auth/oauth-callback/route.ts`).

Three gotchas worth knowing. The login flow reads everything from the **PollarClient**
(`getAuthState`/`getWallet`), never from `usePollar()` context values, which are per-render
snapshots an awaiting callback would never see update — the access token included
(`readAccessToken` in `lib/pollar-auth-state.ts`): reading it from `localStorage` instead picks
whichever `pollar:<apiKeyHash>:session` key comes first, and on localhost several Pollar apps
share the origin, so you get another app's token and a `SDK_TOKEN_WRONG_APPLICATION` rejection.
`onAuthStateChange` replays the current state **synchronously on subscribe**, so the first
emission is the pre-login state and must be ignored. And `@pollar/react/styles.css` has to be
imported or the login modal mounts invisible (see `app/globals.css` for the z-index it needs to
clear Thalos's own modals).

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
