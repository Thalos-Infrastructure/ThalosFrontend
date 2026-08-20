import { AgreementPayload, AgreementResponse, ServiceType } from "@/services/trustlessworkService";
import { fundEscrow, approveMilestone, changeMilestoneStatus, releaseFunds, disputeMilestone } from "@/services/escrowMigration";
import { buildCreateEscrow, submitSignedTransaction, type BackendCreateEscrowDto } from "@/lib/api/escrow";
import { signEscrowOperation, type EscrowOperation, type EscrowRolesInfo, type TxStatus } from "@/lib/signing";
import { linkWallet } from "@/lib/api/wallets";
import {
  createAgreement as createAgreementRecord,
  type CreateAgreementInput,
  type ParticipantRole,
} from "@/lib/api/agreements";

export interface CreateAndSignAgreementParams {
  payload: AgreementPayload;
  /** App JWT (from useAuthStore). Required: escrow creation now goes through the Thalos backend. */
  token: string | null;
  walletAddress: string | null;
  setCreating: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setSubmitted: (v: boolean) => void;
  /** Transaction progress for the UI: building → signing → submitting → confirmed. */
  onStatus?: (status: TxStatus) => void;
  onSuccess?: (agreementId?: string) => void;
}

export interface FundAndSignEscrowParams {
  contractId: string;
  amount: string;
  walletAddress: string | null;
  serviceType?: ServiceType;
  /** App JWT — required for routing through the Nest backend (GF-2). */
  token?: string | null;
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>;
  setFunding: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setSuccess: (v: boolean) => void;
  onStatus?: (status: TxStatus) => void;
}

