import { API_URL } from "@/lib/config"

// Re-export types from actions for backwards compatibility
export type AgreementStatus = "pending" | "funded" | "active" | "completed" | "disputed" | "resolved" | "cancelled"
export type AgreementType = "single" | "multi" | "bounty"
export type ParticipantRole = "payer" | "payee" | "approver" | "dispute_resolver" | "validator"

export interface AgreementMilestone {
  description: string
  amount: string
  status: "pending" | "approved" | "released"
}

export interface Agreement {
  id: string
  contract_id: string | null
  title: string
  description: string | null
  amount: string
  asset: string
  status: AgreementStatus
  agreement_type: AgreementType
  milestones: AgreementMilestone[]
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
  funded_at: string | null
  completed_at: string | null
}

export interface AgreementParticipant {
  id: string
  agreement_id: string
  wallet_address: string
  role: ParticipantRole
  joined_at: string
}

export interface AgreementActivity {
  id: string
  agreement_id: string
  actor_wallet: string
  action: string
  details: Record<string, unknown>
  created_at: string
}

export interface CreateAgreementInput {
  contract_id?: string
  title: string
  description?: string
  amount: string
  asset?: string
  agreement_type?: AgreementType
  milestones?: AgreementMilestone[]
  metadata?: Record<string, unknown>
  created_by: string
  participants: { wallet_address: string; role: ParticipantRole }[]
}

export interface MutationResponse {
  success: boolean
  error?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Request failed" }
    }

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error"
    }
  }
}

// ============================================================================
// Agreement metadata (Nest: /v1/agreements — src/agreements/*)
// ============================================================================

export interface AgreementParticipantInput {
  wallet_address: string
  role: string
}

export interface CreateAgreementDto {
  contract_id?: string
  title: string
  description?: string
  amount: string
  asset?: string
  agreement_type?: string
  milestones?: Array<{ description: string; amount: string; status: "pending" | "approved" | "released" }>
  metadata?: Record<string, unknown>
  created_by: string
  participants: AgreementParticipantInput[]
}

export interface AgreementRecord {
  id: string
  contract_id: string | null
  title: string
  amount: string
  asset: string
  status: string
  [key: string]: unknown
}

// POST /agreements -> { agreement, error } on success; thrown 400 on failure
export async function createAgreementRecord(
  dto: CreateAgreementDto,
  token: string
): Promise<ApiResponse<{ agreement: AgreementRecord | null; error: string | null }>> {
  return apiRequest(
    "/agreements",
    { method: "POST", body: JSON.stringify(dto) },
    token
  )
}

// GET /agreements/by-contract/:contractId -> { agreement, error }, 200 even when not found
export async function getAgreementByContractId(
  contractId: string,
  token: string
): Promise<ApiResponse<{ agreement: AgreementRecord | null; error: string | null }>> {
  return apiRequest(
    `/agreements/by-contract/${encodeURIComponent(contractId)}`,
    { method: "GET" },
    token
  )
}

export interface FindOrCreateAgreementInput {
  contractId: string
  title: string
  amount: string
  asset?: string
  myWallet: string
  myRole: "payer" | "payee"
  counterpartyWallet: string
}

/**
 * Find the DB agreement UUID for a Trustless Work contract id, creating the
 * row (+ both participants) on first lookup. Both parties in an escrow query
 * Trustless Work independently and already converge on the same contractId,
 * so whichever of them opens chat first wins the create (adding both wallets
 * as participants immediately so the other party's later lookup is allowed
 * by Nest's participant check); the other's lookup just finds that row.
 */
