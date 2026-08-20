/**
 * Per-operation cutover between direct Trustless Work calls and the Nest relay.
 * Routing is configured in `lib/config.ts`; every call emits one structured
 * completion event from `lib/telemetry/escrow-migration.ts`.
 */

import {
  ESCROW_MIGRATION_FLAGS,
  type EscrowMigrationOperation,
} from "@/lib/config";
import * as escrowApi from "@/lib/api/escrow";
import {
  emitEscrowMigrationTelemetry,
  type EscrowMigrationPath,
} from "@/lib/telemetry/escrow-migration";
import * as originalService from "./trustlessworkService";
import type {
  AgreementPayload,
  AgreementResponse,
  ServiceType,
} from "./trustlessworkService";

// Feature flags - set to false to disable migration for specific endpoints
// GF-2: Write operations gated behind flags. When ON, mutations go through
// the Nest backend (build unsigned XDR → sign client-side → submit via BE).
// When OFF, the original Trustless Work path is used (no regression).
const MIGRATION_FLAGS = {
  getEscrowsBySigner: true,
  getEscrowsByRole: true,
  // GF-2: escrow write mutations — enable when ready
  fundEscrow: false,
  approveMilestone: false,
  changeMilestoneStatus: false,
  releaseFunds: false,
  disputeMilestone: false,
  // createAgreement and sendTransaction are already routed through Nest
  // in agreementActions.ts (buildCreateEscrow / submitSignedTransaction)
}

function sourceFor(path: EscrowMigrationPath): MigrationSource {
  return path === "nest" ? "backend" : "original";
}

function storedAuthToken(explicitToken?: string): string | undefined {
  if (explicitToken) return explicitToken;
  if (typeof window === "undefined") return undefined;
  return window.localStorage.getItem("auth_token") ?? undefined;
}

function requireNestToken(token?: string): AgreementResponse<never> | string {
  return storedAuthToken(token) ?? {
    success: false,
    error: "Nest escrow writes require an authenticated wallet session",
  };
}

async function route<T>(
  operation: EscrowMigrationOperation,
  nestCall: () => Promise<AgreementResponse<T>>,
  trustlessWorkCall: () => Promise<AgreementResponse<T>>,
): Promise<RoutedResponse<T>> {
  const path: EscrowMigrationPath = ESCROW_MIGRATION_FLAGS[operation]
    ? "nest"
    : "trustless_work";
  const startedAt = Date.now();

  try {
    const result = await (path === "nest" ? nestCall() : trustlessWorkCall());
    const outcome = result.success ? "success" : "failure";
    emitEscrowMigrationTelemetry({
      operation,
      path,
      outcome,
      durationMs: Date.now() - startedAt,
      ...(result.error ? { error: result.error } : {}),
    });
    return { ...result, source: sourceFor(path) };
  } catch (error) {
    const message = errorMessage(error);
    emitEscrowMigrationTelemetry({
      operation,
      path,
      outcome: "failure",
      durationMs: Date.now() - startedAt,
      error: message,
    });
    return { success: false, error: message, source: sourceFor(path) };
  }
}

function createEscrowDto(payload: AgreementPayload): escrowApi.BackendCreateEscrowDto {
  const isMultiRelease = payload.serviceType === "multi-release";
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
    milestones: payload.milestones.map((milestone) => ({
      description: milestone.description,
      ...(isMultiRelease
        ? { amount: milestone.amount, status: milestone.status }
        : {}),
    })),
  };
}

function nestWrite<T>(
  token: string | undefined,
  call: (resolvedToken: string) => Promise<AgreementResponse<T>>,
): Promise<AgreementResponse<T>> {
  const resolved = requireNestToken(token);
  return typeof resolved === "string" ? call(resolved) : Promise.resolve(resolved);
}

export async function getEscrowsBySigner(
  signerAddress: string,
  token?: string,
): Promise<RoutedResponse<unknown[]>> {
  return route<unknown[]>(
    "getEscrowsBySigner",
    () => escrowApi.getEscrowsBySigner(signerAddress, token),
    () => originalService.getEscrowsBySigner(signerAddress),
  );
}

export interface GetEscrowsByRoleParams {
  address: string
  role: "sender" | "receiver" | "approver" | "service_provider"
  status?: string
  type?: ServiceType
}

