"use client"

import React, { useState, useEffect, useCallback, useId, useRef, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"
import { LanguageToggle, ThemeToggle, useLanguage } from "@/lib/i18n"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts"

/* ── Enterprise Use-Cases ── */
const useCases = [
  { id: "car-rental", labelKey: "useCase.carRental", icon: "car", suggestedTitle: "Vehicle Rental Agreement", suggestedDesc: "Describe the fleet vehicle, rental duration, mileage limits, insurance terms, and return conditions." },
  { id: "travel", labelKey: "useCase.travel", icon: "plane", suggestedTitle: "Travel Package Agreement", suggestedDesc: "Describe the travel package details, destinations, dates, inclusions, cancellation policy, and payment schedule." },
  { id: "dealership", labelKey: "useCase.dealership", icon: "tag", suggestedTitle: "Vehicle Purchase Agreement", suggestedDesc: "Describe the vehicle make/model/year, VIN, agreed price, financing terms, and delivery conditions." },
  { id: "rental-platform", labelKey: "useCase.rentalPlatform", icon: "home", suggestedTitle: "Short-Term Rental Agreement", suggestedDesc: "Describe the property, booking dates, house rules, deposit amount, and checkout procedures." },
  { id: "event", labelKey: "useCase.event", icon: "calendar", suggestedTitle: "Event Management Agreement", suggestedDesc: "Describe the event type, venue, date, services included, setup requirements, and payment milestones." },
  { id: "other", labelKey: "useCase.other", icon: "plus", suggestedTitle: "", suggestedDesc: "" },
]

/* ── Form Components ── */
function FormInput({ label, value, onChange, placeholder, type = "text", disabled = false, info, required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; info?: string; required?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-[#f0b400]">*</span>}
        {info && <span className="normal-case tracking-normal font-normal text-muted-foreground/50">({info})</span>}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={cn("h-12 w-full rounded-xl border border-border/40 bg-card/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 transition-all duration-200", disabled && "opacity-50 cursor-not-allowed")} />
    </div>
  )
}

function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full rounded-xl border border-border/40 bg-card/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 transition-all duration-200 resize-none" />
    </div>
  )
}

