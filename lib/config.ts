// Thalos Global Configuration Constants

export const STELLAR_EXPLORER_BASE_URL = process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL || "https://stellar.expert/explorer/testnet/contract/";

export const TRUSTLINE_USDC = {
	symbol: "USDC",
	address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

// show mocked agreements in the UI, set to false to hide them
export const SHOW_MOCKED_AGREEMENTS = process.env.NEXT_PUBLIC_SHOW_MOCKED_AGREEMENTS !== "false";

// Stellar Network Configuration
export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
export const HORIZON_URL = STELLAR_NETWORK === "MAINNET" 
  ? "https://horizon.stellar.org"
  : "https://horizon-testnet.stellar.org";

// Friendbot is used for testnet wallet activation (free, no funding required)
