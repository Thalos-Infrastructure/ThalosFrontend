import { apiRequest, type ApiResponse } from "./client"

export type EngagementType = "fixed" | "milestone" | "hourly"
export type OpportunityStatus = "open" | "closed" | "filled"

export interface Opportunity {
  id: string
  project_id?: string
  owner_id?: string
  title: string
  description: string
  skills_required: string[]
  budget_amount: number
  budget_asset: string
  engagement_type: EngagementType
  status: OpportunityStatus
  project_name?: string | null
  created_at?: string
  updated_at?: string
  project?: {
    id: string
    handle: string | null
    display_name: string | null
    avatar_url: string | null
    org_name: string | null
  }
}

export interface OpportunityPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OpportunityDiscoveryParams {
  skills_required?: string[]
  engagement_type?: EngagementType
  budget_min?: number
  budget_max?: number
  q?: string
  page?: number
  limit?: number
}

export interface CreateOpportunityInput {
  title: string
  description: string
  skills_required: string[]
  budget_amount: number
  budget_asset: string
  engagement_type: EngagementType
  status: OpportunityStatus
}

export type OpportunityInput = CreateOpportunityInput
type OpportunityEnvelope = Opportunity | { opportunity: Opportunity }
type OpportunityListEnvelope = Opportunity[] | { opportunities: Opportunity[] }

function unwrapOpportunity(data: OpportunityEnvelope): Opportunity {
  return "opportunity" in data ? data.opportunity : data
}

function unwrapOpportunities(data: OpportunityListEnvelope): Opportunity[] {
  return Array.isArray(data) ? data : data.opportunities
}

function one(result: ApiResponse<OpportunityEnvelope>): ApiResponse<Opportunity> {
  if (!result.success || !result.data) return { success: false, error: result.error, status: result.status }
  return { success: true, data: unwrapOpportunity(result.data), status: result.status }
}

function many(result: ApiResponse<OpportunityListEnvelope>): ApiResponse<Opportunity[]> {
  if (!result.success || !result.data) return { success: false, error: result.error, status: result.status }
  return { success: true, data: unwrapOpportunities(result.data), status: result.status }
}

/** Public discovery endpoint. Nest only returns open opportunities here. */
export async function getOpenOpportunities(): Promise<ApiResponse<Opportunity[]>> {
  return many(await apiRequest<OpportunityListEnvelope>("/opportunities", { method: "GET" }))
}

/** Backwards-compatible alias for the public discovery endpoint. */
export async function discoverOpenOpportunities(): Promise<ApiResponse<Opportunity[]>> {
  return getOpenOpportunities()
}
/** Authenticated project owner's opportunities, including non-open records. */
export async function getMyOpportunities(token: string): Promise<ApiResponse<Opportunity[]>> {
  return many(await apiRequest<OpportunityListEnvelope>("/opportunities/mine", { method: "GET" }, token))
}

/** Backwards-compatible alias for the authenticated owner list endpoint. */
export async function listMyOpportunities(token: string): Promise<ApiResponse<Opportunity[]>> {
  return getMyOpportunities(token)
}

export async function createOpportunity(input: CreateOpportunityInput, token: string): Promise<ApiResponse<Opportunity>> {
  return one(await apiRequest<OpportunityEnvelope>("/opportunities", {
    method: "POST",
    body: JSON.stringify(input),
  }, token))
}

/** Backwards-compatible alias for creating an opportunity. */
export async function postOpportunity(input: CreateOpportunityInput, token: string): Promise<ApiResponse<Opportunity>> {
  return createOpportunity(input, token)
}

