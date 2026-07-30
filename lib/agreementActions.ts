import { sendTransaction, AgreementPayload, fundEscrow, AgreementResponse, changeMilestoneStatus } from "@/services/trustlessworkService";
import { buildCreateEscrow, submitSignedTransaction, type BackendCreateEscrowDto } from "@/lib/api/escrow";
import { signTransaction as unifiedSign, signMessage as unifiedSignMessage } from "@/lib/signing";
import { STELLAR_NETWORK_PASSPHRASE } from "@/lib/config";
import { linkWallet, type LinkedWallet } from "@/lib/api/wallets";

export interface CreateAndSignAgreementParams {
  payload: AgreementPayload;
  /** App JWT (from useAuthStore). Required: escrow creation now goes through the Thalos backend. */
  token: string | null;
  walletAddress: string | null;
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>;
  signTransaction: (xdr: string, opts: { networkPassphrase: string; address: string }) => Promise<any>;
  setCreating: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setSubmitted: (v: boolean) => void;
  onSuccess?: () => void;
}

export interface FundAndSignEscrowParams {
  contractId: string;
  amount: string;
  walletAddress: string | null;
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>;
  signTransaction: (xdr: string, opts: { networkPassphrase: string; address: string }) => Promise<any>;
  setFunding: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setSuccess: (v: boolean) => void;
}

export interface ChangeMilestoneStatusParams {
  contractId: string;
  milestoneIndex: string;
  newEvidence: string;
  newStatus: string;
  serviceProvider: string;
  serviceType: "single-release" | "multi-release";
  walletAddress: string | null;
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>;
  setSubmitting: (v: boolean) => void;
  setError: (msg: string | null) => void;
  onSuccess?: () => void;
}

/** Maps the wizard payload to the backend CreateEscrowDto (only whitelisted fields;
 * the backend injects platformAddress/disputeResolver/engagementId/trustline). */
function toCreateEscrowDto(payload: AgreementPayload): BackendCreateEscrowDto {
  const isMulti = payload.serviceType === "multi-release";
  return {
    title: payload.title,
    description: payload.description,
    amount: payload.amount,
    platformFee: payload.platformFee,
    signer: payload.signer,
    serviceType: payload.serviceType,
    roles: {
      approver: payload.roles.approver,
      serviceProvider: payload.roles.serviceProvider,
      releaseSigner: payload.roles.releaseSigner,
      ...(payload.roles.receiver ? { receiver: payload.roles.receiver } : {}),
    },
    milestones: payload.milestones.map((m) => ({
      description: m.description,
      ...(isMulti ? { amount: m.amount, status: m.status } : {}),
    })),
  };
}

/**
 * Persist an externally-connected Kit wallet into the backend's `user_wallets`
 * table via the /v1/wallets link endpoint. Non-fatal — the wallet still
 * functions for signing even if persistence fails (e.g. no JWT yet).
 */
async function persistKitWallet(address: string, token: string | null): Promise<void> {
  if (!address || !token) return;
  try {
    await linkWallet(
      { wallet_address: address, wallet_type: "other" },
      token,
    );
  } catch {
    // Non-fatal — wallet works for signing without persistence
  }
}

export async function createAndSignAgreement({
  payload,
  token,
  walletAddress,
  openWalletModal,
  setCreating,
  setError,
  setSubmitted,
  onSuccess,
}: CreateAndSignAgreementParams) {
  setCreating(true);
  setError(null);
  try {
    if (!token) {
      throw new Error("Necesitás iniciar sesión con tu wallet para crear un acuerdo.");
    }

    // Pre-check: receiver must have a USDC trustline (single-release). Client-side
    // Horizon check (not Trustless Work). Network failures are non-fatal.
    if (payload.roles.receiver) {
      let validation: { valid: boolean; error?: string } | null = null;
      try {
        const { validateWalletForEscrow } = await import("@/lib/stellar/trustline");
        validation = await validateWalletForEscrow(payload.roles.receiver);
      } catch (e) {
        console.warn("No se pudo validar la trustline del receptor (se continúa):", e);
      }
      if (validation && !validation.valid) {
        throw new Error(validation.error || "La wallet receptora no puede recibir USDC (falta trustline).");
      }
    }

    // 1. Build the escrow via OUR backend (Trustless Work relay) → unsigned XDR.
    const build = await buildCreateEscrow(toCreateEscrowDto(payload), token);
    if (!build.success || !build.data?.unsignedTransaction) {
      throw new Error(build.error || "Agreement creation failed");
    }

    // 2. Sign with the wallet and 3. submit the signed XDR through the backend.
    await signAndSubmitViaBackend(build.data.unsignedTransaction, token, walletAddress, openWalletModal);

    setSubmitted(true);
    onSuccess?.();
  } catch (e: any) {
    setError(e.message || "Unknown error");
  } finally {
    setCreating(false);
  }
}

