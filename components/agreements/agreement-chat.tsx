"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getAgreementMessages, sendAgreementMessage, type AgreementMessage } from "@/lib/actions/agreement-chat"
import { Send, MessageCircle } from "lucide-react"

interface AgreementChatProps {
  agreementId: string
  currentUserWallet: string
  counterpartyWallet: string
  counterpartyName?: string
  className?: string
}

export function AgreementChat({ agreementId, currentUserWallet, counterpartyWallet, counterpartyName, className }: AgreementChatProps) {
  const [messages, setMessages] = useState<AgreementMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      // Poll for new messages every 5 seconds when chat is open
      pollInterval.current = setInterval(loadMessages, 5000)
    }
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [isOpen, agreementId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    const { messages: data } = await getAgreementMessages(agreementId)
    setMessages(data)
    setLoading(false)
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  async function handleSend() {
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    const { message, error } = await sendAgreementMessage(agreementId, newMessage, currentUserWallet)
    setSending(false)

    if (error) {
      console.error("Error sending message:", error)
      return
    }

    if (message) {
      setMessages([...messages, message])
      setNewMessage("")
    }
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
    return message.sender_wallet.toLowerCase() === currentUserWallet.toLowerCase()
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
        Chat
        {messages.length > 0 && (
          <span className="ml-1 rounded-full bg-[#f0b400]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#f0b400]">
            {messages.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={cn("rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden", className)}>
      {/* Header */}
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

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-white/40">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-8 w-8 text-white/20 mb-2" />
            <p className="text-sm text-white/40">No messages yet</p>
            <p className="text-xs text-white/30">Start the conversation with {counterpartyName || "your counterparty"}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = isOwnMessage(msg)
            return (
              <div
                key={msg.id}
                className={cn("flex flex-col max-w-[80%]", isOwn ? "ml-auto items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "rounded-xl px-3 py-2",
                    isOwn ? "bg-[#f0b400]/20 text-white" : "bg-white/10 text-white"
                  )}
                >
                  <p className="text-sm">{msg.message}</p>
                </div>
                <span className="text-[10px] text-white/30 mt-1 px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/6 p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
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
            disabled={!newMessage.trim() || sending}
            className="bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00] px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
