import { apiRequest, type ApiResponse } from "./client"

export type EngagementType = "fixed" | "milestone" | "hourly"
export type OpportunityStatus = "open" | "closed" | "filled"

export interface Opportunity {
  id: string
  project_id: string
  title: string
  description: string
  skills_required: string[]
  budget_amount: number
  budget_asset: string
  engagement_type: EngagementType
  status: OpportunityStatus
  created_at: string
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

export async function discoverOpportunities(
  params: OpportunityDiscoveryParams = {},
  token?: string
): Promise<ApiResponse<OpportunityPaginatedResponse<Opportunity>>> {
  const query = new URLSearchParams()

  if (params.skills_required?.length) {
    params.skills_required.forEach((s) => query.append("skills_required", s))
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
