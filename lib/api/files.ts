/**
 * Uploads and download links for the files Thalos stores.
 *
 * The bucket is private: there is no permanent URL to an attachment. Every
 * download goes through `downloadUrlApi`, which asks the backend to check the
 * caller still belongs to the agreement and hands back a link that expires in
 * minutes. Nothing here should ever be cached as if it were stable.
 */

import { API_URL } from "@/lib/config"
import type { ApiResponse } from "./client"

/** Mirrors the backend's `PublicFile`: no storage path, no bucket. */
export interface AttachedFile {
  id: string
  name: string
  contentType: string
  sizeBytes: number
}

/** Kept in step with the backend's `files.constants.ts`. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES_PER_MESSAGE = 5
export const ALLOWED_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

/** The `accept` attribute for a file input, from the same list. */
export const FILE_ACCEPT = ALLOWED_CONTENT_TYPES.join(",")

export function isAllowedFile(file: File): boolean {
  return ALLOWED_CONTENT_TYPES.includes(file.type)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Upload one file and get its id back.
 *
 * `fetch` directly rather than through `apiRequest`: that helper sets
 * `Content-Type: application/json`, and a multipart body needs the browser to
 * set the header itself so it can include the boundary.
 */
export async function uploadFileApi(
  file: File,
  params: { agreementId?: string; uploaderWallet: string },
  token?: string,
): Promise<ApiResponse<AttachedFile>> {
  try {
    const body = new FormData()
    body.append("file", file)
    body.append("uploader_wallet", params.uploaderWallet)
    if (params.agreementId) body.append("agreement_id", params.agreementId)

    const response = await fetch(`${API_URL}/files`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    })

    const payload = (await response.json().catch(() => null)) as {
      file?: AttachedFile
      message?: string
      error?: string
    } | null

    if (!response.ok) {
      return {
        success: false,
        error: payload?.message || payload?.error || `Could not upload ${file.name}`,
        status: response.status,
      }
    }

    if (!payload?.file) {
      return { success: false, error: `Could not upload ${file.name}` }
    }

    return { success: true, data: payload.file, status: response.status }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Upload failed",
    }
  }
}

/** A short-lived download link for an attachment. Never store the result. */
export async function downloadUrlApi(
  fileId: string,
  token?: string,
): Promise<ApiResponse<{ url: string; name: string }>> {
  try {
    const response = await fetch(`${API_URL}/files/${fileId}/url`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    const payload = (await response.json().catch(() => null)) as {
      url?: string
      name?: string
      message?: string
    } | null

    if (!response.ok || !payload?.url) {
      return {
        success: false,
        error: payload?.message || "Could not open the file",
        status: response.status,
      }
    }

    return { success: true, data: { url: payload.url, name: payload.name ?? "" } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Could not open the file" }
  }
}
