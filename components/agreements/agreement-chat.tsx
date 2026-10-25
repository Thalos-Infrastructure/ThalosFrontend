"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  getAgreementMessagesApi,
  markAgreementMessagesReadApi,
  sendAgreementMessageApi,
  type AgreementMessage,
} from "@/lib/api/agreements"
import { Send, MessageCircle, Paperclip, X, Loader2 } from "lucide-react"
import { MessageAttachments } from "./message-attachments"
import { ChatDisputePanel } from "./chat-dispute-panel"
import {
  uploadFileApi,
  isAllowedFile,
  formatFileSize,
  FILE_ACCEPT,
  MAX_FILE_BYTES,
  MAX_FILES_PER_MESSAGE,
  type AttachedFile,
} from "@/lib/api/files"

interface AgreementChatProps {
  agreementId: string
  currentUserWallet: string
  counterpartyWallet: string
  counterpartyName?: string
  /** Shown in the header so the thread is not an anonymous "Agreement Chat". */
  agreementTitle?: string
  /** App JWT from useAuthStore — required for Nest endpoints. */
  token?: string | null
  className?: string
  defaultOpen?: boolean
  embedded?: boolean // When true, removes the header and shows full height
  /** Simple dispute: parent runs the existing Trustless Work open-dispute flow. */
  onOpenSimpleDispute?: () => void
  /** Escrow already disputed on-chain — show the split UI even with no Nest row yet. */
  escrowDisputed?: boolean
}

