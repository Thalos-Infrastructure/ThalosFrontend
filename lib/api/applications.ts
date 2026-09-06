import { apiRequest, type ApiResponse } from "./client"

export type ApplicationStatus = "pending" | "accepted" | "rejected"

export interface Application {
  id: string
  opportunityId: string
  builderId: string
  message: string
  status: ApplicationStatus
  createdAt: string
}

interface BackendApplication {
  id: string
  opportunity_id?: string
  builder_id: string
  message?: string
  status?: string
  created_at?: string
}

function mapApplication(raw: BackendApplication): Application {
  return {
    id: raw.id,
    opportunityId: raw.opportunity_id ?? "",
    builderId: raw.builder_id,
    message: raw.message ?? "",
    status: (["pending", "accepted", "rejected"].includes(raw.status ?? "")
      ? raw.status
      : "pending") as ApplicationStatus,
    createdAt: raw.created_at ?? "",
  }
}

function unwrapSingle(data: unknown): Application | null {
  const record = data as Record<string, unknown> | null
  if (!record) return null
  const raw = record.application ?? record.data ?? record
  if (!raw || typeof raw !== "object") return null
  return mapApplication(raw as BackendApplication)
}

function unwrapList(data: unknown): Application[] {
  const record = data as Record<string, unknown> | null
  if (!record) return []
  const raw = record.applications ?? record.items ?? record.data
  if (!Array.isArray(raw)) return []
  return (raw as BackendApplication[]).map(mapApplication)
}

export async function applyToOpportunity(
  opportunityId: string,
  message: string,
  token?: string | null,
): Promise<ApiResponse<Application>> {
  const result = await apiRequest<unknown>(
    "/applications",
    {
      method: "POST",
      body: JSON.stringify({ opportunity_id: opportunityId, message }),
    },
    token ?? undefined,
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  const application = unwrapSingle(result.data)
  if (!application) return { success: false, error: "Invalid response from server" }

  return { success: true, data: application }
}

export async function listApplications(
  opportunityId: string,
  token?: string | null,
): Promise<ApiResponse<Application[]>> {
  const result = await apiRequest<unknown>(
    `/applications?opportunity_id=${encodeURIComponent(opportunityId)}`,
    { method: "GET" },
    token ?? undefined,
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  return { success: true, data: unwrapList(result.data) }
}

/**
 * The current user's application to a given opportunity, if any. Lets the
 * detail page restore the "applied / rejected / accepted" state on reload
 * instead of relying on transient local state.
 *
 * `builderId` is the authenticated user's id (the JWT `sub`, which the backend
 * stamps on applications as `builder_id`).
 */
export async function getMyApplication(
  opportunityId: string,
  builderId: string,
  token?: string | null,
): Promise<ApiResponse<Application | null>> {
  const result = await listApplications(opportunityId, token)
  if (!result.success || !result.data) {
    return { success: result.success, error: result.error }
  }
  const mine = result.data.find((a) => a.builderId === builderId) ?? null
  return { success: true, data: mine }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: Exclude<ApplicationStatus, "pending">,
  token?: string | null,
): Promise<ApiResponse<Application>> {
  const result = await apiRequest<unknown>(
    `/applications/${encodeURIComponent(applicationId)}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    token ?? undefined,
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  const application = unwrapSingle(result.data)
  if (!application) return { success: false, error: "Invalid response from server" }

  return { success: true, data: application }
}
