"use server";

import { TRUSTLINE_USDC } from "@/lib/config";

const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
const HORIZON_URL = STELLAR_NETWORK === "MAINNET" 
  ? "https://horizon.stellar.org"
  : "https://horizon-testnet.stellar.org";

const NETWORK_PASSPHRASE = STELLAR_NETWORK === "MAINNET"
  ? "Public Global Stellar Network ; September 2015"
  : "Test SDF Network ; September 2015";

// Funding wallet for activating new accounts (needs XLM)
const FUNDING_SECRET = process.env.STELLAR_FUNDING_SECRET;

interface TrustlineResult {
  success: boolean;
  error?: string;
  txHash?: string;
}

/**
 * Check if a wallet has a trustline for USDC
 */
export async function checkUsdcTrustline(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    if (!response.ok) {
      // Account doesn't exist yet (not activated)
      return false;
    }
    
    const account = await response.json();
    const balances = account.balances || [];
    
    return balances.some(
      (b: { asset_code?: string; asset_issuer?: string }) => 
        b.asset_code === TRUSTLINE_USDC.symbol && 
        b.asset_issuer === TRUSTLINE_USDC.address
    );
  } catch (error) {
    console.error("Error checking trustline:", error);
    return false;
  }
}

/**
 * Check if a wallet is activated (has XLM reserve)
 */
export async function checkWalletActivated(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the unsigned XDR for adding USDC trustline
 * This needs to be signed by the wallet owner
 */
export async function getAddTrustlineXdr(publicKey: string): Promise<{ xdr: string; error?: string }> {
  try {
    // Dynamic import to avoid bundling issues
    const StellarSdk = await import("@stellar/stellar-sdk");
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    // Load the account
    const account = await server.loadAccount(publicKey);
    
    // Create the USDC asset
    const usdcAsset = new StellarSdk.Asset(TRUSTLINE_USDC.symbol, TRUSTLINE_USDC.address);
    
    // Build the transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: usdcAsset,
        limit: "1000000000", // 1 billion USDC max
      }))
      .setTimeout(180)
      .build();
    
    return { xdr: transaction.toXDR() };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create trustline transaction";
    return { xdr: "", error: message };
  }
}

/**
 * Activate a new wallet and add USDC trustline using the funding wallet
 * This is for custodial wallets where we have the secret key
 */
export async function activateAndAddTrustline(
  publicKey: string, 
  secretKey: string
): Promise<TrustlineResult> {
  if (!FUNDING_SECRET) {
    return { success: false, error: "Funding wallet not configured" };
  }

  try {
    const StellarSdk = await import("@stellar/stellar-sdk");
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    // Check if account is already activated
    const isActivated = await checkWalletActivated(publicKey);
    
    if (!isActivated) {
      // Step 1: Fund the new account from funding wallet
      const fundingKeypair = StellarSdk.Keypair.fromSecret(FUNDING_SECRET);
      const fundingAccount = await server.loadAccount(fundingKeypair.publicKey());
      
      // Create account with minimum balance (1.5 XLM = 1 base + 0.5 per trustline)
      const createAccountTx = new StellarSdk.TransactionBuilder(fundingAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(StellarSdk.Operation.createAccount({
          destination: publicKey,
          startingBalance: "2", // 2 XLM to cover base reserve + trustline + some for fees
        }))
        .setTimeout(180)
        .build();
      
      createAccountTx.sign(fundingKeypair);
      await server.submitTransaction(createAccountTx);
    }
    
    // Step 2: Add USDC trustline
    const hasTrustline = await checkUsdcTrustline(publicKey);
    if (hasTrustline) {
      return { success: true };
    }
    
    const newAccountKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const newAccount = await server.loadAccount(publicKey);
    
    const usdcAsset = new StellarSdk.Asset(TRUSTLINE_USDC.symbol, TRUSTLINE_USDC.address);
    
    const trustlineTx = new StellarSdk.TransactionBuilder(newAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: usdcAsset,
        limit: "1000000000",
      }))
      .setTimeout(180)
      .build();
    
    trustlineTx.sign(newAccountKeypair);
    const result = await server.submitTransaction(trustlineTx);
    
    return { success: true, txHash: result.hash };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to activate wallet";
    console.error("Trustline error:", error);
    return { success: false, error: message };
  }
}

/**
 * Validate that a wallet can receive USDC before creating an escrow
 */
export async function validateWalletForEscrow(publicKey: string): Promise<{
  valid: boolean;
  activated: boolean;
  hasTrustline: boolean;
  error?: string;
}> {
  const activated = await checkWalletActivated(publicKey);
  if (!activated) {
    return {
      valid: false,
      activated: false,
      hasTrustline: false,
      error: "Wallet is not activated. It needs XLM to be activated on the Stellar network.",
    };
  }
  
  const hasTrustline = await checkUsdcTrustline(publicKey);
  if (!hasTrustline) {
    return {
      valid: false,
      activated: true,
      hasTrustline: false,
      error: "Wallet does not have USDC trustline. The wallet owner needs to add USDC to receive payments.",
    };
  }
  
  return {
    valid: true,
    activated: true,
    hasTrustline: true,
  };
}
