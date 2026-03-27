"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Search, FileText, Clock, CheckCircle, AlertTriangle, ShoppingCart, Store, MessageCircle, ChevronLeft, ChevronRight, Play } from "lucide-react"
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

const ITEMS_PER_PAGE = 10

export function AgreementsView({ agreements, onAgreementClick, onOpenChat, currentUserWallet, className }: AgreementsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("buyer")
  const [activeTab, setActiveTab] = useState<TabType>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<PendingGroup[]>(["approval", "funding", "review"])
  const [currentPage, setCurrentPage] = useState(1)

  // Filter by view mode (buyer/seller)
  const filteredByRole = useMemo(() => {
    return agreements.filter(a => {
      // If role is specified, use it directly
      if (a.role) return a.role === viewMode
      // Otherwise, infer from type or default to showing all
      return true
    })
  }, [agreements, viewMode])

  // Categorize agreements - ALL agreements go into proper categories
  const categorized = useMemo(() => {
    const pending: Agreement[] = []
    const active: Agreement[] = []
    const completed: Agreement[] = []

    filteredByRole.forEach((agreement) => {
      const status = agreement.status.toLowerCase()
      
      // Check milestone statuses for more accurate categorization
      const allMilestonesReleased = agreement.milestones?.every(m => m.status === "released")
      const hasPendingMilestones = agreement.milestones?.some(m => m.status === "pending" || m.status === "approved")
      
      if (status === "completed" || status === "released" || allMilestonesReleased) {
        completed.push(agreement)
      } else if (status === "pending" || status === "funded" || status === "dispute" || hasPendingMilestones) {
        // Pending = needs action from someone
        pending.push(agreement)
      } else if (status === "in_progress") {
        // Active = work is being done
        active.push(agreement)
      } else {
        // Default to pending if unclear
        pending.push(agreement)
      }
    })

    return { pending, active, completed }
  }, [filteredByRole])

  // Group pending agreements by what action is needed
  const pendingGroups = useMemo(() => {
    const groups = {
      approval: [] as Agreement[], // Waiting for your approval to release funds
      funding: [] as Agreement[],  // Waiting for funds to be deposited
      review: [] as Agreement[],   // Work submitted, waiting for your review
      dispute: [] as Agreement[],  // In dispute
    }

    categorized.pending.forEach((agreement) => {
      const status = agreement.status.toLowerCase()
      const hasApprovedMilestones = agreement.milestones?.some(m => m.status === "approved")
      const hasPendingMilestones = agreement.milestones?.some(m => m.status === "pending")
      
      if (status === "dispute") {
        groups.dispute.push(agreement)
      } else if (status === "funded" || hasApprovedMilestones) {
        // Funded or has approved milestones = waiting for approval to release
        groups.approval.push(agreement)
      } else if (status === "pending" && !hasPendingMilestones) {
        // Pending with no milestone work = needs funding
        groups.funding.push(agreement)
      } else if (hasPendingMilestones) {
        // Has pending milestones = waiting for work/review
        groups.review.push(agreement)
      } else {
        // Default to review
        groups.review.push(agreement)
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
    { id: "pending" as TabType, label: "Needs Action", description: "Waiting for you", count: categorized.pending.length, icon: Clock },
    { id: "active" as TabType, label: "In Progress", description: "Work being done", count: categorized.active.length, icon: Play },
    { id: "completed" as TabType, label: "Completed", description: "Finished", count: categorized.completed.length, icon: CheckCircle },
  ]

  const pendingGroupConfig = [
    { id: "approval" as PendingGroup, label: "Ready for Release", description: "Approve to release funds", icon: CheckCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
    { id: "funding" as PendingGroup, label: "Awaiting Funding", description: "Deposit funds to start", icon: AlertTriangle, color: "text-sky-400", bg: "bg-sky-400/10" },
    { id: "review" as PendingGroup, label: "Work Submitted", description: "Review completed work", icon: FileText, color: "text-violet-400", bg: "bg-violet-400/10" },
    { id: "dispute" as PendingGroup, label: "In Dispute", description: "Requires resolution", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-400/10" },
  ]

  // Pagination
  const totalPages = Math.ceil(filteredAgreements.length / ITEMS_PER_PAGE)
  const paginatedAgreements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAgreements.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAgreements, currentPage])

  // Reset page when changing tabs or search
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

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
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 rounded-md px-3 py-2 transition-colors",
              activeTab === tab.id
                ? "bg-[#f0b400]/10 text-[#f0b400]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  activeTab === tab.id ? "bg-[#f0b400]/20" : "bg-white/10"
                )}>
                  {tab.count}
                </span>
              )}
            </div>
            <span className="text-[10px] opacity-60">{tab.description}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "pending" ? (
        /* Pending - Grouped View with Pagination per Group */
        <div className="space-y-3">
          {pendingGroupConfig.map((group) => {
            const groupAgreements = pendingGroups[group.id]
            if (groupAgreements.length === 0) return null
            
            const isExpanded = expandedGroups.includes(group.id)
            const displayedAgreements = isExpanded ? groupAgreements.slice(0, 5) : []
            const hasMore = groupAgreements.length > 5
            
            return (
              <div key={group.id} className="rounded-xl border border-white/10 bg-[#0c1220] overflow-hidden">
                {/* Group Header - Compact */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-1.5", group.bg)}>
                      <group.icon className={cn("h-4 w-4", group.color)} />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-white">{group.label}</span>
                      <p className="text-[10px] text-white/40">{group.description}</p>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", group.bg, group.color)}>
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

                {/* Group Content - Limited to 5 items */}
                {isExpanded && (
                  <div className="border-t border-white/6">
                    <div className="divide-y divide-white/6">
                      {displayedAgreements.map((agreement) => (
                        <AgreementCard
                          key={agreement.id}
                          agreement={agreement}
                          onClick={() => onAgreementClick(agreement.id)}
                          onChat={onOpenChat ? () => onOpenChat(agreement.id) : undefined}
                        />
                      ))}
                    </div>
                    {/* Show more button */}
                    {hasMore && (
                      <button 
                        onClick={() => {/* TODO: Navigate to filtered view */}}
                        className="w-full py-2.5 text-xs font-medium text-[#f0b400] hover:bg-[#f0b400]/5 transition-colors border-t border-white/6"
                      >
                        View all {groupAgreements.length} agreements
                      </button>
                    )}
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
        /* Active / Completed - List View with Pagination */
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-[#0c1220] divide-y divide-white/6">
            {paginatedAgreements.length === 0 ? (
              <EmptyState 
                message={activeTab === "active" ? "No active agreements" : "No completed agreements"} 
                description={activeTab === "active" ? "Agreements with work in progress will appear here" : "Completed agreements will appear here"}
              />
            ) : (
              paginatedAgreements.map((agreement) => (
                <AgreementCard
                  key={agreement.id}
                  agreement={agreement}
                  onClick={() => onAgreementClick(agreement.id)}
                  onChat={onOpenChat ? () => onOpenChat(agreement.id) : undefined}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-[#0c1220]">
              <p className="text-xs text-white/40">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredAgreements.length)} of {filteredAgreements.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-white/60 min-w-[60px] text-center">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
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