export function AgreementChat({
  agreementId,
  currentUserWallet,
  counterpartyWallet,
  counterpartyName,
  agreementTitle,
  token,
  className,
  defaultOpen = false,
  embedded = false,
  onOpenSimpleDispute,
  escrowDisputed = false,
}: AgreementChatProps) {
  const [messages, setMessages] = useState<AgreementMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [chatError, setChatError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Files already uploaded and waiting to be sent with the next message.
  // Uploading on pick rather than on send means a slow upload does not hold
  // the send, and a failed one is reported next to the file that failed.
  const [pending, setPending] = useState<AttachedFile[]>([])
  const [uploading, setUploading] = useState(false)

  async function loadMessages(opts?: { markRead?: boolean }) {
    setChatError(null)
    if (opts?.markRead && token) {
      await markAgreementMessagesReadApi(agreementId, token)
    }
    const {
      data,
      error,
      unreadCount: unread,
    } = await getAgreementMessagesApi(agreementId, token ?? undefined)
    if (error) {
      setChatError(error)
      setMessages([])
      setUnreadCount(unread ?? 0)
    } else {
      setMessages(data || [])
      setUnreadCount(opts?.markRead ? 0 : (unread ?? 0))
    }
    setLoading(false)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      void loadMessages({ markRead: true })
      // Poll while the thread is open. Read is stamped only on this path, not
      // on a background peek, so the other party still sees an unread until
      // they actually open the chat.
      pollInterval.current = setInterval(() => void loadMessages({ markRead: true }), 5000)
    } else if (!embedded) {
      void loadMessages()
      pollInterval.current = setInterval(() => void loadMessages(), 15000)
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [isOpen, agreementId, token, embedded])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  /**
   * Upload what the user picked, keeping the ids for the next send.
   *
   * Everything is checked client-side first — the backend enforces the same
   * rules, but a 10 MB upload that is going to be refused should not be sent
   * over the wire to find that out.
   */
  async function handleFilesPicked(files: FileList | null) {
    if (!files?.length) return
    setChatError(null)

    const room = MAX_FILES_PER_MESSAGE - pending.length
    if (room <= 0) {
      setChatError(`You can attach up to ${MAX_FILES_PER_MESSAGE} files per message`)
      return
    }

    const picked = Array.from(files).slice(0, room)
    setUploading(true)

    for (const file of picked) {
      if (!isAllowedFile(file)) {
        setChatError(`${file.name}: that file type is not accepted`)
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        setChatError(`${file.name} is larger than ${formatFileSize(MAX_FILE_BYTES)}`)
        continue
      }

      const result = await uploadFileApi(
        file,
        { agreementId, uploaderWallet: currentUserWallet },
        token ?? undefined,
      )

      if (!result.success || !result.data) {
        setChatError(result.error ?? `Could not upload ${file.name}`)
        continue
      }
      setPending((prev) => [...prev, result.data as AttachedFile])
    }

    setUploading(false)
    // Let the same file be picked again after it was removed.
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removePending(fileId: string) {
    setPending((prev) => prev.filter((f) => f.id !== fileId))
  }

  async function handleSend() {
    // A screenshot on its own is a message; an empty one is not.
    if ((!newMessage.trim() && pending.length === 0) || sending || uploading) return

    setSending(true)
    setChatError(null)
    const { data, error } = await sendAgreementMessageApi(
      agreementId,
      newMessage,
      currentUserWallet,
      token ?? undefined,
      pending.map((f) => f.id),
    )
    setSending(false)

    if (error) {
      setChatError(error)
      return
    }

    if (data) {
      setMessages([...messages, data])
      setNewMessage("")
      setPending([])
    }
  }

  /**
   * The composer's attach button and hidden file input.
   *
   * A plain function returning JSX, not a component: a component declared
   * inside the render gets a new type on every render, so React would remount
   * the file input and drop the ref to it.
   */
  function renderAttachmentControls(compact?: boolean) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FILE_ACCEPT}
          onChange={(e) => void handleFilesPicked(e.target.files)}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading || pending.length >= MAX_FILES_PER_MESSAGE}
          title="Attach a file"
          aria-label="Attach a file"
          className={cn(
            "shrink-0 text-white/50 hover:text-white hover:bg-white/10",
            compact ? "h-9 px-2" : "px-2",
          )}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>
      </>
    )
  }

  /** Files already uploaded, shown above the input until the message is sent. */
  function renderPendingAttachments() {
    if (pending.length === 0) return null
    return (
      <div className="mb-2 flex flex-wrap gap-1.5">
        {pending.map((file) => (
          <span
            key={file.id}
            className="flex max-w-[12rem] items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-white/80"
          >
            <span className="truncate" title={file.name}>
              {file.name}
            </span>
            <span className="shrink-0 text-white/40">{formatFileSize(file.sizeBytes)}</span>
            <button
              type="button"
              onClick={() => removePending(file.id)}
              aria-label={`Remove ${file.name}`}
              className="shrink-0 text-white/40 transition-colors hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    )
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return (
      date.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    )
  }

  function isOwnMessage(message: AgreementMessage) {
    return (message.sender_wallet ?? "").toLowerCase() === currentUserWallet.toLowerCase()
  }

  function isLifecycle(message: AgreementMessage) {
    return message.kind === "event" || message.kind === "system"
  }

  const heading = agreementTitle || counterpartyName || "Agreement chat"

  function renderThread() {
    if (loading && messages.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-white/40">Loading messages...</p>
        </div>
      )
    }
    if (messages.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="mb-3 h-12 w-12 text-white/10" />
          <p className="text-sm text-white/40">
            {escrowDisputed ? "No chat history yet" : "No messages yet"}
          </p>
          <p className="mt-1 text-xs text-white/30">
            {escrowDisputed
              ? "Lifecycle events only appear from this point on. Use Dispute above to propose a split."
              : `Start the conversation with ${counterpartyName || "your counterparty"}`}
          </p>
        </div>
      )
    }
    return messages.map((msg) => {
      if (isLifecycle(msg)) {
        return (
          <div key={msg.id} className="flex justify-center px-2">
            <p className="max-w-[90%] rounded-full bg-white/5 px-3 py-1 text-center text-[11px] text-white/50">
              {msg.message}
              <span className="ml-2 text-white/25">{formatTime(msg.created_at)}</span>
            </p>
          </div>
        )
      }
      const isOwn = isOwnMessage(msg)
      return (
        <div
          key={msg.id}
          className={cn("flex max-w-[85%] flex-col", isOwn ? "ml-auto items-end" : "items-start")}
        >
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5",
              isOwn ? "bg-[#f0b400] text-[#0c1220]" : "bg-white/10 text-white",
            )}
          >
            {msg.message && <p className="text-sm">{msg.message}</p>}
            <MessageAttachments
              attachments={msg.attachments ?? []}
              token={token}
              isOwn={isOwn}
              className={msg.message ? "mt-2" : undefined}
            />
          </div>
          <span className="mt-1 px-1 text-[10px] text-white/30">{formatTime(msg.created_at)}</span>
        </div>
      )
    })
  }

  function renderToolbar() {
    return (
      <ChatDisputePanel
        agreementId={agreementId}
        currentUserWallet={currentUserWallet}
        token={token}
        escrowDisputed={escrowDisputed}
        onOpenSimpleDispute={onOpenSimpleDispute}
        onChanged={() => void loadMessages({ markRead: true })}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white" title={heading}>
            {heading}
          </p>
          {agreementTitle && counterpartyName && (
            <p className="truncate text-[11px] text-white/40">{counterpartyName}</p>
          )}
        </div>
      </ChatDisputePanel>
    )
  }

  // Embedded mode - always open, no toggle button
  if (embedded) {
    return (
      <div className={cn("flex h-full flex-col", className)}>
        {renderToolbar()}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {renderThread()}
          {chatError && <div className="py-2 text-center text-xs text-red-400">{chatError}</div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          {renderPendingAttachments()}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            {renderAttachmentControls()}
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              disabled={sending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={(!newMessage.trim() && pending.length === 0) || sending || uploading}
              className="bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00] px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors",
          className,
        )}
      >
        <MessageCircle className="h-4 w-4" />
        Chat
        {unreadCount > 0 && (
          <span className="ml-1 rounded-full bg-[#f0b400]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f0b400]">
            {unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <div
      className={cn("rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden", className)}
    >
      {renderToolbar()}
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="px-4 py-1 text-left text-[11px] text-white/40 hover:text-white"
      >
        Minimize
      </button>

      <div className="h-64 space-y-3 overflow-y-auto p-4">
        {renderThread()}
        {chatError && <div className="py-2 text-center text-xs text-red-400">{chatError}</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/6 p-3">
        {renderPendingAttachments()}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          {renderAttachmentControls(true)}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
            disabled={sending}
          />
          <Button
            type="submit"
            size="sm"
            disabled={(!newMessage.trim() && pending.length === 0) || sending || uploading}
            className="bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00] px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
