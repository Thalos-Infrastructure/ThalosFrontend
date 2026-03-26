"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Briefcase,
  Home,
  Car,
  BookOpen,
  Wrench,
  MoreHorizontal,
  Share2,
  Copy,
  Check,
} from "lucide-react"

export interface Agreement {
  id: string
  title: string
  status: "draft" | "pending" | "funded" | "in_progress" | "completed" | "released" | "dispute"
  type: "freelancer" | "rental" | "car-sale" | "coaching" | "home-repair" | "bounty" | "other"
  counterparty: string
  amount: string
  date: string
  milestones?: { description: string; amount: string; status: string }[]
}

interface AgreementsListProps {
  agreements: Agreement[]
  onAgreementClick: (id: string) => void
  onShareAgreement: (id: string, method: "link" | "email" | "whatsapp") => void
  className?: string
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  freelancer: { icon: <User className="h-4 w-4" />, label: "Freelance", color: "text-sky-400" },
  rental: { icon: <Home className="h-4 w-4" />, label: "Rental", color: "text-violet-400" },
  "car-sale": { icon: <Car className="h-4 w-4" />, label: "Vehicle", color: "text-amber-400" },
  coaching: { icon: <BookOpen className="h-4 w-4" />, label: "Coaching", color: "text-emerald-400" },
  "home-repair": { icon: <Wrench className="h-4 w-4" />, label: "Services", color: "text-rose-400" },
  bounty: { icon: <Briefcase className="h-4 w-4" />, label: "Bounty", color: "text-[#f0b400]" },
  other: { icon: <MoreHorizontal className="h-4 w-4" />, label: "Other", color: "text-white/60" },
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
  draft: { icon: <FileText className="h-3 w-3" />, label: "Draft", color: "text-white/50", bgColor: "bg-white/10" },
  pending: { icon: <Clock className="h-3 w-3" />, label: "Pending", color: "text-amber-400", bgColor: "bg-amber-400/10" },
  funded: { icon: <DollarSign className="h-3 w-3" />, label: "Funded", color: "text-sky-400", bgColor: "bg-sky-400/10" },
  in_progress: { icon: <Clock className="h-3 w-3" />, label: "In Progress", color: "text-violet-400", bgColor: "bg-violet-400/10" },
  completed: { icon: <CheckCircle className="h-3 w-3" />, label: "Completed", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  released: { icon: <CheckCircle className="h-3 w-3" />, label: "Released", color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  dispute: { icon: <AlertCircle className="h-3 w-3" />, label: "Dispute", color: "text-rose-400", bgColor: "bg-rose-400/10" },
}

export function AgreementsList({
  agreements,
  onAgreementClick,
  onShareAgreement,
  className,
}: AgreementsListProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["in_progress", "funded", "pending"]))
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Group agreements by status
  const groupedAgreements = useMemo(() => {
    const filtered = agreements.filter((a) => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.counterparty.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = !selectedType || a.type === selectedType
      return matchesSearch && matchesType
    })

    const groups: Record<string, Agreement[]> = {
      pending: [],
      funded: [],
      in_progress: [],
      completed: [],
      released: [],
      dispute: [],
      draft: [],
    }

    filtered.forEach((a) => {
      if (groups[a.status]) {
        groups[a.status].push(a)
      }
    })

    return groups
  }, [agreements, searchQuery, selectedType])

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  const copyAgreementLink = async (id: string) => {
    const link = `${window.location.origin}/agreement/${id}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className={cn("", className)}>
      {/* Search and filters */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder={t("agreements.searchPlaceholder") || "Search agreements..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 rounded-xl border border-white/10 bg-[#0c1220]/60 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/30 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedType(null)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              !selectedType ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-white/5 text-white/50 hover:bg-white/10"
            )}
          >
            {t("agreements.all") || "All"}
          </button>
          {Object.entries(typeConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key === selectedType ? null : key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                selectedType === key ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-white/5 text-white/50 hover:bg-white/10"
              )}
            >
              {config.icon}
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped list */}
      <div className="space-y-4">
        {Object.entries(groupedAgreements).map(([status, items]) => {
          if (items.length === 0) return null
          const config = statusConfig[status]
          const isExpanded = expandedGroups.has(status)

          return (
            <div key={status} className="rounded-2xl border border-white/6 bg-[#0c1220]/60 overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(status)}
                className="flex w-full items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg p-1.5", config.bgColor)}>
                    {config.icon}
                  </div>
                  <span className={cn("text-sm font-medium", config.color)}>
                    {t(`agreements.status.${status}`) || config.label}
                  </span>
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/10 px-1.5 text-[10px] font-bold text-white/60">
                    {items.length}
                  </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-white/30 transition-transform", isExpanded && "rotate-180")} />
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="border-t border-white/6">
                  {items.map((agreement, idx) => {
                    const type = typeConfig[agreement.type] || typeConfig.other
                    return (
                      <div
                        key={agreement.id}
                        className={cn(
                          "flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer",
                          idx > 0 && "border-t border-white/6"
                        )}
                        onClick={() => onAgreementClick(agreement.id)}
                      >
                        {/* Type icon */}
                        <div className={cn("rounded-lg bg-white/5 p-2.5", type.color)}>
                          {type.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{agreement.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-white/40">{agreement.counterparty}</span>
                            <span className="text-white/20">·</span>
                            <span className="text-xs text-white/30">{agreement.date}</span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#f0b400]">${agreement.amount}</p>
                          <p className="text-[10px] text-white/30 uppercase">USDC</p>
                        </div>

                        {/* Share actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => copyAgreementLink(agreement.id)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Copy link"
                          >
                            {copiedId === agreement.id ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-white/40" />
                            )}
                          </button>
                          <button
                            onClick={() => onShareAgreement(agreement.id, "whatsapp")}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Share via WhatsApp"
                          >
                            <Share2 className="h-4 w-4 text-white/40" />
                          </button>
                        </div>

                        <ChevronRight className="h-4 w-4 text-white/30" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Empty state */}
        {Object.values(groupedAgreements).every((items) => items.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-white/5 p-4 mb-4">
              <FileText className="h-8 w-8 text-white/30" />
            </div>
            <p className="text-sm font-medium text-white/60">
              {t("agreements.noAgreements") || "No agreements found"}
            </p>
            <p className="text-xs text-white/30 mt-1">
              {t("agreements.createFirst") || "Create your first agreement to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
