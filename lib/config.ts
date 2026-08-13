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

// show mocked agreements in the UI, set to false to hide them
export const SHOW_MOCKED_AGREEMENTS = process.env.NEXT_PUBLIC_SHOW_MOCKED_AGREEMENTS === "true";

// show the dev-only "SignMessage Test" widget. Hidden by default (must never
// appear in production); opt in for local dev with NEXT_PUBLIC_SHOW_SIGN_MESSAGE_TEST=true.
export const SHOW_SIGN_MESSAGE_TEST = process.env.NEXT_PUBLIC_SHOW_SIGN_MESSAGE_TEST === "true";

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

// Friendbot is used for testnet wallet activation (free, no funding required)