export async function getEscrowsByRole(
  params: GetEscrowsByRoleParams,
  token?: string,
): Promise<RoutedResponse<unknown[]>> {
  const trustlessWorkRole = params.role === "service_provider"
    ? "serviceProvider"
    : params.role;

  return route<unknown[]>(
    "getEscrowsByRole",
    () => escrowApi.getEscrowsByRole(params, token),
    () => originalService.getEscrowsByRole({
      roleAddress: params.address,
      role: trustlessWorkRole,
      status: params.status,
      type: params.type,
    }),
  );
}

// ============================================================================
// WRITE MIGRATIONS — escrow mutations through Nest (GF-2)
// ============================================================================
// Each function tries the backend first when the flag is ON.
// Flow: backend build → unsigned XDR → caller signs → caller submits.
// When flag is OFF, falls back to the original TW service (no regression).
// ============================================================================

export async function fundEscrow(
  contractId: string,
  signer: string,
  amount: number,
  type: originalService.ServiceType,
  token?: string,
): Promise<originalService.AgreementResponse> {
  if (!token || !MIGRATION_FLAGS.fundEscrow) {
    console.log("[v0] MIGRATION: fundEscrow - using original TW path (flag OFF or no token)")
    return originalService.fundEscrow(contractId, signer, amount, type)
  }

  console.log("[v0] MIGRATION: Attempting BACKEND for fundEscrow", { contractId })
  const result = await escrowApi.buildFundEscrow(
    { contractId, signer, amount, type },
    token,
  )

  if (result.success && result.data) {
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for fundEscrow")
    return { success: true, data: result.data }
  }

  console.warn("[v0] MIGRATION: BACKEND error for fundEscrow, falling back to TW", { error: result.error })
  return originalService.fundEscrow(contractId, signer, amount, type)
}

export async function approveMilestone(
  contractId: string,
  milestoneIndex: string,
  approver: string,
  type: originalService.ServiceType,
  token?: string,
): Promise<originalService.AgreementResponse> {
  if (!token || !MIGRATION_FLAGS.approveMilestone) {
    console.log("[v0] MIGRATION: approveMilestone - using original TW path (flag OFF or no token)")
    return originalService.approveMilestone(contractId, milestoneIndex, approver, type)
  }

  console.log("[v0] MIGRATION: Attempting BACKEND for approveMilestone", { contractId, milestoneIndex })
  const result = await escrowApi.buildApproveMilestone(
    { contractId, milestoneIndex, approver, type },
    token,
  )

  if (result.success && result.data) {
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for approveMilestone")
    return { success: true, data: result.data }
  }

  console.warn("[v0] MIGRATION: BACKEND error for approveMilestone, falling back to TW", { error: result.error })
  return originalService.approveMilestone(contractId, milestoneIndex, approver, type)
}

export async function changeMilestoneStatus(
  contractId: string,
  milestoneIndex: string,
  newEvidence: string,
  newStatus: string,
  serviceProvider: string,
  type: originalService.ServiceType,
  token?: string,
): Promise<originalService.AgreementResponse> {
  if (!token || !MIGRATION_FLAGS.changeMilestoneStatus) {
    console.log("[v0] MIGRATION: changeMilestoneStatus - using original TW path (flag OFF or no token)")
    return originalService.changeMilestoneStatus(contractId, milestoneIndex, newEvidence, newStatus, serviceProvider, type)
  }

  console.log("[v0] MIGRATION: Attempting BACKEND for changeMilestoneStatus", { contractId, milestoneIndex })
  const result = await escrowApi.buildChangeMilestoneStatus(
    { contractId, milestoneIndex, newEvidence, newStatus, serviceProvider, type },
    token,
  )

  if (result.success && result.data) {
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for changeMilestoneStatus")
    return { success: true, data: result.data }
  }

  console.warn("[v0] MIGRATION: BACKEND error for changeMilestoneStatus, falling back to TW", { error: result.error })
  return originalService.changeMilestoneStatus(contractId, milestoneIndex, newEvidence, newStatus, serviceProvider, type)
}

export async function releaseFunds(
  contractId: string,
  releaseSigner: string,
  type: originalService.ServiceType,
  milestoneIndex?: string,
  token?: string,
): Promise<originalService.AgreementResponse> {
  if (!token || !MIGRATION_FLAGS.releaseFunds) {
    console.log("[v0] MIGRATION: releaseFunds - using original TW path (flag OFF or no token)")
    return originalService.releaseFunds(contractId, releaseSigner, type, milestoneIndex)
  }

  console.log("[v0] MIGRATION: Attempting BACKEND for releaseFunds", { contractId })
  const result = await escrowApi.buildReleaseFunds(
    { contractId, releaseSigner, type, milestoneIndex },
    token,
  )

  if (result.success && result.data) {
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for releaseFunds")
    return { success: true, data: result.data }
  }

  console.warn("[v0] MIGRATION: BACKEND error for releaseFunds, falling back to TW", { error: result.error })
  return originalService.releaseFunds(contractId, releaseSigner, type, milestoneIndex)
}

