import { API_URL } from "@/lib/config"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

function getErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined

  const body = data as { message?: unknown; error?: unknown }
  if (typeof body.message === "string") return body.message
  if (typeof body.error === "string") return body.error
  return undefined
}

export async function apiRequest<T>(
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

    let data: unknown
    try {
      data = await response.json()
    } catch {
      data = undefined
    }

    if (!response.ok) {
      return { success: false, error: getErrorMessage(data) ?? "Request failed" }
    }

    return { success: true, data: data as T }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}
