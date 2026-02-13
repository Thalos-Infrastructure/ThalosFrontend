"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"
import { LanguageToggle } from "@/lib/i18n"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts"

/* ────────────────────────────────────────────────
   Mock Data
   ──────────────────────────────────────────────── */

type AgreementStatus = "draft" | "funded" | "in_progress" | "completed" | "disputed"

interface Agreement {
  id: string
  type: "one-time" | "milestone"
  sellerWallet: string
  buyerWallet: string
  totalAmount: number
  platformFee: number
  status: AgreementStatus
  createdAt: string
  completedAt: string | null
}

const mockAgreements: Agreement[] = [
  { id: "ESC-001", type: "milestone", sellerWallet: "GBXK7F...4R2P", buyerWallet: "GCQV8L...9T1M", totalAmount: 12500, platformFee: 250, status: "completed", createdAt: "2025-11-15", completedAt: "2025-12-20" },
  { id: "ESC-002", type: "one-time", sellerWallet: "GDMR3T...7K5N", buyerWallet: "GFPL2Q...8W3J", totalAmount: 3200, platformFee: 64, status: "in_progress", createdAt: "2025-12-01", completedAt: null },
  { id: "ESC-003", type: "milestone", sellerWallet: "GHNW9P...1L6R", buyerWallet: "GBXK7F...4R2P", totalAmount: 45000, platformFee: 900, status: "funded", createdAt: "2025-12-10", completedAt: null },
  { id: "ESC-004", type: "one-time", sellerWallet: "GCQV8L...9T1M", buyerWallet: "GDMR3T...7K5N", totalAmount: 800, platformFee: 16, status: "completed", createdAt: "2025-10-05", completedAt: "2025-10-12" },
  { id: "ESC-005", type: "milestone", sellerWallet: "GFPL2Q...8W3J", buyerWallet: "GHNW9P...1L6R", totalAmount: 18750, platformFee: 375, status: "disputed", createdAt: "2025-11-20", completedAt: null },
  { id: "ESC-006", type: "one-time", sellerWallet: "GBXK7F...4R2P", buyerWallet: "GCQV8L...9T1M", totalAmount: 5400, platformFee: 108, status: "completed", createdAt: "2025-09-18", completedAt: "2025-09-25" },
  { id: "ESC-007", type: "milestone", sellerWallet: "GDMR3T...7K5N", buyerWallet: "GFPL2Q...8W3J", totalAmount: 22000, platformFee: 440, status: "in_progress", createdAt: "2026-01-05", completedAt: null },
  { id: "ESC-008", type: "one-time", sellerWallet: "GHNW9P...1L6R", buyerWallet: "GBXK7F...4R2P", totalAmount: 1500, platformFee: 30, status: "draft", createdAt: "2026-01-10", completedAt: null },
  { id: "ESC-009", type: "milestone", sellerWallet: "GCQV8L...9T1M", buyerWallet: "GDMR3T...7K5N", totalAmount: 35000, platformFee: 700, status: "completed", createdAt: "2025-08-22", completedAt: "2025-11-30" },
  { id: "ESC-010", type: "one-time", sellerWallet: "GFPL2Q...8W3J", buyerWallet: "GHNW9P...1L6R", totalAmount: 6800, platformFee: 136, status: "funded", createdAt: "2026-01-15", completedAt: null },
  { id: "ESC-011", type: "milestone", sellerWallet: "GBXK7F...4R2P", buyerWallet: "GFPL2Q...8W3J", totalAmount: 9200, platformFee: 184, status: "completed", createdAt: "2025-07-10", completedAt: "2025-08-15" },
  { id: "ESC-012", type: "one-time", sellerWallet: "GDMR3T...7K5N", buyerWallet: "GCQV8L...9T1M", totalAmount: 2100, platformFee: 42, status: "completed", createdAt: "2025-06-05", completedAt: "2025-06-12" },
]