export interface ChangeMilestoneStatusParams {
  contractId: string;
  milestoneIndex: string;
  newEvidence: string;
  newStatus: string;
  serviceProvider: string;
  serviceType: ServiceType;
  walletAddress: string | null;
  /** App JWT — required for routing through the Nest backend (GF-2). */
  token?: string | null;
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>;
  setSubmitting: (v: boolean) => void;
  setError: (msg: string | null) => void;
  onStatus?: (status: TxStatus) => void;
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

/**
 * Maps the wizard payload and the deployed contract onto the backend's agreement
 * record.
 *
 * `POST /v1/agreements` is the ONLY thing that writes `agreements` +
 * `agreement_participants` and emits `AGREEMENT_EVENTS.CREATED`, which the
 * notifications listener turns into email. Deploying through `/v1/escrows/create`
 * does none of that — it only relays to Trustless Work. Skipping this call is why
 * agreements created from the dashboard never produced a notification.
 */
function toAgreementRecord(
  payload: AgreementPayload,
  createdBy: string,
  contractId?: string,
): CreateAgreementInput {
  // Only roles that map to a real person become participants. `platformAddress`
  // is ours, so including it would just add a row that resolves to no profile.
  const roleMap: Array<[string, ParticipantRole]> = [
    ["receiver", "payee"],
    ["serviceProvider", "payee"],
    ["approver", "approver"],
    ["disputeResolver", "dispute_resolver"],
    ["releaseSigner", "payer"],
  ];

  // The creator is always a participant; the rest are deduped against it, since
  // one wallet commonly holds several roles and the backend emails per wallet.
  const seen = new Set<string>([createdBy]);
  const participants: CreateAgreementInput["participants"] = [
    { wallet_address: createdBy, role: "payer" },
  ];
  for (const [roleKey, role] of roleMap) {
    const wallet = payload.roles?.[roleKey];
    if (!wallet || seen.has(wallet)) continue;
    seen.add(wallet);
    participants.push({ wallet_address: wallet, role });
  }

  return {
    ...(contractId ? { contract_id: contractId } : {}),
    title: payload.title,
    description: payload.description,
    amount: payload.amount,
    asset: "USDC",
    agreement_type: payload.serviceType === "multi-release" ? "multi" : "single",
    milestones: payload.milestones.map((m) => ({
      description: m.description,
      amount: m.amount,
      status: m.status === "approved" || m.status === "released" ? m.status : "pending",
    })),
    created_by: createdBy,
    participants,
  };
}

/** Trustless Work returns the deployed contract id on the submit response. */
function contractIdFrom(sendResult: unknown): string | undefined {
  if (!sendResult || typeof sendResult !== "object") return undefined;
  const id = (sendResult as { contractId?: unknown }).contractId;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

/**
 * Writes the agreement record after the escrow is live on-chain.
 *
 * Deliberately non-fatal: the escrow already exists and the user's funds path is
 * unaffected, so a failure here must not report the creation as failed. It is
 * logged loudly instead — a silent miss here is precisely why the missing
 * notifications went unnoticed for so long.
 */
async function persistAgreementRecord(
  payload: AgreementPayload,
  createdBy: string,
  contractId: string | undefined,
  token: string,
): Promise<string | undefined> {
  try {
    const res = await createAgreementRecord(toAgreementRecord(payload, createdBy, contractId), token);
    if (!res.success || !res.data) {
      console.error(
        "[agreements] escrow deployed but the agreement record did NOT persist — no participants, no notification:",
        res.error,
      );
      return undefined;
    }
    console.info("[agreements] agreement persisted, creation event emitted", { agreementId: res.data.id, contractId });
    return res.data.id;
  } catch (e) {
    console.error(
      "[agreements] escrow deployed but the agreement record did NOT persist — no participants, no notification:",
      e,
    );
    return undefined;
  }
}

export async function createAndSignAgreement({
  payload,
  token,
  walletAddress,
  setCreating,
  setError,
  setSubmitted,
  onStatus,
  onSuccess,
}: CreateAndSignAgreementParams): Promise<string | undefined> {
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
    onStatus?.("building");
    const build = await buildCreateEscrow(toCreateEscrowDto(payload), token);
    if (!build.success || !build.data?.unsignedTransaction) {
      throw new Error(build.error || "Agreement creation failed");
    }

    // 2. Sign with the wallet and 3. submit the signed XDR through the backend.
    const { signerAddress, contractId } = await signAndSubmitViaBackend(
      build.data.unsignedTransaction,
      token,
      walletAddress,
      onStatus,
    );

    // 4. Persist the agreement so participants, activity and the email
    //    notification happen. Non-fatal — see persistAgreementRecord.
    const agreementId = await persistAgreementRecord(payload, signerAddress, contractId, token);

    onStatus?.("confirmed");
    setSubmitted(true);
    onSuccess?.(agreementId);
    return agreementId;
  } catch (e: any) {
    onStatus?.("error");
    setError(e.message || "Unknown error");
  } finally {
    setCreating(false);
  }
  return undefined;
}

/**
 * Unified sign + submit path for escrow creation.
 *
 * Ensures a wallet is connected, signs the unsigned XDR via the unified signer
 * (lib/signing dispatch), and submits through the Thalos backend
 * (/v1/escrows/send-transaction) so Trustless Work indexes state.
 *
 * The Kit wallet is also persisted to `user_wallets` so it shows up in the
 * multi-wallet UI alongside the custodial wallet.
 *
 * Returns the signer and the deployed contract id, both of which the caller needs
 * to write the agreement record.
 */
async function signAndSubmitViaBackend(
  unsignedXdr: string,
  token: string,
  walletAddress: string | null,
  onStatus?: (status: TxStatus) => void,
): Promise<{ signerAddress: string; contractId?: string }> {
  const currentAddress = requireWalletAddress(walletAddress);

  // Persist the Kit wallet to user_wallets (non-fatal)
  await persistKitWallet(currentAddress, token);

  const signedResult = await signEscrowOperation({
    xdr: unsignedXdr,
    operation: "create",
    address: currentAddress,
    onStatus,
  });

  onStatus?.("submitting");
  const sendRes = await submitSignedTransaction(signedResult.signedTxXdr, token);
  if (!sendRes.success) throw new Error(sendRes.error || "Transaction send failed");

  return { signerAddress: currentAddress, contractId: contractIdFrom(sendRes.data) };
}

export async function fundAndSignEscrow({
  contractId,
  amount,
  walletAddress,
  serviceType = "single-release",
  token,
  openWalletModal,
  setFunding,
  setError,
  setSuccess,
  onStatus,
}: FundAndSignEscrowParams) {
  setFunding(true);
  setError(null);
  setSuccess(false);
  try {
    if (!walletAddress) {
      throw new Error("Wallet address is required to fund escrow");
    }
    onStatus?.("building");
    // GF-2: route through migration layer — when flag ON, builds unsigned XDR
    // via Nest backend instead of calling Trustless Work directly from the browser.
    const response = await fundEscrow(contractId, walletAddress, Number(amount), serviceType, token ?? undefined);
    await processTransaction(response, "Fund escrow failed", walletAddress, openWalletModal, {
      operation: "fund",
      onStatus,
    }, token);
    onStatus?.("confirmed");
    setSuccess(true);
  } catch (e: any) {
    onStatus?.("error");
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
  token,
  openWalletModal,
  setSubmitting,
  setError,
  onStatus,
  onSuccess,
}: ChangeMilestoneStatusParams) {
  setSubmitting(true);
  setError(null);
  try {
    onStatus?.("building");
    // GF-2: route through migration layer — when flag ON, builds unsigned XDR
    // via Nest backend instead of calling Trustless Work directly from the browser.
    const response = await changeMilestoneStatus(
      contractId,
      milestoneIndex,
      newEvidence,
      newStatus,
      serviceProvider,
      serviceType,
      token ?? undefined,
    );
    await processTransaction(response, "Change milestone status failed", walletAddress, {
      operation: "changeMilestoneStatus",
      roles: { serviceProvider },
      onStatus,
    }, token);
    onStatus?.("confirmed");
    onSuccess?.();
  } catch (e: any) {
    onStatus?.("error");
    setError(e.message || "Unknown error");
  } finally {
    setSubmitting(false);
  }
}

/**
 * Unified transaction processing — validates the Trustless Work role, signs via
 * the unified signer and submits through the Thalos backend when a token is
 * available (GF-2), falling back to Trustless Work's send-transaction endpoint.
 */
async function processTransaction(
  response: AgreementResponse<unknown>,
  errorMessage: string,
  walletAddress: string | null,
  opts: {
    operation: EscrowOperation;
    roles?: EscrowRolesInfo;
    onStatus?: (status: TxStatus) => void;
  },
  token?: string | null,
) {
  if (!response.success)
    throw new Error(response.error || errorMessage);

  const xdr = response.data?.unsignedTransaction;
  if (!xdr)
    throw new Error("No XDR returned from agreement API");

  const currentAddress = requireWalletAddress(walletAddress);

  const signedResult = await signEscrowOperation({
    xdr: xdr as string,
    operation: opts.operation,
    address: currentAddress,
    roles: opts.roles,
    onStatus: opts.onStatus,
  });

  opts.onStatus?.("submitting");
  // GF-2: when token is available, submit through the Nest backend
  // (keeps API key server-side and maintains auth audit trail).
  // When no token, fall back to the original TW helper (wallet-only mode).
  let sendRes;
  if (token) {
    sendRes = await submitSignedTransaction(signedResult.signedTxXdr, token);
  } else {
    const { sendTransaction } = await import("@/services/trustlessworkService");
    sendRes = await sendTransaction(signedResult.signedTxXdr);
  }
  if (!sendRes.success)
    throw new Error(sendRes.error || "Transaction send failed");
}

/** Resolve the connected wallet address, prompting the connect modal if needed. */
/**
 * The address to sign with. Every wallet now arrives through Pollar, so it is
 * already on the session by the time any escrow action runs — there is nothing
 * left to connect on demand, and a missing address means the session went away.
 */
function requireWalletAddress(walletAddress: string | null): string {
  if (!walletAddress) {
    throw new Error("Inicia sesión para firmar esta operación.");
  }
  return walletAddress;
}
