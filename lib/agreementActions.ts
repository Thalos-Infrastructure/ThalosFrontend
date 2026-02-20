import { createAgreement, sendTransaction, AgreementPayload } from "@/services/trustlessworkService";

export interface CreateAndSignAgreementParams {
  payload: AgreementPayload;
  walletAddress: string | null;
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>;
  signTransaction: (xdr: string, opts: { networkPassphrase: string; address: string }) => Promise<any>;
  setCreating: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setSubmitted: (v: boolean) => void;
}

export async function createAndSignAgreement({
  payload,
  walletAddress,
  openWalletModal,
  signTransaction,
  setCreating,
  setError,
  setSubmitted,
}: CreateAndSignAgreementParams) {
  setCreating(true);
  setError(null);
  try {
    // 1. create agreement and get unsigned XDR
    const agreementRes = await createAgreement(payload);
    if (!agreementRes.success) throw new Error(agreementRes.error || "Agreement creation failed");
    const xdr = agreementRes.data?.unsignedTransaction;
    if (!xdr) throw new Error("No XDR returned from agreement API");
    // 2. verify wallet connection or prompt user to connect
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
    if (!currentAddress) throw new Error("Wallet connection required to sign transaction");
    // 3. sign transaction with connected wallet
    const signedResult = await signTransaction(xdr, {
      networkPassphrase: "Test SDF Network ; September 2015",
      address: currentAddress,
    });
    if (!signedResult?.signedTxXdr) {
      if (signedResult?.error) {
        throw new Error("Freighter error: " + signedResult.error);
      }
      throw new Error("Transaction signing failed (no XDR returned)");
    }
    // 4. send signed transaction to backend for submission
    const sendRes = await sendTransaction(signedResult.signedTxXdr);
    if (!sendRes.success) throw new Error(sendRes.error || "Transaction send failed");
    setSubmitted(true);
  } catch (e: any) {
    setError(e.message || "Unknown error");
  } finally {
    setCreating(false);
  }
}
