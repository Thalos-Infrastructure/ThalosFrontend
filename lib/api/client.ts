import { API_URL } from "@/lib/config"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  /** HTTP status code when a response was received (undefined on a network error). */
  status?: number
}

function getErrorMessage(data: unknown): string | undefined {
  if (typeof data === "string") return data
  if (!data || typeof data !== "object") return undefined

  const body = data as {
    message?: unknown
    error?: unknown
    details?: unknown
  }

  for (const value of [body.message, body.error]) {
    const message = getErrorMessage(value)
    if (message) return message
  }

  if (Array.isArray(body.details)) {
    const messages = body.details
      .map((detail) => getErrorMessage(detail))
      .filter((message): message is string => Boolean(message))
    if (messages.length > 0) return messages.join("; ")
  }

  return getErrorMessage(body.details)
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
      return { success: false, error: getErrorMessage(data) ?? "Request failed", status: response.status }
    }

    return { success: true, data: data as T, status: response.status }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}