export async function findOrCreateAgreementByContractId(
  input: FindOrCreateAgreementInput,
  token: string
): Promise<{ agreementId: string | null; error: string | null }> {
  const found = await getAgreementByContractId(input.contractId, token)
  if (!found.success) {
    return { agreementId: null, error: found.error || "Failed to look up agreement" }
  }
  if (found.data?.agreement) {
    return { agreementId: found.data.agreement.id, error: null }
  }

  const otherRole: "payer" | "payee" = input.myRole === "payer" ? "payee" : "payer"
  const created = await createAgreementRecord(
    {
      contract_id: input.contractId,
      title: input.title,
      amount: input.amount,
      asset: input.asset,
      agreement_type: "single",
      created_by: input.myWallet,
      participants: [
        { wallet_address: input.myWallet, role: input.myRole },
        { wallet_address: input.counterpartyWallet, role: otherRole },
      ],
    },
    token
  )

  if (created.success && created.data?.agreement) {
    return { agreementId: created.data.agreement.id, error: null }
  }

  // Lost a create race against the other party (or hit a transient error) — re-check once.
  const retry = await getAgreementByContractId(input.contractId, token)
  if (retry.success && retry.data?.agreement) {
    return { agreementId: retry.data.agreement.id, error: null }
  }

  return { agreementId: null, error: created.error || created.data?.error || "Failed to create agreement" }
}

// ============================================================================
// Agreement chat messages (Nest: GET/POST /v1/agreements/:agreementId/messages
// — src/agreement-chat/*). Confirmed against ThalosBackend source.
// ============================================================================

export interface AgreementMessage {
  id: string
  agreementId: string
  senderId: string | null
  senderWallet: string | null
  message: string
  createdAt: string
}

interface RawAgreementMessage {
  id: string
  agreement_id: string
  sender_id: string | null
  sender_wallet: string | null
  message: string
  created_at: string
}

function normalizeMessage(raw: RawAgreementMessage): AgreementMessage {
  return {
    id: raw.id,
    agreementId: raw.agreement_id,
    senderId: raw.sender_id,
    senderWallet: raw.sender_wallet,
    message: raw.message,
    createdAt: raw.created_at,
  }
}

// GET returns { messages: AgreementMessage[]; error: string | null } (200 even on a DB error)
export async function getAgreementMessages(
  agreementId: string,
  token: string
): Promise<ApiResponse<AgreementMessage[]>> {
  const res = await apiRequest<{ messages: RawAgreementMessage[]; error: string | null }>(
    `/agreements/${agreementId}/messages`,
    { method: "GET" },
    token
  )
  if (!res.success || !res.data) return { success: false, error: res.error }
  if (res.data.error) return { success: false, error: res.data.error }
  return { success: true, data: (res.data.messages || []).map(normalizeMessage) }
}

// POST requires sender_wallet — the Nest DTO validates it and the service checks it
// matches the JWT user's wallet_public_key (assertActorWallet), rejecting otherwise.
export async function sendAgreementMessage(
  agreementId: string,
  message: string,
  senderWallet: string,
  token: string
): Promise<ApiResponse<AgreementMessage>> {
  const res = await apiRequest<{ message: RawAgreementMessage | null; error: string | null }>(
    `/agreements/${agreementId}/messages`,
    { method: "POST", body: JSON.stringify({ message, sender_wallet: senderWallet }) },
    token
  )
  if (!res.success || !res.data) return { success: false, error: res.error }
  if (res.data.error || !res.data.message) return { success: false, error: res.data.error || "Failed to send message" }
  return { success: true, data: normalizeMessage(res.data.message) }
}

/**
 * Create a new agreement
 * Backend returns: { agreement, error }
 */
export async function createAgreement(
  input: CreateAgreementInput,
  token: string
): Promise<ApiResponse<Agreement>> {
  try {
    const response = await apiRequest<unknown>(
      "/agreements",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreement }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create agreement",
    }
  }
}

/**
 * Get all agreements (with optional filters)
 * Backend returns: { agreements, error }
 */
export async function getAgreements(
  params?: { status?: string; type?: string },
  token?: string
): Promise<ApiResponse<Agreement[]>> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.set("status", params.status)
    if (params?.type) queryParams.set("type", params.type)
    
    const query = queryParams.toString()
    const endpoint = query ? `/agreements?${query}` : "/agreements"

    const response = await apiRequest<unknown>(endpoint, { method: "GET" }, token)

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreements = (payload.agreements as Agreement[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreements }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreements",
    }
  }
}

/**
 * Get agreements by wallet address
 * Backend returns: { agreements, error }
 */
export async function getAgreementsByWallet(
  walletAddress: string,
  token?: string
): Promise<ApiResponse<Agreement[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/by-wallet?wallet=${encodeURIComponent(walletAddress)}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreements = (payload.agreements as Agreement[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreements }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreements",
    }
  }
}

