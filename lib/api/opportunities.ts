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
  if (!result.success || !result.data) return { success: false, error: result.error }
  return { success: true, data: unwrapOpportunity(result.data) }
}

function many(result: ApiResponse<OpportunityListEnvelope>): ApiResponse<Opportunity[]> {
  if (!result.success || !result.data) return { success: false, error: result.error }
  return { success: true, data: unwrapOpportunities(result.data) }
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
  return apiRequest<OpportunityPaginatedResponse<Opportunity>>(
    `/opportunities${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    token
  )
}
