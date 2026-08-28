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

export interface CreateEscrowData {
  title: string
  description: string
  amount: string
  payee: string
  approver?: string
  milestones?: Array<{ description: string; amount: string }>
  release_signer?: string
  dispute_resolver?: string
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

// Initialize/deploy a new escrow contract
export async function initializeEscrow(
  data: CreateEscrowData,
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(
    "/escrow/initialize",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  )
}

// Get escrow by contract ID
export async function getEscrow(
  contractId: string,
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(`/escrow/${contractId}`, { method: "GET" }, token)
}

// Get all escrows for user (as payer, payee, or approver)
export async function getMyEscrows(token: string): Promise<ApiResponse<Escrow[]>> {
  return apiRequest<Escrow[]>("/escrow/my-escrows", { method: "GET" }, token)
}

// Fund escrow
export async function fundEscrow(
  contractId: string,
  token: string
): Promise<ApiResponse<{ transaction_hash: string }>> {
  return apiRequest<{ transaction_hash: string }>(
    `/escrow/${contractId}/fund`,
    { method: "POST" },
    token
  )
}

// Submit evidence for milestone
export async function submitEvidence(
  contractId: string,
  milestoneIndex: number,
  evidence: { description: string; files?: string[] },
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(
    `/escrow/${contractId}/milestones/${milestoneIndex}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(evidence),
    },
    token
  )
}

// Approve milestone and release funds
export async function approveMilestone(
  contractId: string,
  milestoneIndex: number,
  token: string
): Promise<ApiResponse<{ transaction_hash: string }>> {
  return apiRequest<{ transaction_hash: string }>(
    `/escrow/${contractId}/milestones/${milestoneIndex}/approve`,
    { method: "POST" },
    token
  )
}

// Cancel escrow (before funding)
export async function cancelEscrow(
  contractId: string,
  token: string
): Promise<ApiResponse<Escrow>> {
  return apiRequest<Escrow>(
    `/escrow/${contractId}/cancel`,
    { method: "POST" },
    token
  )
}

// Get escrow balance from blockchain
export async function getEscrowBalance(
  contractId: string,
  token: string
): Promise<ApiResponse<{ xlm: string; usdc: string }>> {
  return apiRequest<{ xlm: string; usdc: string }>(
    `/escrow/${contractId}/balance`,
    { method: "GET" },
    token
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

// ============================================================================
// WRITE BUILD ENDPOINTS — escrow mutations through Nest (GF-2)
// ============================================================================
// These match the NestJS EscrowsController under /v1/escrows.
// Flow: build (BE) → sign (client) → send-transaction (BE).
// All return { unsignedTransaction } — signing stays client-side (non-custodial).
// ============================================================================

export interface BackendFundEscrowDto {
  contractId: string
  signer: string
  amount: number
  type: EscrowServiceType
}

// POST /v1/escrows/fund → { unsignedTransaction }
export async function buildFundEscrow(
  dto: BackendFundEscrowDto,
  token: string,
): Promise<ApiResponse<{ unsignedTransaction: string }>> {
  return apiRequest<{ unsignedTransaction: string }>(
    "/escrows/fund",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export interface BackendApproveMilestoneDto {
  contractId: string
  milestoneIndex: string
  approver: string
  type: EscrowServiceType
}

// POST /v1/escrows/approve-milestone → { unsignedTransaction }
export async function buildApproveMilestone(
  dto: BackendApproveMilestoneDto,
  token: string,
): Promise<ApiResponse<{ unsignedTransaction: string }>> {
  return apiRequest<{ unsignedTransaction: string }>(
    "/escrows/approve-milestone",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export interface BackendChangeMilestoneStatusDto {
  contractId: string
  milestoneIndex: string
  newEvidence: string
  newStatus: string
  serviceProvider: string
  type: EscrowServiceType
}

// POST /v1/escrows/change-milestone-status → { unsignedTransaction }
export async function buildChangeMilestoneStatus(
  dto: BackendChangeMilestoneStatusDto,
  token: string,
): Promise<ApiResponse<{ unsignedTransaction: string }>> {
  return apiRequest<{ unsignedTransaction: string }>(
    "/escrows/change-milestone-status",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export interface BackendReleaseFundsDto {
  contractId: string
  releaseSigner: string
  type: EscrowServiceType
  milestoneIndex?: string
}

// POST /v1/escrows/release → { unsignedTransaction }
export async function buildReleaseFunds(
  dto: BackendReleaseFundsDto,
  token: string,
): Promise<ApiResponse<{ unsignedTransaction: string }>> {
  return apiRequest<{ unsignedTransaction: string }>(
    "/escrows/release",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}

export interface BackendDisputeMilestoneDto {
  contractId: string
  type: EscrowServiceType
  milestoneIndex?: string
  signer: string
}

// POST /v1/escrows/dispute → { unsignedTransaction }
export async function buildDisputeMilestone(
  dto: BackendDisputeMilestoneDto,
  token: string,
): Promise<ApiResponse<{ unsignedTransaction: string }>> {
  return apiRequest<{ unsignedTransaction: string }>(
    "/escrows/dispute",
    { method: "POST", body: JSON.stringify(dto) },
    token,
  )
}
