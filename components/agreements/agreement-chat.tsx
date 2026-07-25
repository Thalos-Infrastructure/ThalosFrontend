"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, isValidUuid, isSorobanContractId } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { getAgreementMessages, sendAgreementMessage, findOrCreateAgreementByContractId, type AgreementMessage } from "@/lib/api/agreements"
import { Send, MessageCircle, AlertTriangle } from "lucide-react"

interface AgreementChatProps {
  agreementId: string
  currentUserWallet: string
  counterpartyWallet: string
  counterpartyName?: string
  agreementTitle?: string
  agreementAmount?: string
  agreementAsset?: string
  myRole?: "buyer" | "seller"
  className?: string
  defaultOpen?: boolean
  embedded?: boolean
}

type IdKind = "uuid" | "contract" | "mock"

export function AgreementChat({
  agreementId,
  currentUserWallet,
  counterpartyWallet,
  counterpartyName,
  agreementTitle,
  agreementAmount,
  agreementAsset,
  myRole,
  className,
  defaultOpen = false,
  embedded = false,
}: AgreementChatProps) {
  const { token, user } = useAuthStore()
  const [messages, setMessages] = useState<AgreementMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [resolvedId, setResolvedId] = useState<string | null>(isValidUuid(agreementId) ? agreementId : null)
  const [resolving, setResolving] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  const idKind: IdKind = useMemo(() => {
    if (isValidUuid(agreementId)) return "uuid"
    if (isSorobanContractId(agreementId)) return "contract"
    return "mock"
  }, [agreementId])

  useEffect(() => {
    setResolvedId(isValidUuid(agreementId) ? agreementId : null)
    setChatError(null)
    setMessages([])
  }, [agreementId])

  async function loadMessages(id: string) {
    if (!token) {
      setChatError("You need to sign in to view this chat.")
      return
    }
    setLoading(true)
    const res = await getAgreementMessages(id, token)
    setLoading(false)
    if (!res.success || !res.data) {
      setChatError(res.error || "Failed to load messages")
      return
    }
    setChatError(null)
    setMessages(res.data)
  }

  useEffect(() => {
    if (!isOpen || idKind === "mock") return

    if (resolvedId) {
      loadMessages(resolvedId)
      pollInterval.current = setInterval(() => loadMessages(resolvedId), 5000)
      return () => {
        if (pollInterval.current) clearInterval(pollInterval.current)
      }
    }

    if (idKind === "contract" && !resolving) {
      if (!token) {
        setChatError("You need to sign in to link this chat.")
        return
      }
      setResolving(true)
      setChatError(null)
      findOrCreateAgreementByContractId({
        contractId: agreementId,
        title: agreementTitle || "Agreement",
        amount: agreementAmount || "0",
        asset: agreementAsset,
        myWallet: currentUserWallet,
        myRole: myRole === "seller" ? "payee" : "payer",
        counterpartyWallet,
      }, token).then(({ agreementId: newId, error }) => {
        setResolving(false)
        if (error || !newId) {
          setChatError(error || "Couldn't link this chat to the agreement")
          return
        }
        setResolvedId(newId)
      })
    }
  }, [
    isOpen,
    idKind,
    resolvedId,
    agreementId,
    token,
    currentUserWallet,
    counterpartyWallet,
    agreementTitle,
    agreementAmount,
    agreementAsset,
    myRole,
  ])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function handleSend() {
    if (!newMessage.trim() || sending || !resolvedId) return
    if (!token) {
      setChatError("You need to sign in to send messages.")
      return
    }

    setSending(true)
    const res = await sendAgreementMessage(resolvedId, newMessage, currentUserWallet, token)
    setSending(false)

    if (!res.success || !res.data) {
      setChatError(res.error || "Failed to send message")
      return
    }

    setMessages((prev) => [...prev, res.data as AgreementMessage])
    setNewMessage("")
    setChatError(null)
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  function isOwnMessage(message: AgreementMessage) {
    if (message.senderId) return message.senderId === user?.id
    return message.senderWallet?.toLowerCase() === currentUserWallet.toLowerCase()
  }

  const isMock = idKind === "mock"
  const isSettingUp = idKind === "contract" && !resolvedId && !chatError
  const canChat = !!resolvedId

  function renderMessages() {
    if (isMock) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <AlertTriangle className="h-10 w-10 text-white/15 mb-3" />
          <p className="text-sm text-white/40">Chat unavailable</p>
          <p className="text-xs text-white/30 mt-1 max-w-[220px]">This is a demo agreement; chat isn't connected to a real agreement.</p>
        </div>
      )
    }

    if (chatError && !canChat) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <AlertTriangle className="h-10 w-10 text-red-400/40 mb-3" />
          <p className="text-sm text-white/40">{chatError}</p>
        </div>
      )
    }

    if (isSettingUp || (loading && messages.length === 0)) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-white/40">{isSettingUp ? "Setting up chat…" : "Loading messages..."}</p>
        </div>
      )
    }

    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <MessageCircle className="h-12 w-12 text-white/10 mb-3" />
          <p className="text-sm text-white/40">No messages yet</p>
          <p className="text-xs text-white/30 mt-1">Start the conversation with {counterpartyName || "your counterparty"}</p>
        </div>
      )
    }

    return messages.map((msg) => {
      const isOwn = isOwnMessage(msg)
      return (
        <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isOwn ? "ml-auto items-end" : "items-start")}>
          <div className={cn("rounded-2xl px-4 py-2.5", isOwn ? "bg-[#f0b400] text-[#0c1220]" : "bg-white/10 text-white")}>
            <p className="text-sm">{msg.message}</p>
          </div>
          <span className="text-[10px] text-white/30 mt-1 px-1">{formatTime(msg.createdAt)}</span>
        </div>
      )
    })
  }

  if (embedded) {
    // Demo / mock agreement - show disabled state
    if (isMock) {
      return (
        <div className={cn("flex flex-col h-full", className)}>
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">Demo Agreement</p>
              <p className="text-xs text-white/40 mt-1 max-w-[220px]">
                Chat is unavailable for demo agreements. Create a real agreement to use messaging.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10 p-4">
            <Input
              value=""
              placeholder="Demo agreement — chat unavailable"
              className="flex-1 bg-white/5 border-white/10 text-white/30 placeholder:text-white/30 cursor-not-allowed"
              disabled
            />
          </div>
        </div>
      )
    }

    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 p-4">
          {chatError && canChat && <p className="mb-2 text-xs text-red-400">{chatError}</p>}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isMock ? "Chat unavailable in demo mode" : "Type a message..."}
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              disabled={sending || !canChat}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newMessage.trim() || sending || !canChat}
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
          className
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {isMock ? "Chat (demo)" : "Chat"}
        {!isMock && messages.length > 0 && (
          <span className="ml-1 rounded-full bg-[#f0b400]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f0b400]">
            {messages.length}
          </span>
        )}
      </button>
    )
  }

  // Mock agreement popup - show disabled state
  if (isMock) {
    return (
      <div className={cn("rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden", className)}>
        <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#f0b400]" />
            <span className="text-sm font-medium text-white">Agreement Chat</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-white/50 hover:text-white transition-colors"
          >
            Minimize
          </button>
        </div>
        <div className="h-64 flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">Demo Agreement</p>
            <p className="text-xs text-white/40 mt-1">
              Chat is unavailable for demo agreements. Create a real agreement to use messaging.
            </p>
          </div>
        </div>
        <div className="border-t border-white/6 p-3">
          <Input
            value=""
            placeholder="Demo agreement — chat unavailable"
            className="flex-1 bg-white/5 border-white/10 text-white/30 placeholder:text-white/30 cursor-not-allowed h-9"
            disabled
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#f0b400]" />
          <span className="text-sm font-medium text-white">Agreement Chat</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-xs text-white/50 hover:text-white transition-colors">
          Minimize
        </button>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/6 p-3">
        {chatError && canChat && <p className="mb-2 text-xs text-red-400">{chatError}</p>}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isMock ? "Chat unavailable in demo mode" : "Type a message..."}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
            disabled={sending || !canChat}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!newMessage.trim() || sending || !canChat}
            className="bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00] px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
