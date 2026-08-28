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

type MigrationSource = "backend" | "original";
type RoutedResponse<T = unknown> = AgreementResponse<T> & { source: MigrationSource };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
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

export async function createAgreement(
  payload: AgreementPayload,
  token?: string,
): Promise<RoutedResponse<{ unsignedTransaction: string }>> {
  return route<{ unsignedTransaction: string }>(
    "createAgreement",
    () => nestWrite(token, (resolvedToken) =>
      escrowApi.buildCreateEscrow(createEscrowDto(payload), resolvedToken)),
    () => originalService.createAgreement(payload),
  );
}

export async function fundEscrow(
  contractId: string,
  signer: string,
  amount: number,
  type: ServiceType,
  token?: string,
): Promise<RoutedResponse> {
  return route(
    "fundEscrow",
    () => nestWrite(token, (resolvedToken) => escrowApi.buildFundEscrow(
      { contractId, signer, amount, type },
      resolvedToken,
    )),
    () => originalService.fundEscrow(contractId, signer, amount, type),
  );
}

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
