// Thalos Global Configuration Constants

// App URLs
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.thalosplatform.xyz";
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";
export const APP_NAME = "Thalos";

// Email Configuration (Resend)
export const EMAIL_FROM = process.env.EMAIL_FROM || "Thalos <notifications@thalosplatform.xyz>";
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "support@thalosplatform.xyz";

// Stellar Explorer — la base por red vive en STELLAR_NETWORKS (más abajo); esta
// variable solo permite apuntar a otro explorer distinto del predeterminado.

export const TRUSTLINE_USDC = {
	symbol: "USDC",
	address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

// show mocked agreements in the UI, set to true to show them (off by default for production safety)
export const SHOW_MOCKED_AGREEMENTS = process.env.NEXT_PUBLIC_SHOW_MOCKED_AGREEMENTS === "true";

// Stellar Network Configuration
//
// Fuente única de verdad para la red: todo lo que depende de ella sale de esta tabla
// y de UNA sola decisión (STELLAR_NETWORK). Antes cada constante tenía su propio
// ternario, y el explorer no tenía ninguno: en MAINNET apuntaba igualmente a testnet.
const STELLAR_NETWORKS = {
  MAINNET: {
    passphrase: "Public Global Stellar Network ; September 2015",
    horizonUrl: "https://horizon.stellar.org",
    explorerBaseUrl: "https://stellar.expert/explorer/public/contract/",
  },
  TESTNET: {
    passphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    explorerBaseUrl: "https://stellar.expert/explorer/testnet/contract/",
  },
} as const;

export type StellarNetwork = keyof typeof STELLAR_NETWORKS;

// Cualquier valor que no sea MAINNET cae en TESTNET, que es como se comportaban ya
// la passphrase y Horizon. Normalizarlo aquí evita que un valor desconocido deje
// media configuración en una red y media en otra.
export const STELLAR_NETWORK: StellarNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "MAINNET" ? "MAINNET" : "TESTNET";

const stellarNetworkConfig = STELLAR_NETWORKS[STELLAR_NETWORK];

export const STELLAR_NETWORK_PASSPHRASE = stellarNetworkConfig.passphrase;
export const HORIZON_URL = stellarNetworkConfig.horizonUrl;
export const STELLAR_EXPLORER_BASE_URL =
  process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL || stellarNetworkConfig.explorerBaseUrl;

// El base de arriba enlaza contratos (escrows). Una wallet (G-address) vive en
// `/account/` en stellar.expert; derivarlo del mismo base mantiene ambas URLs en
// la misma red y respeta el override de NEXT_PUBLIC_STELLAR_EXPLORER_URL.
export const STELLAR_EXPLORER_ACCOUNT_BASE_URL = STELLAR_EXPLORER_BASE_URL.replace(
  /contract\/?$/,
  "account/",
);

// Friendbot is used for testnet wallet activation (free, no funding required)

// Pollar — social/email login with an auto-provisioned custodial wallet (#108).
//
// Names follow Pollar's documented convention. The distinction matters: the
// publishable key (`pub_…`) is safe in the browser, while the SECRET key
// (`sec_…`, POLLAR_SECRET_KEY, no NEXT_PUBLIC_ prefix) is read straight from
// process.env in app/api/auth/pollar/route.ts and must never reach client code —
// a NEXT_PUBLIC_ prefix on it would publish it in the browser bundle.
//
// Keys are network-scoped (pub_testnet_ / pub_mainnet_), so this must match
// STELLAR_NETWORK below.
export const POLLAR_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY || "";

/**
 * Server API base — secret-key endpoints, e.g. POST /v1/tokens/verify.
 *
 * Note the host: `server.api.pollar.xyz`, not the `api.pollar.xyz` that
 * server-api.md documents (that one resolves but serves no routes at all) and
 * not the `sdk.api.pollar.xyz` the browser SDK talks to. Docs live at
 * https://server.api.pollar.xyz/docs.
 */
export const POLLAR_SERVER_API_URL =
  process.env.POLLAR_SERVER_API_URL || "https://server.api.pollar.xyz/v1";

// Off unless a publishable key is configured, so a deploy without Pollar env vars
// simply hides the button instead of rendering a login that always fails.
export const POLLAR_ENABLED = POLLAR_PUBLISHABLE_KEY !== "";

// The identity providers Thalos drives directly, each behind its own button in
// our own modal — Pollar's login modal is never opened.
//
// Passkey is absent on purpose. Pollar's passkey path yields a `smart`
// C-address, which Trustless Work escrows cannot use as a party; that flow is
// #109 (Accesly), which bridges the smart account to a real G-address first.
export const POLLAR_LOGIN_PROVIDERS = ["google", "github", "email"] as const;
export type PollarLoginProvider = (typeof POLLAR_LOGIN_PROVIDERS)[number];