/**
 * Get agreement by ID
 * Backend returns: { agreement, error }
 */
export async function getAgreement(
  agreementId: string,
  token?: string
): Promise<ApiResponse<Agreement>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreement }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreement",
    }
  }
}

/**
 * Update agreement status
 * Backend returns: { success, error } (HTTP 200 even if success=false)
 */
export async function updateAgreementStatusApi(
  agreementId: string,
  status: AgreementStatus,
  actorWallet: string,
  token: string
): Promise<ApiResponse<{ success: boolean; error?: string }>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, actor_wallet: actorWallet }),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = (payload.success as boolean) ?? true
    const error = payload.error as string | undefined

    if (!success) {
      return { success: false, error: error || "Failed to update status" }
    }

    return { success: true, data: { success, error } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update status",
    }
  }
}

/**
 * Update agreement milestone status
 * Backend returns: { success, error } (HTTP 200 even if success=false)
 * @param agreementId Agreement ID
 * @param milestoneIndex Index of milestone to update
 * @param status New status
 * @param actorWallet Wallet of the actor making the change
 * @param evidenceDescription Optional evidence description for the milestone
 * @param token JWT token
 */
export async function updateMilestoneStatus(
  agreementId: string,
  milestoneIndex: number,
  status: AgreementMilestone["status"],
  actorWallet: string,
  evidenceDescription?: string,
  token?: string
): Promise<ApiResponse<{ success: boolean; error?: string }>> {
  try {
    const body: Record<string, unknown> = {
      milestone_index: milestoneIndex,
      status,
      actor_wallet: actorWallet,
    }
    
    if (evidenceDescription) {
      body.evidence_description = evidenceDescription
    }

    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/milestones`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = (payload.success as boolean) ?? true
    const error = payload.error as string | undefined

    if (!success) {
      return { success: false, error: error || "Failed to update milestone" }
    }

    return { success: true, data: { success, error } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update milestone",
    }
  }
}

/**
 * Get activity log for an agreement
 * Backend returns: { activities, error }
 */
export async function getAgreementActivityApi(
  agreementId: string,
  token?: string
): Promise<ApiResponse<AgreementActivity[]>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/activity`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const activities = (payload.activities as AgreementActivity[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: activities }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch activity",
    }
  }
}

/**
 * Get agreement by contract ID
 * Backend returns: { agreement, error }
 */
export async function getAgreementByContractIdApi(
  contractId: string,
  token?: string
): Promise<ApiResponse<Agreement>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/by-contract/${contractId}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: agreement }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreement",
    }
  }
}

/**
 * Link contract to agreement
 * Backend returns: { success, error } (HTTP 200 even if success=false)
 */
export async function linkContractToAgreementApi(
  agreementId: string,
  contractId: string,
  actorWallet: string,
  token: string
): Promise<ApiResponse<{ success: boolean; error?: string }>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}/link-contract`,
      {
        method: "PATCH",
        body: JSON.stringify({ contract_id: contractId, actor_wallet: actorWallet }),
      },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const success = (payload.success as boolean) ?? true
    const error = payload.error as string | undefined

    if (!success) {
      return { success: false, error: error || "Failed to link contract" }
    }

    return { success: true, data: { success, error } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to link contract",
    }
  }
}

/**
 * Get agreement by ID with participants
 * Backend returns: { agreement, participants, error }
 */
export async function getAgreementByIdWithParticipants(
  agreementId: string,
  token?: string
): Promise<ApiResponse<{ agreement: Agreement; participants: AgreementParticipant[] }>> {
  try {
    const response = await apiRequest<unknown>(
      `/agreements/${agreementId}`,
      { method: "GET" },
      token
    )

    if (!response.success) {
      return { success: false, error: response.error }
    }

    const payload = response.data as Record<string, unknown>
    const agreement = payload.agreement as Agreement
    const participants = (payload.participants as AgreementParticipant[]) || []
    const error = payload.error as string | undefined

    if (error) {
      return { success: false, error }
    }

    return { success: true, data: { agreement, participants } }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to fetch agreement",
    }
  }
}
