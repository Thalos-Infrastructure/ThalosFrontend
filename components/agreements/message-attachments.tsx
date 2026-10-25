"use client"

/**
 * The attachments on a chat message.
 *
 * Nothing here holds a URL. The bucket is private, so a link is requested from
 * the backend at the moment of the click and is valid for minutes — rendering
 * a stored `src` would either not work or, worse, work forever.
 */

import { useState } from "react"
import { FileText, ImageIcon, Loader2, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { downloadUrlApi, formatFileSize, type AttachedFile } from "@/lib/api/files"

interface Props {
  attachments: AttachedFile[]
  token?: string | null
  /** Tints the chips to sit on the sender's own bubble. */
  isOwn?: boolean
  className?: string
}

export function MessageAttachments({ attachments, token, isOwn, className }: Props) {
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (attachments.length === 0) return null

  async function open(file: AttachedFile) {
    setOpeningId(file.id)
    setError(null)

    const result = await downloadUrlApi(file.id, token ?? undefined)
    setOpeningId(null)

    if (!result.success || !result.data) {
      setError(result.error ?? "Could not open the file")
      return
    }
    window.open(result.data.url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {attachments.map((file) => {
        const isImage = file.contentType.startsWith("image/")
        const busy = openingId === file.id

        return (
          <button
            key={file.id}
            type="button"
            onClick={() => void open(file)}
            disabled={busy}
            title={file.name}
            className={cn(
              "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
              isOwn ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/15",
            )}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : isImage ? (
              <ImageIcon className="h-4 w-4 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 shrink-0" />
            )}

            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{file.name}</span>
              <span className="block text-[10px] opacity-60">{formatFileSize(file.sizeBytes)}</span>
            </span>

            <Download className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
          </button>
        )
      })}

      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  )
}
