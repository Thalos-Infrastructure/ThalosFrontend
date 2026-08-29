import { apiRequest, type ApiResponse } from "./client"
import type { MilestoneStatus, AgreementStatus } from "@/lib/types/status"

export interface Milestone {
  description: string
  amount: string
  status: MilestoneStatus
}

export interface Escrow {
  id: string
  contract_id: string
  title: string
  description: string
  amount: string
  balance: string
  platform_fee: string
  payer: string
  payee: string
  approver?: string
  release_signer?: string
  dispute_resolver?: string
  milestones: Milestone[]
  status: AgreementStatus
  created_at: string
  funded_at?: string
  completed_at?: string
}

// ============================================================================
// Backend escrow WRITE relay (Trustless Work behind the Thalos backend)
// ----------------------------------------------------------------------------
// These match the real NestJS routes under /v1/escrows and their DTOs exactly.
// The ValidationPipe uses forbidNonWhitelisted, so send ONLY these fields — the
// backend injects platformAddress/disputeResolver/engagementId/trustline itself.
// Build endpoints return an UNSIGNED transaction; the wallet signs it client-side
// and the signed XDR is submitted via submitSignedTransaction (send-transaction).
// ============================================================================

export type EscrowServiceType = "single-release" | "multi-release"

export interface BackendEscrowRoles {
  approver: string
  serviceProvider: string
  releaseSigner: string
  receiver?: string // required for single-release
}

export interface BackendCreateMilestone {
  description: string
  amount?: string
  status?: string
}

export interface BackendCreateEscrowDto {
  title: string
  description: string
  amount: string
  platformFee: string
  signer: string // must equal the JWT user's wallet (assertSignerWallet)
  serviceType: EscrowServiceType
  roles: BackendEscrowRoles
  milestones: BackendCreateMilestone[]
}

// POST /v1/escrows/create -> { unsignedTransaction }
export async function buildCreateEscrow(
  dto: BackendCreateEscrowDto,
  token: string,
): Promise<ApiResponse<{ unsignedTransaction: string }>> {
  return apiRequest<{ unsignedTransaction: string }>(
    "/escrows/create",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

// POST /v1/escrows/send-transaction -> TW submission result
export async function submitSignedTransaction(
  signedXdr: string,
  token: string,
): Promise<ApiResponse<unknown>> {
  return apiRequest<unknown>(
    "/escrows/send-transaction",
    { method: "POST", body: JSON.stringify({ signedXdr }) },
    token,
  )
}

export interface BackendFundEscrowDto {
  contractId: string
  signer: string
  amount: number
  type: EscrowServiceType
}

export interface BackendApproveMilestoneDto {
  contractId: string
  milestoneIndex: string
  approver: string
  type: EscrowServiceType
}

export interface BackendChangeMilestoneStatusDto {
  contractId: string
  milestoneIndex: string
  newEvidence: string
  newStatus: string
  serviceProvider: string
  type: EscrowServiceType
}

export interface BackendReleaseFundsDto {
  contractId: string
  releaseSigner: string
  type: EscrowServiceType
  milestoneIndex?: string
}

export interface BackendDisputeMilestoneDto {
  contractId: string
  type: EscrowServiceType
  milestoneIndex?: string
  signer: string
}

type UnsignedTransaction = { unsignedTransaction: string }

// The operation names and DTOs below mirror ThalosBackend's EscrowsController.
export async function buildFundEscrow(
  dto: BackendFundEscrowDto,
  token: string,
): Promise<ApiResponse<UnsignedTransaction>> {
  return apiRequest<UnsignedTransaction>(
    "/escrows/fund",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export async function buildApproveMilestone(
  dto: BackendApproveMilestoneDto,
  token: string,
): Promise<ApiResponse<UnsignedTransaction>> {
  return apiRequest<UnsignedTransaction>(
    "/escrows/approve-milestone",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export async function buildChangeMilestoneStatus(
  dto: BackendChangeMilestoneStatusDto,
  token: string,
): Promise<ApiResponse<UnsignedTransaction>> {
  return apiRequest<UnsignedTransaction>(
    "/escrows/change-milestone-status",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export async function buildReleaseFunds(
  dto: BackendReleaseFundsDto,
  token: string,
): Promise<ApiResponse<UnsignedTransaction>> {
  return apiRequest<UnsignedTransaction>(
    "/escrows/release",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export async function buildDisputeMilestone(
  dto: BackendDisputeMilestoneDto,
  token: string,
): Promise<ApiResponse<UnsignedTransaction>> {
  return apiRequest<UnsignedTransaction>(
    "/escrows/dispute",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

// ============================================================================
// NEW ENDPOINTS - Migration from trustlessworkService
// ============================================================================

// Get escrows where user is a signer.
// `token` is optional: the backend exposes this read as @Public() (escrows are
// public on-chain data), so it works for a wallet that has not logged in yet.
// `apiRequest` simply omits the Authorization header when there is no token.
export async function getEscrowsBySigner(
  address: string,
  token?: string
): Promise<ApiResponse<Escrow[]>> {
  return apiRequest<Escrow[]>(
    `/escrows/by-signer/${address}`,
    { method: "GET" },
    token
  )
}

// Get escrows by role with filters
export interface GetEscrowsByRoleParams {
  address: string
  role?: "sender" | "receiver" | "approver" | "service_provider"
  status?: string
  type?: "single-release" | "multi-release"
}

// `token` optional for the same reason as getEscrowsBySigner above.
export async function getEscrowsByRole(
  params: GetEscrowsByRoleParams,
  token?: string
): Promise<ApiResponse<Escrow[]>> {
  const queryParams = new URLSearchParams({ address: params.address })
  if (params.role) queryParams.set("role", params.role)
  if (params.status) queryParams.set("status", params.status)
  if (params.type) queryParams.set("type", params.type)

  return apiRequest<Escrow[]>(
    `/escrows/by-role?${queryParams.toString()}`,
    { method: "GET" },
    token
  )
}
