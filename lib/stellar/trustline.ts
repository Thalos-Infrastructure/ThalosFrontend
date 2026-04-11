"use server";

import { TRUSTLINE_USDC } from "@/lib/config";

const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
const HORIZON_URL = STELLAR_NETWORK === "MAINNET" 
  ? "https://horizon.stellar.org"
  : "https://horizon-testnet.stellar.org";

const NETWORK_PASSPHRASE = STELLAR_NETWORK === "MAINNET"
  ? "Public Global Stellar Network ; September 2015"
  : "Test SDF Network ; September 2015";

// Friendbot URL for testnet activation (free)
const FRIENDBOT_URL = "https://friendbot.stellar.org";

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
 * Activate wallet using Friendbot (TESTNET only - free)
 */
async function activateWithFriendbot(publicKey: string): Promise<boolean> {
  if (STELLAR_NETWORK === "MAINNET") {
    return false; // Friendbot only works on testnet
  }
  
  try {
    const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
    return response.ok;
  } catch (error) {
    console.error("Friendbot error:", error);
    return false;
  }
}

/**
 * Activate wallet and add USDC trustline for custodial wallets
 * Uses Friendbot for testnet (free), requires manual funding for mainnet
 */
export async function activateAndAddTrustline(
  publicKey: string, 
  secretKey: string
): Promise<TrustlineResult> {
  try {
    const StellarSdk = await import("@stellar/stellar-sdk");
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    // Check if account is already activated
    let isActivated = await checkWalletActivated(publicKey);
    
    if (!isActivated) {
      if (STELLAR_NETWORK === "TESTNET") {
        // Use Friendbot for testnet (free)
        const friendbotSuccess = await activateWithFriendbot(publicKey);
        if (!friendbotSuccess) {
          return { success: false, error: "Failed to activate wallet with Friendbot" };
        }
        isActivated = true;
      } else {
        // For mainnet, wallet needs to be funded externally
        return { 
          success: false, 
          error: "Wallet not activated. For mainnet, the wallet needs XLM to be activated." 
        };
      }
    }
    
    // Check if trustline already exists
    const hasTrustline = await checkUsdcTrustline(publicKey);
    if (hasTrustline) {
      return { success: true };
    }
    
    // Add USDC trustline
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(publicKey);
    
    const usdcAsset = new StellarSdk.Asset(TRUSTLINE_USDC.symbol, TRUSTLINE_USDC.address);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: usdcAsset,
        limit: "1000000000",
      }))
      .setTimeout(180)
      .build();
    
    transaction.sign(keypair);
    const result = await server.submitTransaction(transaction);
    
    return { success: true, txHash: result.hash };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add trustline";
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