export async function updateOpportunity(
  id: string,
  input: Partial<CreateOpportunityInput>,
  token: string
): Promise<ApiResponse<Opportunity>> {
  return one(await apiRequest<OpportunityEnvelope>(`/opportunities/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }, token))
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus,
  token: string
): Promise<ApiResponse<Opportunity>> {
  return updateOpportunity(id, { status }, token)
}

export async function deleteOpportunity(id: string, token: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/opportunities/${encodeURIComponent(id)}`, { method: "DELETE" }, token)
}

/** Backwards-compatible alias for deleting an opportunity. */
export async function removeOpportunity(id: string, token: string): Promise<ApiResponse<void>> {
  return deleteOpportunity(id, token)
}
export async function discoverOpportunities(
  params: OpportunityDiscoveryParams = {},
  token?: string
): Promise<ApiResponse<OpportunityPaginatedResponse<Opportunity>>> {
  const query = new URLSearchParams()

  if (params.skills_required?.length) {
    params.skills_required.forEach((skill) => query.append("skills_required", skill))
  }
  if (params.engagement_type) {
    query.set("engagement_type", params.engagement_type)
  }
  if (params.budget_min !== undefined) {
    query.set("budget_min", String(params.budget_min))
  }
  if (params.budget_max !== undefined) {
    query.set("budget_max", String(params.budget_max))
  }
  if (params.q) {
    query.set("q", params.q)
  }
  if (params.page) {
    query.set("page", String(params.page))
  }
  if (params.limit) {
    query.set("limit", String(params.limit))
  }

  const qs = query.toString()
  const result = await apiRequest<unknown>(
    `/opportunities${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    token
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  // The backend answers with the list under `opportunities`; normalize it into
  // the paginated shape our consumers expect (`data`), deriving totalPages.
  const record = result.data as Record<string, unknown>
  const list = Array.isArray(record.opportunities)
    ? (record.opportunities as Opportunity[])
    : Array.isArray(record.data)
      ? (record.data as Opportunity[])
      : []
  const total = typeof record.total === "number" ? record.total : list.length
  const limit = typeof record.limit === "number" && record.limit > 0 ? record.limit : Math.max(list.length, 1)

  return {
    success: true,
    data: {
      data: list,
      total,
      page: typeof record.page === "number" ? record.page : 1,
      limit,
      totalPages: typeof record.totalPages === "number" ? record.totalPages : Math.max(1, Math.ceil(total / limit)),
    },
  }
}

/* ── Owner CRUD (C3/C5: publish, edit, status transitions) ── */

export interface CreateOpportunityInput {
  title: string
  description: string
  skills_required: string[]
  budget_amount: number
  budget_asset?: string
  engagement_type: EngagementType
}

export interface UpdateOpportunityInput {
  title?: string
  description?: string
  skills_required?: string[]
  budget_amount?: number
  budget_asset?: string
  engagement_type?: EngagementType
  status?: OpportunityStatus
}

function unwrapSingle(data: unknown): Opportunity | null {
  const record = data as Record<string, unknown> | null
  if (!record) return null
  const raw = record.opportunity ?? record.data ?? record
  if (!raw || typeof raw !== "object") return null
  return raw as Opportunity
}

function unwrapList(data: unknown): Opportunity[] {
  const record = data as Record<string, unknown> | null
  if (!record) return []
  const raw = record.opportunities ?? record.items ?? record.data
  if (!Array.isArray(raw)) return []
  return raw as Opportunity[]
}

export async function createOpportunity(
  input: CreateOpportunityInput,
  token?: string | null
): Promise<ApiResponse<Opportunity>> {
  const result = await apiRequest<unknown>(
    "/opportunities",
    { method: "POST", body: JSON.stringify(input) },
    token ?? undefined
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  const opportunity = unwrapSingle(result.data)
  if (!opportunity) return { success: false, error: "Invalid response from server" }

  return { success: true, data: opportunity }
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput,
  token?: string | null
): Promise<ApiResponse<Opportunity>> {
  const result = await apiRequest<unknown>(
    `/opportunities/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(input) },
    token ?? undefined
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  const opportunity = unwrapSingle(result.data)
  if (!opportunity) return { success: false, error: "Invalid response from server" }

  return { success: true, data: opportunity }
}

export async function updateOpportunityStatus(
  id: string,
  status: OpportunityStatus,
  token?: string | null
): Promise<ApiResponse<Opportunity>> {
  return updateOpportunity(id, { status }, token)
}

export async function getOpenOpportunities(
  params: OpportunityDiscoveryParams = {},
  token?: string | null
): Promise<ApiResponse<Opportunity[]>> {
  const result = await discoverOpportunities(params, token ?? undefined)
  if (!result.success || !result.data) return { success: false, error: result.error }
  return { success: true, data: result.data.data }
}

/* All statuses (open/closed/filled) for the authenticated Project. */
export async function listMyOpportunities(
  token?: string | null
): Promise<ApiResponse<Opportunity[]>> {
  const result = await apiRequest<unknown>(
    "/opportunities/mine",
    { method: "GET" },
    token ?? undefined
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  return { success: true, data: unwrapList(result.data) }
}

export async function getOpportunity(
  id: string,
  token?: string | null
): Promise<ApiResponse<Opportunity>> {
  const result = await apiRequest<unknown>(
    `/opportunities/${encodeURIComponent(id)}`,
    { method: "GET" },
    token ?? undefined
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  const opportunity = unwrapSingle(result.data)
  if (!opportunity) return { success: false, error: "Invalid response from server" }

  return { success: true, data: opportunity }
}