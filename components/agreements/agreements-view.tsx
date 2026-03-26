"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Search, FileText, Clock, CheckCircle, AlertTriangle, ShoppingCart, Store, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Agreement {
  id: string
  title: string
  counterparty: string
  status: string
  amount: string
  currency: string
  type: string
  updatedAt?: string
  milestones?: Array<{ status: string }>
  role?: "buyer" | "seller" // User's role in this agreement
  serviceProvider?: string
  client?: string
}

interface AgreementsViewProps {
  agreements: Agreement[]
  onAgreementClick: (id: string) => void
  onOpenChat?: (agreementId: string) => void
  currentUserWallet?: string
  className?: string
}

type ViewMode = "buyer" | "seller"
type TabType = "pending" | "active" | "completed"
type PendingGroup = "approval" | "funding" | "review" | "dispute"

export function AgreementsView({ agreements, onAgreementClick, onOpenChat, currentUserWallet, className }: AgreementsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("buyer")
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<PendingGroup[]>(["approval", "funding", "review"])

  // Filter by view mode (buyer/seller)
  const filteredByRole = useMemo(() => {
    return agreements.filter(a => {
      // If role is specified, use it directly
      if (a.role) return a.role === viewMode
      // Otherwise, infer from type or default to showing all
      return true
    })
  }, [agreements, viewMode])

  // Categorize agreements
  const categorized = useMemo(() => {
    const pending: Agreement[] = []
    const active: Agreement[] = []
    const completed: Agreement[] = []

    filteredByRole.forEach((agreement) => {
      const status = agreement.status.toLowerCase()
      if (status === "completed" || status === "released") {
        completed.push(agreement)
      } else if (status === "pending" || status === "funded" || status === "dispute") {
        pending.push(agreement)
      } else {
        active.push(agreement)
      }
    })

    return { pending, active, completed }
  }, [filteredByRole])

  // Group pending agreements
  const pendingGroups = useMemo(() => {
    const groups = {
      approval: [] as Agreement[],
      funding: [] as Agreement[],
      review: [] as Agreement[],
      dispute: [] as Agreement[],
    }

    categorized.pending.forEach((agreement) => {
      const status = agreement.status.toLowerCase()
      if (status === "dispute") {
        groups.dispute.push(agreement)
      } else if (status === "funded") {
        groups.approval.push(agreement)
      } else if (status === "pending") {
        // Check if it needs funding or review
        const hasPendingMilestones = agreement.milestones?.some(m => m.status === "pending")
        if (hasPendingMilestones) {
          groups.review.push(agreement)
        } else {
          groups.funding.push(agreement)
        }
      }
    })

    return groups
  }, [categorized.pending])

  // Filter by search
  const filteredAgreements = useMemo(() => {
    if (!searchQuery) return categorized[activeTab]
    
    const query = searchQuery.toLowerCase()
    return categorized[activeTab].filter(a => 
      a.title.toLowerCase().includes(query) ||
      a.counterparty.toLowerCase().includes(query) ||
      a.type.toLowerCase().includes(query)
    )
  }, [categorized, activeTab, searchQuery])

  function toggleGroup(group: PendingGroup) {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    )
  }

  const tabs = [
    { id: "pending" as TabType, label: "Pending Your Action", count: categorized.pending.length, icon: Clock },
    { id: "active" as TabType, label: "Active", count: categorized.active.length, icon: FileText },
    { id: "completed" as TabType, label: "Completed", count: categorized.completed.length, icon: CheckCircle },
  ]

  const pendingGroupConfig = [
    { id: "approval" as PendingGroup, label: "Waiting for your approval", icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { id: "funding" as PendingGroup, label: "Waiting for funding", icon: AlertTriangle, color: "text-sky-400", bg: "bg-sky-400/10" },
    { id: "review" as PendingGroup, label: "Waiting for your review", icon: FileText, color: "text-violet-400", bg: "bg-violet-400/10" },
    { id: "dispute" as PendingGroup, label: "Disputes", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-400/10" },
  ]

  return (
    <div className={cn("space-y-4", className)}>
      {/* Buyer/Seller View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          <button
            onClick={() => setViewMode("buyer")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "buyer"
                ? "bg-[#f0b400] text-[#0c1220]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            As Buyer
          </button>
          <button
            onClick={() => setViewMode("seller")}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "seller"
                ? "bg-[#f0b400] text-[#0c1220]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Store className="h-4 w-4" />
            As Seller
          </button>
        </div>
        
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 rounded-lg bg-white/5 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[#f0b400]/10 text-[#f0b400]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                activeTab === tab.id ? "bg-[#f0b400]/20" : "bg-white/10"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "pending" ? (
        /* Pending - Grouped View */
        <div className="space-y-4">
          {pendingGroupConfig.map((group) => {
            const groupAgreements = pendingGroups[group.id]
            if (groupAgreements.length === 0) return null
            
            const isExpanded = expandedGroups.includes(group.id)
            
            return (
              <div key={group.id} className="rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", group.bg)}>
                      <group.icon className={cn("h-4 w-4", group.color)} />
                    </div>
                    <span className="text-sm font-medium text-white">{group.label}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">
                      {groupAgreements.length}
                    </span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn("text-white/40 transition-transform", isExpanded && "rotate-180")}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Group Content */}
                {isExpanded && (
                  <div className="border-t border-white/6 divide-y divide-white/6">
                    {groupAgreements.map((agreement) => (
                      <AgreementCard
                        key={agreement.id}
                        agreement={agreement}
                        onClick={() => onAgreementClick(agreement.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {categorized.pending.length === 0 && (
            <EmptyState message="No pending actions" description="All caught up! Check your active agreements." />
          )}
        </div>
      ) : (
        /* Active / Completed - List View */
        <div className="rounded-xl border border-white/10 bg-[#0c1220] divide-y divide-white/6">
          {filteredAgreements.length === 0 ? (
            <EmptyState 
              message={activeTab === "active" ? "No active agreements" : "No completed agreements"} 
              description={activeTab === "active" ? "Create a new agreement to get started" : "Completed agreements will appear here"}
            />
          ) : (
            filteredAgreements.map((agreement) => (
              <AgreementCard
                key={agreement.id}
                agreement={agreement}
                onClick={() => onAgreementClick(agreement.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function AgreementCard({ agreement, onClick, onChat }: { agreement: Agreement; onClick: () => void; onChat?: () => void }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-amber-400/10", text: "text-amber-400" },
    funded: { bg: "bg-sky-400/10", text: "text-sky-400" },
    in_progress: { bg: "bg-violet-400/10", text: "text-violet-400" },
    completed: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
    released: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
    dispute: { bg: "bg-rose-400/10", text: "text-rose-400" },
  }

  const colors = statusColors[agreement.status.toLowerCase()] || statusColors.pending

  return (
    <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
      <button
        onClick={onClick}
        className="flex items-center gap-3 min-w-0 flex-1 text-left"
      >
        <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-white/40" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{agreement.title}</p>
          <p className="text-xs text-white/50 truncate">{agreement.counterparty}</p>
        </div>
      </button>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Chat button */}
        {onChat && (
          <button
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400] transition-colors opacity-0 group-hover:opacity-100"
            title="Open chat"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        )}
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", colors.bg, colors.text)}>
          {agreement.status.replace("_", " ")}
        </span>
        <div className="text-right min-w-[80px]">
          <p className="text-sm font-semibold text-white">{agreement.amount}</p>
          <p className="text-[10px] text-white/40">{agreement.currency}</p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message, description }: { message: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-white/10 mb-3" />
      <p className="text-sm font-medium text-white/60">{message}</p>
      <p className="text-xs text-white/40 mt-1">{description}</p>
    </div>
  )
}