/**
 * Unified sign + submit path.
 *
 * Ensures a wallet is connected, signs the unsigned XDR via the unified signer
 * (Stellar Wallets Kit), and submits through the Thalos backend
 * (/v1/escrows/send-transaction).
 *
 * The Kit wallet is also persisted to `user_wallets` so it shows up in the
 * multi-wallet UI alongside the custodial wallet.
 */
async function signAndSubmitViaBackend(
  unsignedXdr: string,
  token: string,
  walletAddress: string | null,
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>,
) {
  let currentAddress = walletAddress;
  if (!currentAddress) {
    await new Promise<void>((resolve, reject) => {
      openWalletModal((addr) => {
        if (addr) {
          currentAddress = addr;
          resolve();
        } else {
          reject(new Error("Wallet connection cancelled or failed"));
        }
      });
    });
  }
  if (!currentAddress) throw new Error("Wallet connection required to sign transaction");

  // Persist the Kit wallet to user_wallets (non-fatal)
  await persistKitWallet(currentAddress, token);

  // Unified signing path — routes through Stellar Wallets Kit
  const signedResult = await unifiedSign(unsignedXdr, STELLAR_NETWORK_PASSPHRASE, currentAddress);
  if (!signedResult?.signedTxXdr) {
    throw new Error("Transaction signing failed (no XDR returned)");
  }

  const sendRes = await submitSignedTransaction(signedResult.signedTxXdr, token);
  if (!sendRes.success) throw new Error(sendRes.error || "Transaction send failed");
}

export async function fundAndSignEscrow({
  contractId,
  amount,
  walletAddress,
  openWalletModal,
  signTransaction: _unusedSignTransaction,
  setFunding,
  setError,
  setSuccess,
}: FundAndSignEscrowParams) {
  setFunding(true);
  setError(null);
  setSuccess(false);
  try {
    if (!walletAddress) {
      throw new Error("Wallet address is required to fund escrow");
    }
    const response = await fundEscrow(contractId, walletAddress, Number(amount), "single-release");
    await processTransaction(response, "Fund escrow failed", walletAddress, openWalletModal);
    setSuccess(true);
  } catch (e: any) {
    setError(e.message || "Unknown error");
  } finally {
    setFunding(false);
  }
}

export async function changeMilestoneStatusAgreement({
  contractId,
  milestoneIndex,
  newEvidence,
  newStatus,
  serviceProvider,
  serviceType,
  walletAddress,
  openWalletModal,
  setSubmitting,
  setError,
  onSuccess,
}: ChangeMilestoneStatusParams) {
  setSubmitting(true);
  setError(null);
  try {
    const response = await changeMilestoneStatus(
      contractId,
      milestoneIndex,
      newEvidence,
      newStatus,
      serviceProvider,
      serviceType
    );
    await processTransaction(response, "Change milestone status failed", walletAddress, openWalletModal);
    setSubmitting(true);
    // 2. notify caller so they can add the agreement to state immediately
    onSuccess?.();
  } catch (e: any) {
    setError(e.message || "Unknown error");
  } finally {
    setSubmitting(false);
  }
}

/**
 * Unified transaction processing — signs via the unified signer and submits
 * through Trustless Work's send-transaction endpoint.
 */
async function processTransaction(
  response: AgreementResponse<unknown>,
  errorMessage: string,
  walletAddress: string | null,
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>
) {
    if (!response.success)
      throw new Error(response.error || errorMessage);
    
    const xdr = response.data?.unsignedTransaction;
    if (!xdr)
      throw new Error("No XDR returned from agreement API");
    
    // 2. verify wallet connection or prompt user to connect
    await validateWalletConnection();
    
    // 3. sign transaction via unified signer (Stellar Wallets Kit)
    const signedResult = await unifiedSign(xdr as string, STELLAR_NETWORK_PASSPHRASE, walletAddress ?? undefined);
    if (!signedResult?.signedTxXdr) {
      throw new Error("Transaction signing failed (no XDR returned)");
    }

    // 4. send signed transaction to backend for submission
    const sendRes = await sendTransaction(signedResult.signedTxXdr);
    if (!sendRes.success)
      throw new Error(sendRes.error || "Transaction send failed");

    async function validateWalletConnection() {
      let currentAddress = walletAddress;
      if (!currentAddress) {
        await new Promise((resolve, reject) => {
          openWalletModal((addr) => {
            if (addr) {
              currentAddress = addr;
              resolve(addr);
            } else {
              reject(new Error("Wallet connection cancelled or failed"));
            }
          });
        });
      }
      if (!currentAddress)
        throw new Error("Wallet connection required to sign transaction");
    }
  }
