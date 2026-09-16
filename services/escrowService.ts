import * as escrowApi from "@/lib/api/escrow"
import { emitEscrowTelemetry, type EscrowOperation } from "@/lib/telemetry/escrow"
import type { AgreementPayload, AgreementResponse, ServiceType } from "./escrow.types"

/**
 * Every escrow operation goes through the Thalos Nest backend, which relays to
 * Trustless Work with a server-side API key.
 *
 * The browser used to call Trustless Work directly, selected per operation by
 * `NEXT_PUBLIC_ESCROW_MIGRATION_*` flags. That path is gone: it shipped the API
 * key in the client bundle, had no retry/backstop, no rate limiting, and no
 * place to enforce authorization. Do not reintroduce a direct-to-Trustless-Work
 * call here or anywhere else in the frontend.
 */

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error"
}

function storedAuthToken(explicitToken?: string): string | undefined {
  if (explicitToken) return explicitToken
  if (typeof window === "undefined") return undefined
  return window.localStorage.getItem("auth_token") ?? undefined
}

function requireToken(token?: string): AgreementResponse<never> | string {
  return (
    storedAuthToken(token) ?? {
      success: false,
      error: "Escrow writes require an authenticated wallet session",
    }
  )
}

/** Runs the call, emits one telemetry record, and never throws. */
async function run<T>(
  operation: EscrowOperation,
  call: () => Promise<AgreementResponse<T>>,
): Promise<AgreementResponse<T>> {
  const startedAt = Date.now()
  try {
    const result = await call()
    emitEscrowTelemetry({
      operation,
      outcome: result.success ? "success" : "failure",
      durationMs: Date.now() - startedAt,
      ...(result.error ? { error: result.error } : {}),
    })
    return result
  } catch (error) {
    const message = errorMessage(error)
    emitEscrowTelemetry({
      operation,
      outcome: "failure",
      durationMs: Date.now() - startedAt,
      error: message,
    })
    return { success: false, error: message }
  }
}

/** Writes need the app JWT; reads are public and take it only when available. */
function write<T>(
  operation: EscrowOperation,
  token: string | undefined,
  call: (resolvedToken: string) => Promise<AgreementResponse<T>>,
): Promise<AgreementResponse<T>> {
  const resolved = requireToken(token)
  if (typeof resolved !== "string") return Promise.resolve(resolved)
  return run(operation, () => call(resolved))
}

function createEscrowDto(payload: AgreementPayload): escrowApi.BackendCreateEscrowDto {
  const isMultiRelease = payload.serviceType === "multi-release"
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
      ...(isMultiRelease ? { amount: milestone.amount, status: milestone.status } : {}),
    })),
  }
}

export async function getEscrowsBySigner(
  signerAddress: string,
  token?: string,
): Promise<AgreementResponse<unknown[]>> {
  return run("getEscrowsBySigner", () => escrowApi.getEscrowsBySigner(signerAddress, token))
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
): Promise<AgreementResponse<unknown[]>> {
  return run("getEscrowsByRole", () => escrowApi.getEscrowsByRole(params, token))
}

export async function createAgreement(
  payload: AgreementPayload,
  token?: string,
): Promise<AgreementResponse<{ unsignedTransaction: string }>> {
  return write("createAgreement", token, (resolvedToken) =>
    escrowApi.buildCreateEscrow(createEscrowDto(payload), resolvedToken),
  )
}

export async function fundEscrow(
  contractId: string,
  signer: string,
  amount: number,
  type: ServiceType,
  token?: string,
): Promise<AgreementResponse> {
  return write("fundEscrow", token, (resolvedToken) =>
    escrowApi.buildFundEscrow({ contractId, signer, amount, type }, resolvedToken),
  )
}

export async function approveMilestone(
  contractId: string,
  milestoneIndex: string,
  approver: string,
  type: ServiceType,
  token?: string,
): Promise<AgreementResponse> {
  return write("approveMilestone", token, (resolvedToken) =>
    escrowApi.buildApproveMilestone({ contractId, milestoneIndex, approver, type }, resolvedToken),
  )
}

export async function changeMilestoneStatus(
  contractId: string,
  milestoneIndex: string,
  newEvidence: string,
  newStatus: string,
  serviceProvider: string,
  type: ServiceType,
  token?: string,
): Promise<AgreementResponse> {
  return write("changeMilestoneStatus", token, (resolvedToken) =>
    escrowApi.buildChangeMilestoneStatus(
      { contractId, milestoneIndex, newEvidence, newStatus, serviceProvider, type },
      resolvedToken,
    ),
  )
}

export async function releaseFunds(
  contractId: string,
  releaseSigner: string,
  type: ServiceType,
  milestoneIndex?: string,
  token?: string,
): Promise<AgreementResponse> {
  return write("releaseFunds", token, (resolvedToken) =>
    escrowApi.buildReleaseFunds({ contractId, releaseSigner, type, milestoneIndex }, resolvedToken),
  )
}

export async function disputeMilestone(
  contractId: string,
  milestoneIndex: string,
  signer: string,
  token?: string,
  type: ServiceType = "multi-release",
): Promise<AgreementResponse<{ unsignedTransaction: string }>> {
  return write("disputeMilestone", token, (resolvedToken) =>
    escrowApi.buildDisputeMilestone({ contractId, milestoneIndex, signer, type }, resolvedToken),
  )
}

export async function sendTransaction(
  signedXdr: string,
  token?: string,
): Promise<AgreementResponse> {
  return write("sendTransaction", token, (resolvedToken) =>
    escrowApi.submitSignedTransaction(signedXdr, resolvedToken),
  )
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
} from "./escrow.types"