const revenueData = [
  { month: "Jun", revenue: 42 },
  { month: "Jul", revenue: 184 },
  { month: "Aug", revenue: 700 },
  { month: "Sep", revenue: 108 },
  { month: "Oct", revenue: 16 },
  { month: "Nov", revenue: 625 },
  { month: "Dec", revenue: 964 },
  { month: "Jan", revenue: 606 },
]

const volumeData = [
  { month: "Jun", volume: 2100 },
  { month: "Jul", volume: 9200 },
  { month: "Aug", volume: 35000 },
  { month: "Sep", volume: 5400 },
  { month: "Oct", volume: 800 },
  { month: "Nov", volume: 31250 },
  { month: "Dec", volume: 48200 },
  { month: "Jan", volume: 30300 },
]

/* ────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────── */

const statusColors: Record<AgreementStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  funded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-[#f0b400]/10 text-[#f0b400] border-[#f0b400]/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  disputed: "bg-red-500/10 text-red-400 border-red-500/20",
}

const statusLabels: Record<AgreementStatus, string> = {
  draft: "Draft",
  funded: "Funded",
  in_progress: "In Progress",
  completed: "Completed",
  disputed: "Disputed",
}

const PAGE_SIZE = 6

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState(false)
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "one-time" | "milestone">("all")
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc")
  const [page, setPage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(timer)
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "Thalos2026*") {
      setAuthenticated(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
      setPassword("")
    }
  }

  /* ── Computed ── */
  const filtered = useMemo(() => {
    let list = [...mockAgreements]
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter)
    if (typeFilter !== "all") list = list.filter((a) => a.type === typeFilter)
    list.sort((a, b) => sortDir === "desc" ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt))
    return list
  }, [statusFilter, typeFilter, sortDir])

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const totalVolume = mockAgreements.reduce((s, a) => s + a.totalAmount, 0)
  const totalFees = mockAgreements.reduce((s, a) => s + a.platformFee, 0)
  const activeCount = mockAgreements.filter((a) => a.status !== "completed" && a.status !== "disputed").length
  const completedCount = mockAgreements.filter((a) => a.status === "completed").length
  const uniqueWallets = new Set(mockAgreements.flatMap((a) => [a.sellerWallet, a.buyerWallet])).size
  const disputeRate = ((mockAgreements.filter((a) => a.status === "disputed").length / mockAgreements.length) * 100).toFixed(1)

  if (loading) return <ThalosLoader />

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/10 backdrop-blur-md">
        <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center [perspective:800px]">
            <Image src="/thalos-icon.png" alt="Thalos" width={250} height={250}
              className="h-20 w-auto object-contain [transform-style:preserve-3d] transition-transform duration-[1.2s] ease-[cubic-bezier(0.45,0.05,0.55,0.95)] group-hover:[transform:rotateY(360deg)]"
              priority />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <span className="text-sm text-white/70 font-medium hidden sm:inline">Admin Panel</span>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full border-white/20 bg-white/5 text-white/70 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300">
                Sign Out
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Platform analytics, agreement monitoring, and compliance overview</p>
        </div>

        {/* ── Metric Cards ── */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total Volume", value: `$${totalVolume.toLocaleString()}`, sub: "All time processed" },
            { label: "Platform Fees", value: `$${totalFees.toLocaleString()}`, sub: "Revenue earned" },
            { label: "Active Agreements", value: String(activeCount), sub: "Currently open" },
            { label: "Completed", value: String(completedCount), sub: "Successfully closed" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[#f0b400]/30 hover:shadow-[0_4px_24px_rgba(240,180,0,0.08)]">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{m.value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly Revenue</h3>
            <p className="mb-6 text-xs text-muted-foreground/60">Platform fees earned per month</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(20,20,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: 13 }}
                    formatter={(value: number) => [`$${value}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#f0b400" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume Chart */}
          <div className="rounded-2xl border border-border/40 bg-card/40 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly Volume</h3>
            <p className="mb-6 text-xs text-muted-foreground/60">Total USDC processed per month</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                  <defs>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f0b400" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f0b400" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(20,20,25,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: 13 }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#f0b400" fill="url(#volumeGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Filters Bar ── */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {(["all", "draft", "funded", "in_progress", "completed", "disputed"] as const).map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(0) }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                  statusFilter === s
                    ? "border-[#f0b400]/40 bg-[#f0b400]/10 text-[#f0b400]"
                    : "border-border/40 bg-card/30 text-muted-foreground hover:border-[#f0b400]/30 hover:text-[#f0b400]"
                )}>
                {s === "all" ? "All" : statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Type:</span>
            {(["all", "one-time", "milestone"] as const).map((t) => (
              <button key={t} onClick={() => { setTypeFilter(t); setPage(0) }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
                  typeFilter === t
                    ? "border-[#f0b400]/40 bg-[#f0b400]/10 text-[#f0b400]"
                    : "border-border/40 bg-card/30 text-muted-foreground hover:border-[#f0b400]/30 hover:text-[#f0b400]"
                )}>
                {t === "all" ? "All" : t === "one-time" ? "One-Time" : "Milestone"}
              </button>
            ))}
          </div>
          <button onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
            className="ml-auto flex items-center gap-1.5 rounded-full border border-border/40 bg-card/30 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-[#f0b400] hover:border-[#f0b400]/30 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sortDir === "desc" ? <path d="M12 5v14M5 12l7 7 7-7"/> : <path d="M12 19V5M5 12l7-7 7 7"/>}
            </svg>
            {sortDir === "desc" ? "Newest First" : "Oldest First"}
          </button>
        </div>

        {/* ── Agreements Table ── */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  {["ID", "Type", "Seller", "Buyer", "Amount", "Fee", "Status", "Created"].map((h) => (
                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((a) => (
                  <tr key={a.id} className="border-b border-border/20 transition-colors hover:bg-[#f0b400]/[0.02]">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{a.id}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {a.type === "one-time" ? "One-Time" : "Milestone"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-mono">{a.sellerWallet}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground font-mono">{a.buyerWallet}</td>
                    <td className="px-5 py-4 text-sm font-medium text-foreground">${a.totalAmount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm text-[#f0b400]">${a.platformFee}</td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={cn("rounded-full text-xs", statusColors[a.status])}>
                        {statusLabels[a.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{a.createdAt}</td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">No agreements match the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col gap-3 p-4 md:hidden">
            {paged.map((a) => (
              <div key={a.id} className="rounded-xl border border-border/30 bg-card/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">{a.id}</span>
                  <Badge variant="outline" className={cn("rounded-full text-xs", statusColors[a.status])}>
                    {statusLabels[a.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Type: </span><span className="text-foreground">{a.type === "one-time" ? "One-Time" : "Milestone"}</span></div>
                  <div><span className="text-muted-foreground">Amount: </span><span className="font-medium text-foreground">${a.totalAmount.toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Fee: </span><span className="text-[#f0b400]">${a.platformFee}</span></div>
                  <div><span className="text-muted-foreground">Date: </span><span className="text-foreground">{a.createdAt}</span></div>
                </div>
                <div className="mt-2 flex flex-col gap-1 text-xs font-mono text-muted-foreground">
                  <span>Seller: {a.sellerWallet}</span>
                  <span>Buyer: {a.buyerWallet}</span>
                </div>
              </div>
            ))}
            {paged.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No agreements match the current filters.</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/20 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="rounded-full border-border/40 text-muted-foreground text-xs hover:text-[#f0b400] hover:border-[#f0b400]/30 bg-transparent">
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                  className="rounded-full border-border/40 text-muted-foreground text-xs hover:text-[#f0b400] hover:border-[#f0b400]/30 bg-transparent">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Audit Overview ── */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Audit Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Unique Wallets", value: String(uniqueWallets), desc: "Distinct addresses connected" },
              { label: "Total Agreements", value: String(mockAgreements.length), desc: "All time created" },
              { label: "Dispute Rate", value: `${disputeRate}%`, desc: "Agreements with disputes" },
            ].map((a) => (
              <div key={a.label} className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-xs text-muted-foreground">{a.label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{a.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
