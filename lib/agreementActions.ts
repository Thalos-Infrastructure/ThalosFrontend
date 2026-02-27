import { createAgreement, sendTransaction, AgreementPayload, fundEscrow, AgreementResponse, changeMilestoneStatus } from "@/services/trustlessworkService";

export interface CreateAndSignAgreementParams {
  payload: AgreementPayload;
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

export async function createAndSignAgreement({
  payload,
  walletAddress,
  openWalletModal,
  signTransaction,
  setCreating,
  setError,
  setSubmitted,
  onSuccess,
}: CreateAndSignAgreementParams) {
  setCreating(true);
  setError(null);
  try {
    // 1. create agreement and get unsigned XDR
    const response = await createAgreement(payload);
    await processTransaction(response, "Agreement creation failed", walletAddress, openWalletModal);
    setSubmitted(true);
    // 2. notify caller so they can add the agreement to state immediately
    onSuccess?.();
  } catch (e: any) {
    setError(e.message || "Unknown error");
  } finally {
    setCreating(false);
  }
}

export async function fundAndSignEscrow({
  contractId,
  amount,
  walletAddress,
  openWalletModal,
  signTransaction,
  setFunding,
  setError,
  setSuccess,
}: FundAndSignEscrowParams) {
  setFunding(true);
  setError(null);
  setSuccess(false);
  try {
    const serviceType = (typeof arguments[0].serviceType === "string") ? arguments[0].serviceType : "single-release";
    if (!walletAddress) {
      throw new Error("Wallet address is required to fund escrow");
    }
    const response = await fundEscrow(contractId, walletAddress, Number(amount), serviceType);
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
    
    // 3. sign transaction with connected wallet
    const { signTransaction } = await import("@stellar/freighter-api");
    const signedResult = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
    // TODO: VERIFY WHY THE SIGNING IS NOT WORKING WHEN PASSED THE ADDRESS (MAYBE FREIGHTER BUG OR CONFIG ISSUE).
    // It is working using await import("@stellar/freighter-api"); but it is not the expectation.
    /*
    const signedResult = await signTransaction(xdr, {
      networkPassphrase: "Test SDF Network ; September 2015",
      address: currentAddress,
    });
    */
    if (!signedResult?.signedTxXdr) {
      if (signedResult?.error) {
        throw new Error("Freighter error: " + signedResult.error);
      }
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