function FormSelect({ label, value, onChange, options, info, required = false }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; info?: string; required?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-[#f0b400]">*</span>}
        {info && <span className="normal-case tracking-normal font-normal text-muted-foreground/50">({info})</span>}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-xl border border-border/40 bg-card/30 px-4 text-sm text-foreground focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 transition-all duration-200">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

/* ── Constants ── */
const PLATFORM_ADDRESS = "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAVRWPLXS"
const DISPUTE_RESOLVER = "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAVDISPUTE"
const TRUSTLINE_USDC = { symbol: "USDC", address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" }

const connectedWallets = [
  { value: "GBXGQJWVLWOYHFLVTKWV5FGHA3ENTERPRISE01", labelKey: "wallet.corporate", short: "G...SE01", balance: "245,000.00" },
  { value: "GBXGQJWVLWOYHFLVTKWV5FGHA3ENTERPRISE02", labelKey: "wallet.operations", short: "G...SE02", balance: "88,500.50" },
  { value: "GBXGQJWVLWOYHFLVTKWV5FGHA3ENTERPRISE03", labelKey: "wallet.treasury", short: "G...SE03", balance: "512,200.00" },
]

const wizardStepKeys = ["wizard.escrowType", "wizard.useCase", "wizard.agreementInfo", "wizard.paymentWallets", "wizard.reviewSend"]

interface Milestone { description: string; amount: string; status: "pending" | "approved" | "released" }
interface Agreement { id: string; title: string; status: string; type: "Single Release" | "Multi Release"; counterparty: string; amount: string; date: string; releaseStrategy?: "per-milestone" | "all-at-once" | "upon-completion"; milestones: Milestone[]; receiver: string }

const initialAgreements: Agreement[] = [
  { id: "ENT-001", title: "Fleet Vehicle Purchase", status: "funded", type: "Multi Release", counterparty: "G...DLR5", amount: "125,000", date: "2026-01-20", releaseStrategy: "per-milestone", milestones: [{ description: "Down Payment (10 units)", amount: "50,000", status: "released" }, { description: "Delivery of first batch", amount: "37,500", status: "approved" }, { description: "Final batch + inspection", amount: "37,500", status: "pending" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3DLR5" },
  { id: "ENT-002", title: "Resort Partnership Q2", status: "in_progress", type: "Multi Release", counterparty: "G...TRV8", amount: "48,000", date: "2026-01-15", releaseStrategy: "upon-completion", milestones: [{ description: "Contract signing", amount: "12,000", status: "approved" }, { description: "Marketing materials", amount: "12,000", status: "approved" }, { description: "Launch campaign", amount: "12,000", status: "pending" }, { description: "Performance review", amount: "12,000", status: "pending" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3TRV8" },
  { id: "ENT-003", title: "Corporate Event Setup", status: "released", type: "Single Release", counterparty: "G...EVT2", amount: "15,000", date: "2025-12-18", milestones: [{ description: "Full event delivery", amount: "15,000", status: "released" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3EVT2" },
  { id: "ENT-004", title: "Property Management Fee", status: "in_progress", type: "Multi Release", counterparty: "G...RNT9", amount: "6,500", date: "2025-12-05", releaseStrategy: "all-at-once", milestones: [{ description: "Q1 management fee", amount: "1,625", status: "approved" }, { description: "Q2 management fee", amount: "1,625", status: "approved" }, { description: "Q3 management fee", amount: "1,625", status: "approved" }, { description: "Q4 management fee", amount: "1,625", status: "pending" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3RNT9" },
]

const statusConfig: Record<string, { labelKey: string; color: string }> = {
  funded: { labelKey: "status.funded", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { labelKey: "status.inProgress", color: "bg-[#f0b400]/10 text-[#f0b400] border-[#f0b400]/20" },
  awaiting: { labelKey: "status.awaitingApproval", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  released: { labelKey: "status.released", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
}

const monthlyData = [
  { month: "Aug", agreements: 5, volume: 82000 },
  { month: "Sep", agreements: 8, volume: 125000 },
  { month: "Oct", agreements: 6, volume: 98000 },
  { month: "Nov", agreements: 12, volume: 194500 },
  { month: "Dec", agreements: 9, volume: 148000 },
  { month: "Jan", agreements: 15, volume: 245000 },
  { month: "Feb", agreements: 7, volume: 115000 },
]

/* Icon helper */
function UseCaseIcon({ icon }: { icon: string }) {
  if (icon === "car") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  if (icon === "plane") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
  if (icon === "tag") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
  if (icon === "home") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
  if (icon === "calendar") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}

/* Sidebar nav items */
const sidebarItems = [
  { id: "create", labelKey: "dashPage.newAgreement", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { id: "agreements", labelKey: "dashPage.agreements", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: "templates", labelKey: "dashPage.templates", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
  { id: "wallets", labelKey: "dashPage.wallets", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
  { id: "analytics", labelKey: "dashPage.analytics", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
]

/* ════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════ */
export default function BusinessDashboardPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1400); return () => clearTimeout(t) }, [])

  const [activeSection, setActiveSection] = useState("agreements")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements)
  const [viewingAgreement, setViewingAgreement] = useState<string | null>(null)

  const approveMilestone = (agrId: string, msIdx: number) => {
    setAgreements(prev => prev.map(a => a.id === agrId ? { ...a, milestones: a.milestones.map((m, i) => i === msIdx && m.status === "pending" ? { ...m, status: "approved" as const } : m) } : a))
  }
  const releaseMilestone = (agrId: string, msIdx: number) => {
    setAgreements(prev => prev.map(a => a.id === agrId ? { ...a, milestones: a.milestones.map((m, i) => i === msIdx && m.status === "approved" ? { ...m, status: "released" as const } : m) } : a))
  }
  const releaseAllApproved = (agrId: string) => {
    setAgreements(prev => prev.map(a => a.id === agrId ? { ...a, milestones: a.milestones.map(m => m.status === "approved" ? { ...m, status: "released" as const } : m) } : a))
  }
  const approveAndReleaseAll = (agrId: string) => {
    setAgreements(prev => prev.map(a => a.id === agrId ? { ...a, status: "released", milestones: a.milestones.map(m => ({ ...m, status: "released" as const })) } : a))
  }

  /* ── Wizard State ── */
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [escrowType, setEscrowType] = useState<"single" | "multi">("single")
  const [useCase, setUseCase] = useState<string | null>(null)
  const [customUseCase, setCustomUseCase] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [guidePrefilled, setGuidePrefilled] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState(connectedWallets[0].value)
  const [signerWallet, setSignerWallet] = useState("")
  const [milestones, setMilestones] = useState([{ description: "Full delivery", amount: "" }])
  const [showCustomize, setShowCustomize] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState("")
  const [signerEmail, setSignerEmail] = useState("")

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  useEffect(() => {
    if (useCase && !guidePrefilled) {
      if (useCase === "other") {
        if (customUseCase.trim()) { setTitle(customUseCase.trim()); setDescription(customUseCase.trim()); setGuidePrefilled(true) }
      } else {
        const uc = useCases.find((u) => u.id === useCase)
        if (uc) { setTitle(uc.suggestedTitle); setDescription(uc.suggestedDesc); setGuidePrefilled(true) }
      }
    }
  }, [useCase, guidePrefilled, customUseCase])

  const totalAmount = escrowType === "single" ? (parseFloat(milestones[0]?.amount) || 0) : milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0)
  const platformFee = (totalAmount * 0.01).toFixed(2)

  const addMilestone = () => setMilestones((p) => [...p, { description: "", amount: "" }])
  const removeMilestone = (i: number) => milestones.length > 1 && setMilestones((p) => p.filter((_, idx) => idx !== i))
  const updateMilestone = useCallback((i: number, field: "description" | "amount", val: string) => {
    setMilestones((p) => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n })
  }, [])

  const handleDragStart = (i: number) => { dragItem.current = i }
  const handleDragEnter = (i: number) => { dragOverItem.current = i }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    setMilestones((prev) => { const c = [...prev]; const d = c.splice(dragItem.current!, 1)[0]; c.splice(dragOverItem.current!, 0, d); return c })
    dragItem.current = null; dragOverItem.current = null
  }

  const generateJSON = () => ({
    engagementId: `THALOS-E-${Date.now().toString(36).toUpperCase()}`,
    title, description, amount: totalAmount.toString(), platformFee: "1", signer: selectedWallet,
    serviceType: escrowType === "single" ? "single-release" : "multi-release",
    roles: { approver: selectedWallet, serviceProvider: selectedWallet, releaseSigner: signerWallet, platformAddress: PLATFORM_ADDRESS, disputeResolver: DISPUTE_RESOLVER, receiver: selectedWallet },
    milestones: escrowType === "single" ? [{ description: milestones[0]?.description || "Full delivery", amount: totalAmount.toString(), status: "pending" }] : milestones.map((m) => ({ description: m.description || "Milestone", amount: m.amount || "0", status: "pending" })),
    trustline: TRUSTLINE_USDC, notifications: { notifyEmail, signerEmail },
  })

  const [copiedJson, setCopiedJson] = useState(false)
  const copyJson = () => { navigator.clipboard.writeText(JSON.stringify(generateJSON(), null, 2)); setCopiedJson(true); setTimeout(() => setCopiedJson(false), 2000) }

  const canProceed = () => {
    if (step === 0) return true
    if (step === 1) return useCase === "other" ? customUseCase.trim().length > 0 : !!useCase
    if (step === 2) return title.trim().length > 0
    if (step === 3) return signerWallet.trim().length > 0 && totalAmount > 0
    return true
  }

  const resetWizard = () => {
    setStep(0); setSubmitted(false); setEscrowType("single"); setUseCase(null); setCustomUseCase("")
    setTitle(""); setDescription(""); setSignerWallet(""); setGuidePrefilled(false)
    setMilestones([{ description: "Full delivery", amount: "" }]); setShowCustomize(false)
    setNotifyEmail(""); setSignerEmail(""); setSelectedWallet(connectedWallets[0].value)
  }

  const agreementUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard/business` : "https://thalos.app/dashboard/business"
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(agreementUrl)}&bgcolor=0a0a0a&color=f0b400&qzone=3&format=png`

  /* ── Agreements filter/sort state ── */
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "funded" | "in_progress" | "released">("all")
  const [sortBy, setSortBy] = useState<"date" | "amount" | "title">("date")

  const filteredAgreements = useMemo(() => {
    let filtered = [...agreements]
    if (statusFilter !== "all") {
      filtered = filtered.filter(agr => {
        const allReleased = agr.milestones.every(m => m.status === "released")
        const effectiveStatus = allReleased ? "released" : agr.status
        return effectiveStatus === statusFilter
      })
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(agr =>
        agr.title.toLowerCase().includes(q) ||
        agr.counterparty.toLowerCase().includes(q) ||
        agr.id.toLowerCase().includes(q)
      )
    }
    filtered.sort((a, b) => {
      if (sortBy === "date") return b.date.localeCompare(a.date)
      if (sortBy === "amount") return parseFloat(b.amount.replace(/,/g, "")) - parseFloat(a.amount.replace(/,/g, ""))
      return a.title.localeCompare(b.title)
    })
    return filtered
  }, [agreements, statusFilter, searchQuery, sortBy])

  const statusCounts = useMemo(() => {
    const counts = { all: agreements.length, funded: 0, in_progress: 0, released: 0 }
    agreements.forEach(agr => {
      const allReleased = agr.milestones.every(m => m.status === "released")
      const s = allReleased ? "released" : agr.status
      if (s in counts) counts[s as keyof typeof counts]++
    })
    return counts
  }, [agreements])

  /* ── Templates state ── */
  interface Template { id: string; name: string; escrowType: "single" | "multi"; useCase: string; title: string; description: string; milestones: { description: string; amount: string }[] }
  const [templates, setTemplates] = useState<Template[]>(() => {
    if (typeof window === "undefined") return []
    try { const stored = localStorage.getItem("thalos_biz_templates"); return stored ? JSON.parse(stored) : [] } catch { return [] }
  })
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("thalos_biz_templates", JSON.stringify(templates))
  }, [templates])

  const saveAsTemplate = () => {
    const tpl: Template = {
      id: `TPL-${Date.now().toString(36).toUpperCase()}`,
      name: templateName.trim() || title,
      escrowType, useCase: useCase || "", title, description,
      milestones: milestones.map(m => ({ description: m.description, amount: m.amount })),
    }
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate ? { ...tpl, id: editingTemplate } : t))
    } else {
      setTemplates(prev => [...prev, tpl])
    }
    setShowSaveTemplate(false); setTemplateName(""); setEditingTemplate(null)
  }

  const useTemplate = (tpl: Template) => {
    resetWizard()
    setEscrowType(tpl.escrowType)
    setUseCase(tpl.useCase || null)
    setTitle(tpl.title)
    setDescription(tpl.description)
    setMilestones(tpl.milestones.length > 0 ? tpl.milestones : [{ description: "Full delivery", amount: "" }])
    setGuidePrefilled(true)
    setStep(2)
    setActiveSection("create")
  }

  const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id))

  const startEditTemplate = (tpl: Template) => {
    setTemplateName(tpl.name); setEditingTemplate(tpl.id); setShowSaveTemplate(true)
    setEscrowType(tpl.escrowType); setUseCase(tpl.useCase || null)
    setTitle(tpl.title); setDescription(tpl.description)
    setMilestones(tpl.milestones.length > 0 ? tpl.milestones : [{ description: "Full delivery", amount: "" }])
  }

  if (loading) return <ThalosLoader />

  return (
    <div className="relative min-h-screen text-foreground">
      {/* Collage background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0 opacity-30">
          <div className="col-span-2 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1920&q=85&auto=format&fit=crop')" }} />
        </div>
        <div className="absolute inset-0 bg-background/75" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-transparent backdrop-blur-xl">
        <nav className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors" aria-label="Toggle sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <Link href="/" className="flex items-center">
              <Image src="/thalos-icon.png" alt="Thalos" width={48} height={48} className="h-10 w-10 object-contain" priority />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
                <div className="h-6 w-6 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                </div>
                <span className="hidden sm:inline">Enterprise</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0c0c0e] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.6)]" onClick={() => setProfileMenuOpen(false)}>
                  <button onClick={() => setActiveSection("dashboard")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Dashboard
                  </button>
                  <button onClick={() => setActiveSection("wallets")} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                    Wallets
                  </button>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <Link href="/" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </Link>
                </div>
              )}
            </div>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <div className="relative z-10 flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-16 left-0 z-30 w-64 border-r border-white/[0.06] bg-background/80 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-16 lg:translate-x-0 lg:h-[calc(100vh-64px)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Enterprise Account</p>
                <p className="text-xs text-white/40">G...SE01</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveSection(item.id); setSidebarOpen(false); if (item.id === "create") resetWizard() }}
                className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  activeSection === item.id ? "bg-[#3b82f6]/10 text-[#3b82f6]" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}>
                {item.icon}{t(`dashPage.${item.id === "create" ? "newAgreement" : item.id === "templates" ? "templates" : item.id}`)}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/[0.06] p-4">
            <div className="rounded-xl bg-[#3b82f6]/5 border border-[#3b82f6]/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3b82f6]/60">{t("dashPage.totalBalance")}</p>
              <p className="mt-1 text-xl font-bold text-[#3b82f6]">845,700.50 <span className="text-xs font-normal text-white/40">USDC</span></p>
            </div>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* ══════ ANALYTICS ══════ */}
          {activeSection === "analytics" && (
            <div className="mx-auto max-w-5xl">
              <h1 className="mb-6 text-2xl font-semibold text-white">{t("dashPage.enterprise")} {t("dashPage.analytics")}</h1>

              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { l: t("dashPage.active"), v: "12" },
                  { l: t("dashPage.totalVolume"), v: "$2.4M" },
                  { l: t("dashPage.yieldEarned"), v: "$24K" },
                  { l: t("dashPage.completed"), v: "48" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-white/[0.06] bg-[#0a0a0c]/70 p-4 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{s.l}</p>
                    <p className="mt-1 text-lg font-bold text-white">{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md">
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-white/40">{t("dashPage.monthlyAgreements")}</h3>
                  <p className="mb-4 text-xs text-white/25">&nbsp;</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(15,15,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: 13 }} />
                        <Bar dataKey="agreements" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md">
                  <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider text-white/40">{t("dashPage.volume")}</h3>
                  <p className="mb-4 text-xs text-white/25">&nbsp;</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="volGradE" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(15,15,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: 13 }} formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]} />
                        <Area type="monotone" dataKey="volume" stroke="#3b82f6" fill="url(#volGradE)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">{t("dashPage.recentAgreements")}</h3>
                  <button onClick={() => setActiveSection("agreements")} className="text-xs font-semibold text-[#3b82f6] hover:underline">{t("dashPage.viewAll")}</button>
                </div>
                <div className="flex flex-col gap-3">
                  {agreements.slice(0, 4).map((agr) => {
                    const allReleased = agr.milestones.every(m => m.status === "released")
                    const effectiveStatus = allReleased ? "released" : agr.status
                    const st = statusConfig[effectiveStatus] || statusConfig.funded
                    return (
                      <button key={agr.id} onClick={() => { setViewingAgreement(agr.id); setActiveSection("agreements") }} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 hover:border-white/10 transition-all text-left w-full">
                        <div>
                          <p className="text-sm font-medium text-white">{agr.title}</p>
                          <p className="text-xs text-white/30">{agr.type} -- {agr.counterparty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", st.color)}>{t(st.labelKey)}</span>
                          <p className="text-sm font-bold text-white">{"$"}{agr.amount}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════ AGREEMENTS ══════ */}
          {activeSection === "agreements" && !viewingAgreement && (
            <div className="mx-auto max-w-4xl">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">{t("dashPage.enterpriseAgreements")}</h1>
                <Button onClick={() => { setActiveSection("create"); resetWizard() }} className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]">+ {t("dashPage.newAgreement")}</Button>
              </div>

              {/* Toolbar */}
              <div className="mb-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("dashPage.searchPlaceholder")}
                      className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:border-[#3b82f6]/40 focus:outline-none focus:ring-1 focus:ring-[#3b82f6]/15 transition-all"
                    />
                  </div>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "title")}
                    className="h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-medium text-white/60 focus:border-[#3b82f6]/40 focus:outline-none appearance-none cursor-pointer">
                    <option value="date">{t("dashPage.sortBy")}: {t("dashPage.sortDate")}</option>
                    <option value="amount">{t("dashPage.sortBy")}: {t("dashPage.sortAmount")}</option>
                    <option value="title">{t("dashPage.sortBy")}: {t("dashPage.sortTitle")}</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(["all", "funded", "in_progress", "released"] as const).map((s) => {
                    const labelMap = { all: "dashPage.all", funded: "dashPage.funded", in_progress: "dashPage.inProgress", released: "dashPage.releasedFilter" }
                    const count = statusCounts[s]
                    return (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                          statusFilter === s ? "bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/20" : "text-white/40 hover:text-white/60 hover:bg-white/[0.04] border border-transparent"
                        )}>
                        {t(labelMap[s])}
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                          statusFilter === s ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-white/[0.06] text-white/30"
                        )}>{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Agreements list */}
              {filteredAgreements.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 py-16 px-6 text-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/15 mb-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p className="text-sm font-medium text-white/40">{t("dashPage.noResults")}</p>
                  <p className="mt-1 text-xs text-white/20">{t("dashPage.noResultsDesc")}</p>
                </div>
              ) : (
              <div className="flex flex-col gap-4">
                {filteredAgreements.map((agr) => {
                  const allReleased = agr.milestones.every(m => m.status === "released")
                  const effectiveStatus = allReleased ? "released" : agr.status
                  const st = statusConfig[effectiveStatus] || statusConfig.funded
                  const completedMs = agr.milestones.filter(m => m.status === "released").length
                  const progressPct = (completedMs / agr.milestones.length) * 100
                  return (
                    <button key={agr.id} onClick={() => setViewingAgreement(agr.id)}
                      className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md transition-all hover:border-white/15 text-left w-full">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
                        <div>
                          <p className="text-base font-semibold text-white">{agr.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/35">
                            <span>{agr.type}</span><span className="text-white/15">|</span><span>{agr.counterparty}</span><span className="text-white/15">|</span><span>{agr.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", st.color)}>{t(st.labelKey)}</span>
                          <p className="text-lg font-bold text-white">{"$"}{agr.amount} <span className="text-xs font-normal text-white/35">USDC</span></p>
                        </div>
                      </div>
                      {agr.milestones.length > 1 && (
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className={cn("h-full rounded-full transition-all duration-500", allReleased ? "bg-emerald-400" : "bg-[#3b82f6]")} style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-xs text-white/30">{completedMs}/{agr.milestones.length}</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              )}
            </div>
          )}

          {/* ══════ AGREEMENT DETAIL ══════ */}
          {activeSection === "agreements" && viewingAgreement && (() => {
            const agr = agreements.find(a => a.id === viewingAgreement)
            if (!agr) return null
            const allReleased = agr.milestones.every(m => m.status === "released")
            const allApproved = agr.milestones.every(m => m.status === "approved" || m.status === "released")
            const hasApproved = agr.milestones.some(m => m.status === "approved")
            const effectiveStatus = allReleased ? "released" : agr.status
            const st = statusConfig[effectiveStatus] || statusConfig.funded
            const completedMs = agr.milestones.filter(m => m.status === "released").length
            const progressPct = (completedMs / agr.milestones.length) * 100

            return (
              <div className="mx-auto max-w-4xl">
                <button onClick={() => setViewingAgreement(null)} className="mb-6 flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  Back to Agreements
                </button>

                <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-white">{agr.title}</h1>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", st.color)}>{t(st.labelKey)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
                        <span className="font-mono">{agr.id}</span>
                        <span className="text-white/15">|</span>
                        <span>{agr.type}</span>
                        <span className="text-white/15">|</span>
                        <span>Counterparty: {agr.counterparty}</span>
                        <span className="text-white/15">|</span>
                        <span>{agr.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[#3b82f6]">{"$"}{agr.amount}</p>
                      <p className="text-xs text-white/35">USDC</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={cn("h-full rounded-full transition-all duration-700", allReleased ? "bg-emerald-400" : "bg-[#3b82f6]")} style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-white/50">{completedMs}/{agr.milestones.length} milestones</span>
                  </div>
                </div>

                {agr.type === "Multi Release" && agr.releaseStrategy && (
                  <div className="mb-4 rounded-xl border border-[#3b82f6]/15 bg-[#3b82f6]/5 px-5 py-3 flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <p className="text-xs text-[#3b82f6]/80">
                      <span className="font-semibold">Release strategy: </span>
                      {agr.releaseStrategy === "per-milestone" && "Release funds per milestone as each is approved."}
                      {agr.releaseStrategy === "all-at-once" && "Release all funds at once when all milestones are approved."}
                      {agr.releaseStrategy === "upon-completion" && "Release all funds together upon full completion."}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 mb-6">
                  {agr.milestones.map((ms, idx) => (
                    <div key={`${agr.id}-ms-${idx}`} className={cn("rounded-2xl border p-5 backdrop-blur-md transition-all",
                      ms.status === "released" ? "border-emerald-500/20 bg-emerald-500/5" : ms.status === "approved" ? "border-[#3b82f6]/20 bg-[#3b82f6]/5" : "border-white/[0.06] bg-[#0a0a0c]/70"
                    )}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            ms.status === "released" ? "bg-emerald-500/20 text-emerald-400" : ms.status === "approved" ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-white/10 text-white/40"
                          )}>{idx + 1}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">{ms.description}</p>
                            <p className={cn("text-xs font-medium mt-0.5",
                              ms.status === "released" ? "text-emerald-400" : ms.status === "approved" ? "text-[#3b82f6]" : "text-white/30"
                            )}>
                              {ms.status === "released" ? t("status.released") : ms.status === "approved" ? t("status.approvedReady") : t("status.pendingApproval")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-bold text-white">{"$"}{ms.amount} <span className="text-xs font-normal text-white/35">USDC</span></p>
                          {ms.status === "pending" && !allReleased && (
                            <Button size="sm" onClick={() => approveMilestone(agr.id, idx)}
                              className="rounded-full bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20">
                              Approve
                            </Button>
                          )}
                          {ms.status === "approved" && agr.releaseStrategy === "per-milestone" && (
                            <Button size="sm" onClick={() => releaseMilestone(agr.id, idx)}
                              className="rounded-full bg-[#3b82f6] px-4 text-xs font-semibold text-white hover:bg-[#2563eb] shadow-[0_2px_8px_rgba(59,130,246,0.2)]">
                              Release Funds
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!allReleased && (
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/40">Release Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      {agr.type === "Single Release" && agr.milestones[0]?.status === "pending" && (
                        <Button onClick={() => approveMilestone(agr.id, 0)}
                          className="rounded-full bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20">
                          Approve Agreement
                        </Button>
                      )}
                      {agr.type === "Single Release" && agr.milestones[0]?.status === "approved" && (
                        <Button onClick={() => releaseMilestone(agr.id, 0)}
                          className="rounded-full bg-[#3b82f6] px-6 text-sm font-semibold text-white hover:bg-[#2563eb] shadow-[0_4px_16px_rgba(59,130,246,0.25)]">
                          Release All Funds
                        </Button>
                      )}
                      {agr.type === "Multi Release" && hasApproved && (
                        <Button onClick={() => releaseAllApproved(agr.id)}
                          className="rounded-full bg-[#3b82f6] px-6 text-sm font-semibold text-white hover:bg-[#2563eb] shadow-[0_4px_16px_rgba(59,130,246,0.25)]">
                          Release All Approved
                        </Button>
                      )}
                      {agr.type === "Multi Release" && !allApproved && (
                        <Button onClick={() => approveAndReleaseAll(agr.id)}
                          className="rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700 shadow-[0_4px_16px_rgba(16,185,129,0.2)]">
                          Approve & Release All
                        </Button>
                      )}
                    </div>
                    <p className="mt-3 text-xs text-white/25">Receiver wallet: <span className="font-mono">{agr.receiver.substring(0, 8)}...{agr.receiver.substring(agr.receiver.length - 6)}</span></p>
                  </div>
                )}

                {allReleased && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" className="mx-auto mb-3"><polyline points="20 6 9 17 4 12"/></svg>
                    <p className="text-lg font-bold text-emerald-400">All Funds Released</p>
                    <p className="mt-1 text-sm text-white/40">This agreement has been fully completed and all funds sent to the receiver.</p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ══════ TEMPLATES ══════ */}
          {activeSection === "templates" && (
            <div className="mx-auto max-w-4xl">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-white">{t("dashPage.templates")}</h1>
                  <p className="mt-1 text-sm text-white/35">{t("dashPage.templatesSub")}</p>
                </div>
                <Button onClick={() => { resetWizard(); setShowSaveTemplate(true); setEditingTemplate(null); setTemplateName("") }}
                  className="rounded-full bg-[#3b82f6] px-6 text-sm font-semibold text-white hover:bg-[#2563eb] shadow-[0_4px_16px_rgba(59,130,246,0.25)]">
                  + {t("dashPage.newTemplate")}
                </Button>
              </div>

              {/* Save / Edit template modal */}
              {showSaveTemplate && (
                <div className="mb-6 mt-4 rounded-2xl border border-[#3b82f6]/20 bg-[#3b82f6]/[0.04] p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{editingTemplate ? t("dashPage.editTemplate") : t("dashPage.saveAsTemplate")}</h3>
                  <div className="flex flex-col gap-4">
                    <FormInput label={t("dashPage.templateName")} value={templateName} onChange={setTemplateName} placeholder={t("dashPage.templateNamePlaceholder")} required />
                    <FormInput label={t("wizard.titleLabel")} value={title} onChange={setTitle} placeholder={t("wizard.titlePlaceholder")} required />
                    <FormTextarea label={t("wizard.descLabel")} value={description} onChange={setDescription} placeholder={t("wizard.agreementDesc")} rows={3} />
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("wizard.escrowType")}</p>
                      <div className="flex items-center gap-2">
                        {(["single", "multi"] as const).map(et => (
                          <button key={et} onClick={() => setEscrowType(et)}
                            className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                              escrowType === et ? "bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/20" : "text-white/40 border border-transparent hover:bg-white/[0.04]"
                            )}>
                            {et === "single" ? t("wizard.oneTimePayment") : t("wizard.milestoneBased")}
                          </button>
                        ))}
                      </div>
                    </div>
                    {escrowType === "multi" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("wizard.paymentStages")}</p>
                          <button onClick={addMilestone} className="text-xs font-semibold text-[#3b82f6] hover:underline">{t("wizard.addStage")}</button>
                        </div>
                        {milestones.map((m, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder={`${t("wizard.stageDesc")}`}
                              className="flex-1 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/40" />
                            <input value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder={t("wizard.amount")} type="number"
                              className="w-28 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/40" />
                            {milestones.length > 1 && (
                              <button onClick={() => removeMilestone(i)} className="text-white/20 hover:text-red-400 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={saveAsTemplate} disabled={!templateName.trim() && !title.trim()}
                        className="rounded-full bg-[#3b82f6] px-6 text-sm font-semibold text-white hover:bg-[#2563eb] disabled:opacity-30">
                        {t("dashPage.saveTemplate")}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowSaveTemplate(false); setEditingTemplate(null) }}
                        className="rounded-full text-sm text-white/40 hover:text-white">
                        {t("dashPage.cancel")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Template cards */}
              {templates.length === 0 && !showSaveTemplate ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 py-16 px-6 text-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/15 mb-4"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                  <p className="text-sm font-medium text-white/40">{t("dashPage.noTemplates")}</p>
                  <p className="mt-1 text-xs text-white/20">{t("dashPage.noTemplatesDesc")}</p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="group rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md transition-all hover:border-white/15">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-base font-semibold text-white">{tpl.name}</p>
                          <p className="mt-0.5 text-xs text-white/30">{tpl.title}</p>
                        </div>
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                          tpl.escrowType === "single" ? "border-[#3b82f6]/20 bg-[#3b82f6]/10 text-[#3b82f6]" : "border-[#f0b400]/20 bg-[#f0b400]/10 text-[#f0b400]"
                        )}>
                          {tpl.escrowType === "single" ? t("wizard.oneTimePayment") : t("wizard.milestoneBased")}
                        </span>
                      </div>
                      <p className="text-xs text-white/25 line-clamp-2 mb-4">{tpl.description}</p>
                      {tpl.milestones.length > 0 && tpl.escrowType === "multi" && (
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {tpl.milestones.slice(0, 3).map((m, i) => (
                            <span key={i} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/35">{m.description || `Stage ${i + 1}`}</span>
                          ))}
                          {tpl.milestones.length > 3 && <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/35">+{tpl.milestones.length - 3}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button onClick={() => useTemplate(tpl)} className="flex-1 rounded-full bg-[#3b82f6]/10 text-xs font-semibold text-[#3b82f6] hover:bg-[#3b82f6]/20 border border-[#3b82f6]/15 h-8">
                          {t("dashPage.useTemplate")}
                        </Button>
                        <button onClick={() => startEditTemplate(tpl)} className="rounded-full p-2 text-white/20 hover:text-white/60 hover:bg-white/[0.04] transition-all" title={t("dashPage.editTemplate")}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => deleteTemplate(tpl.id)} className="rounded-full p-2 text-white/20 hover:text-red-400 hover:bg-red-400/[0.06] transition-all" title={t("dashPage.deleteTemplate")}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════ WALLETS ══════ */}
          {activeSection === "wallets" && (
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-6 text-2xl font-semibold text-white">Enterprise Wallets</h1>
              <div className="flex flex-col gap-4">
                {connectedWallets.map((w) => (
                  <div key={w.value} className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md hover:border-white/15 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3b82f6]/10 text-[#3b82f6]">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white">{t(w.labelKey)}</p>
                          <p className="text-xs text-white/35 font-mono">{w.short}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">{w.balance} <span className="text-xs font-normal text-white/35">USDC</span></p>
                        <p className="text-xs text-emerald-400">Active</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-white/5 text-xs text-white/60 hover:bg-white/10 hover:text-white">Copy Address</Button>
                      <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-white/5 text-xs text-white/60 hover:bg-white/10 hover:text-white">View on Explorer</Button>
                    </div>
                  </div>
                ))}
                <button className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-white/30 hover:border-[#3b82f6]/30 hover:text-[#3b82f6] transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span className="text-sm font-medium">Connect New Wallet</span>
                </button>
              </div>
            </div>
          )}

          {/* ══════ CREATE AGREEMENT ══════ */}
          {activeSection === "create" && (
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">New Agreement</h1>
                <Button onClick={() => { setActiveSection("agreements"); resetWizard() }} className="rounded-full bg-white/10 px-6 text-sm font-semibold text-white/70 hover:bg-white/15 hover:text-white">View Agreements</Button>
              </div>

              {!submitted && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    {wizardStepKeys.map((key, i) => (
                      <button key={key} onClick={() => i <= step && setStep(i)}
                        className={cn("flex items-center gap-1.5 text-xs font-semibold transition-all sm:text-sm",
                          i === step ? "text-[#f0b400]" : i < step ? "text-[#f0b400]/60 cursor-pointer" : "text-muted-foreground/40")}>
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all sm:h-7 sm:w-7 sm:text-xs",
                          i === step ? "bg-[#f0b400] text-background" : i < step ? "bg-[#f0b400]/15 text-[#f0b400]" : "bg-secondary/40 text-muted-foreground/40")}>
                          {i < step ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                        </span>
                        <span className="hidden md:inline">{t(key)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/30">
                    <div className="h-full bg-[#f0b400] transition-all duration-500 ease-out" style={{ width: `${(step / (wizardStepKeys.length - 1)) * 100}%` }} />
                  </div>
                </div>
              )}

              {submitted ? (
                <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-10 text-center backdrop-blur-md">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{t("wizard.agreementCreated")}</h2>
                    <p className="mt-2 text-sm text-white/40">{t("wizard.agreementCreatedDesc")}</p>
                  </div>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/40">{t("wizard.scanQR")}</p>
                    <Image src={qrUrl} alt="QR Code" width={160} height={160} className="rounded-lg" unoptimized />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={copyJson} className="rounded-full border-white/10 bg-white/5 text-sm text-white/60 hover:bg-white/10 hover:text-white">{copiedJson ? t("wizard.copied") : t("wizard.copyDetails")}</Button>
                    <Button variant="outline" onClick={() => { setTemplateName(title); setShowSaveTemplate(true); setEditingTemplate(null); setActiveSection("templates") }}
                      className="rounded-full border-[#3b82f6]/20 bg-[#3b82f6]/5 text-sm text-[#3b82f6] hover:bg-[#3b82f6]/10">
                      {t("dashPage.saveAsTemplate")}
                    </Button>
                    <Button onClick={() => { resetWizard(); setActiveSection("agreements") }} className="rounded-full bg-[#f0b400] text-background font-semibold hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]">{t("wizard.viewAgreements")}</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md sm:p-8">

                  {step === 0 && (
                    <div className="flex flex-col gap-6">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">{t("wizard.howPayment")}</h3><p className="mt-1 text-sm text-white/35">{t("wizard.chooseFunds")}</p></div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {([
                          { id: "single" as const, label: t("wizard.oneTimePayment"), desc: t("wizard.oneTimeDesc"), icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 8l-8 8M8 8h8v8"/></svg> },
                          { id: "multi" as const, label: t("wizard.milestoneBased"), desc: t("wizard.milestoneDesc"), icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                        ]).map((opt) => (
                          <button key={opt.id} onClick={() => { setEscrowType(opt.id); if (opt.id === "single") setMilestones([{ description: "Full delivery", amount: "" }]) }}
                            className={cn("flex flex-col gap-3 rounded-xl border p-6 text-left transition-all",
                              escrowType === opt.id ? "border-[#f0b400]/40 bg-[#f0b400]/5" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15")}>
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", escrowType === opt.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-white/5 text-white/40")}>{opt.icon}</div>
                            <div><p className="text-sm font-semibold text-white">{opt.label}</p><p className="mt-0.5 text-xs text-white/35">{opt.desc}</p></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="flex flex-col gap-6">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">{t("wizard.whatAgreement")}</h3><p className="mt-1 text-sm text-white/35">{t("wizard.selectCategory")}</p></div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {useCases.map((uc) => (
                          <button key={uc.id} onClick={() => { setUseCase(uc.id); setGuidePrefilled(false) }}
                            className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                              useCase === uc.id ? "border-[#f0b400]/40 bg-[#f0b400]/5" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15")}>
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", useCase === uc.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-white/5 text-white/40")}><UseCaseIcon icon={uc.icon} /></div>
                            <span className="text-sm font-medium text-white">{t(uc.labelKey)}</span>
                          </button>
                        ))}
                      </div>
                      {useCase === "other" && <FormInput label={t("wizard.describeUseCase")} value={customUseCase} onChange={(v) => { setCustomUseCase(v); setGuidePrefilled(false) }} placeholder={t("wizard.useCasePlaceholder")} required />}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-5">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">{t("wizard.agreementInfo")}</h3><p className="mt-1 text-sm text-white/35">{useCase && useCase !== "other" ? t("wizard.preFilled") : t("wizard.describeAgreement")}</p></div>
                      {useCase && useCase !== "other" && (
                        <div className="flex items-start gap-3 rounded-xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-4">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <p className="text-xs text-[#f0b400]/80">{t("wizard.basedOn")} <span className="font-semibold">{t(useCases.find((u) => u.id === useCase)?.labelKey || "")}</span></p>
                        </div>
                      )}
                      <FormInput label={t("wizard.titleLabel")} value={title} onChange={setTitle} placeholder={t("wizard.titlePlaceholder")} required />
                      <FormTextarea label={t("wizard.descLabel")} value={description} onChange={setDescription} placeholder={t("wizard.agreementDesc")} rows={4} />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col gap-6">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">{t("wizard.paymentDetails")}</h3><p className="mt-1 text-sm text-white/35">{t("wizard.selectWalletInfo")}</p></div>
                      <FormSelect label={t("wizard.yourWallet")} value={selectedWallet} onChange={setSelectedWallet} options={connectedWallets.map(w => ({ value: w.value, label: `${t(w.labelKey)} (${w.short})` }))} info={t("wizard.connectedWallet")} required />
                      <FormInput label={t("wizard.releaseSignerWallet")} value={signerWallet} onChange={setSignerWallet} placeholder="G...SIGNER" info={t("wizard.whoReleases")} required />
                      {escrowType === "single" ? (
                        <FormInput label={t("wizard.amount")} value={milestones[0]?.amount || ""} onChange={(v) => updateMilestone(0, "amount", v)} placeholder="50000" type="number" info="USDC" required />
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("wizard.paymentStages")}</p>
                            <button onClick={addMilestone} className="text-xs font-semibold text-[#f0b400] hover:underline">{t("wizard.addStage")}</button>
                          </div>
                          {milestones.map((m, i) => (
                            <div key={i} draggable onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                              className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:gap-3 cursor-grab">
                              <div className="flex items-center gap-3 sm:gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-white/20"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10 text-xs font-bold text-[#f0b400]">{i + 1}</span>
                              </div>
                              <input value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder={t("wizard.stageDesc")} className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none" />
                              <input value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder={t("wizard.amount")} type="number" className="w-28 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/15 focus:border-[#f0b400]/40 focus:outline-none" />
                              {milestones.length > 1 && <button onClick={() => removeMilestone(i)} className="text-white/20 hover:text-red-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>}
                            </div>
                          ))}
                          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3"><span className="text-xs text-white/30">{t("wizard.total")}</span><span className="text-sm font-bold text-white">{totalAmount.toFixed(2)} USDC</span></div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="flex flex-col gap-5">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">{t("wizard.reviewAndSend")}</h3><p className="mt-1 text-sm text-white/35">{t("wizard.confirmDetails")}</p></div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{t("wizard.agreement")}</p>
                          <p className="text-sm font-semibold text-white">{title || t("wizard.untitled")}</p>
                          <p className="mt-1 text-xs text-white/35 line-clamp-2">{description || t("wizard.noDescription")}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{t("wizard.protectedFunds")}</p>
                          <p className="text-3xl font-bold text-[#f0b400]">{totalAmount.toFixed(2)} <span className="text-sm font-normal text-white/35">USDC</span></p>
                          <p className="mt-2 text-xs text-white/30">{t("wizard.platformFeeLabel")} {platformFee} USDC (1%)</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#f0b400]/15 bg-[#f0b400]/5 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          <p className="text-sm font-semibold text-[#f0b400]">{t("wizard.emailNotifications")}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormInput label={t("wizard.releaseSignerEmail")} value={signerEmail} onChange={setSignerEmail} placeholder="signer@email.com" required />
                          <FormInput label={t("wizard.yourEmailOptional")} value={notifyEmail} onChange={setNotifyEmail} placeholder="you@email.com" info={t("wizard.receiveCopy")} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-between border-t border-white/[0.04] pt-6">
                    <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-full text-sm text-white/40 hover:text-white disabled:opacity-20">{t("wizard.back")}</Button>
                    {step < wizardStepKeys.length - 1 ? (
                      <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] disabled:opacity-20 shadow-[0_4px_16px_rgba(240,180,0,0.25)]">{t("wizard.continue")}</Button>
                    ) : (
                      <Button onClick={() => setSubmitted(true)} disabled={!signerEmail.trim()} className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] disabled:opacity-20 shadow-[0_4px_16px_rgba(240,180,0,0.25)]">{t("wizard.createNotify")}</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