export async function disputeMilestone(
  contractId: string,
  milestoneIndex: string,
  signer: string,
  token?: string,
): Promise<originalService.AgreementResponse<{ unsignedTransaction: string }>> {
  if (!token || !MIGRATION_FLAGS.disputeMilestone) {
    console.log("[v0] MIGRATION: disputeMilestone - using original TW path (flag OFF or no token)")
    return originalService.disputeMilestone(contractId, milestoneIndex, signer)
  }

  console.log("[v0] MIGRATION: Attempting BACKEND for disputeMilestone", { contractId, milestoneIndex })
  const result = await escrowApi.buildDisputeMilestone(
    { contractId, type: "multi-release", milestoneIndex, signer },
    token,
  )

  if (result.success && result.data) {
    console.log("[v0] MIGRATION: SUCCESS using BACKEND for disputeMilestone")
    return { success: true, data: result.data }
  }

  console.warn("[v0] MIGRATION: BACKEND error for disputeMilestone, falling back to TW", { error: result.error })
  return originalService.disputeMilestone(contractId, milestoneIndex, signer)
}

// createAgreement is already routed through Nest in agreementActions.ts
// (buildCreateEscrow → sign → submitSignedTransaction)
export const createAgreement = originalService.createAgreement

// sendTransaction is already routed through Nest in agreementActions.ts
// (submitSignedTransaction via lib/api/escrow.ts)
export const sendTransaction = originalService.sendTransaction

export async function approveMilestone(
  contractId: string,
  milestoneIndex: string,
  approver: string,
  type: ServiceType,
  token?: string,
): Promise<RoutedResponse> {
  return route(
    "approveMilestone",
    () => nestWrite(token, (resolvedToken) => escrowApi.buildApproveMilestone(
      { contractId, milestoneIndex, approver, type },
      resolvedToken,
    )),
    () => originalService.approveMilestone(contractId, milestoneIndex, approver, type),
  );
}

export async function changeMilestoneStatus(
  contractId: string,
  milestoneIndex: string,
  newEvidence: string,
  newStatus: string,
  serviceProvider: string,
  type: ServiceType,
  token?: string,
): Promise<RoutedResponse> {
  return route(
    "changeMilestoneStatus",
    () => nestWrite(token, (resolvedToken) => escrowApi.buildChangeMilestoneStatus(
      { contractId, milestoneIndex, newEvidence, newStatus, serviceProvider, type },
      resolvedToken,
    )),
    () => originalService.changeMilestoneStatus(
      contractId,
      milestoneIndex,
      newEvidence,
      newStatus,
      serviceProvider,
      type,
    ),
  );
}

export async function releaseFunds(
  contractId: string,
  releaseSigner: string,
  type: ServiceType,
  milestoneIndex?: string,
  token?: string,
): Promise<RoutedResponse> {
  return route(
    "releaseFunds",
    () => nestWrite(token, (resolvedToken) => escrowApi.buildReleaseFunds(
      { contractId, releaseSigner, type, milestoneIndex },
      resolvedToken,
    )),
    () => originalService.releaseFunds(contractId, releaseSigner, type, milestoneIndex),
  );
}

export async function disputeMilestone(
  contractId: string,
  milestoneIndex: string,
  signer: string,
  token?: string,
): Promise<RoutedResponse<{ unsignedTransaction: string }>> {
  return route(
    "disputeMilestone",
    () => nestWrite(token, (resolvedToken) => escrowApi.buildDisputeMilestone(
      { contractId, milestoneIndex, signer, type: "multi-release" },
      resolvedToken,
    )),
    () => originalService.disputeMilestone(contractId, milestoneIndex, signer),
  );
}

export async function sendTransaction(
  signedXdr: string,
  token?: string,
): Promise<RoutedResponse> {
  return route(
    "sendTransaction",
    () => nestWrite(token, (resolvedToken) =>
      escrowApi.submitSignedTransaction(signedXdr, resolvedToken)),
    () => originalService.sendTransaction(signedXdr),
  );
}

export type {
  AgreementPayload,
  AgreementResponse,
  Escrow,
  EscrowFlags,
  EscrowInconsistencies,
  EscrowMilestone,
  EscrowRole,
  EscrowTrustline,
  ServiceType,
} from "./trustlessworkService";
