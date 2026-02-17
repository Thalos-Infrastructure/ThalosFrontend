"use client"

import React, { useState, useEffect, useCallback, useId, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createAgreement, sendTransaction, AgreementPayload } from "@/services/trustlessworkService"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"
import { LanguageToggle, ThemeToggle, useLanguage } from "@/lib/i18n"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts"

/* ── Use-Case Presets ── */
const useCases = [
  { id: "freelancer", label: "Freelancer Service", icon: "user", suggestedTitle: "Freelancer Service Agreement", suggestedDesc: "Describe the scope of work, deliverables, and timeline for this freelancer engagement." },
  { id: "rental", label: "Rental Agreement", icon: "home", suggestedTitle: "Rental Agreement", suggestedDesc: "Describe the property, rental period, deposit conditions, and any special terms." },
  { id: "car-sale", label: "Peer-to-Peer Car Sale", icon: "car", suggestedTitle: "Vehicle Sale Agreement", suggestedDesc: "Describe the vehicle details, agreed price, inspection conditions, and transfer terms." },
  { id: "coaching", label: "Online Coaching / Course", icon: "book", suggestedTitle: "Coaching / Course Agreement", suggestedDesc: "Describe the course content, schedule, completion criteria, and refund policy." },
  { id: "home-repair", label: "Home Repair Service", icon: "tool", suggestedTitle: "Home Repair Service Agreement", suggestedDesc: "Describe the repair work, materials, timeline, and warranty terms." },
  { id: "other", label: "Other", icon: "plus", suggestedTitle: "", suggestedDesc: "" },
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
const connectedWallets = [
  { value: "GBXGQJWVLWOYHFLVTKWV5FGHA3PERSONAL01", label: "Main Wallet", short: "G...AL01", balance: "12,450.00" },
  { value: "GBXGQJWVLWOYHFLVTKWV5FGHA3PERSONAL02", label: "Secondary Wallet", short: "G...AL02", balance: "3,200.50" },
]

const wizardSteps = ["Escrow Type", "Use Case", "Agreement Info", "Payment & Wallets", "Review & Send"]

interface Milestone { description: string; amount: string; status: "pending" | "approved" | "released" }
interface Agreement { id: string; title: string; status: string; type: "Single Release" | "Multi Release"; counterparty: string; amount: string; date: string; releaseStrategy?: "per-milestone" | "all-at-once" | "upon-completion"; milestones: Milestone[]; receiver: string }

const initialAgreements: Agreement[] = [
  { id: "AGR-001", title: "Website Redesign", status: "funded", type: "Single Release", counterparty: "G...FRE3", amount: "2,500", date: "2026-01-15", milestones: [{ description: "Full delivery", amount: "2,500", status: "pending" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3PERSONAL02" },
  { id: "AGR-002", title: "Moving Service", status: "in_progress", type: "Multi Release", counterparty: "G...MOV7", amount: "1,800", date: "2026-01-20", releaseStrategy: "per-milestone", milestones: [{ description: "Packing & Loading", amount: "600", status: "released" }, { description: "Transport", amount: "600", status: "approved" }, { description: "Unloading & Setup", amount: "600", status: "pending" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3MOV7" },
  { id: "AGR-003", title: "Online Course Bundle", status: "released", type: "Multi Release", counterparty: "G...EDU4", amount: "1,200", date: "2025-12-10", releaseStrategy: "upon-completion", milestones: [{ description: "Module 1 - Basics", amount: "400", status: "released" }, { description: "Module 2 - Advanced", amount: "400", status: "released" }, { description: "Final Assessment", amount: "400", status: "released" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3EDU4" },
  { id: "AGR-004", title: "Coaching Sessions", status: "in_progress", type: "Multi Release", counterparty: "G...CCH1", amount: "900", date: "2026-02-01", releaseStrategy: "all-at-once", milestones: [{ description: "Session 1", amount: "300", status: "approved" }, { description: "Session 2", amount: "300", status: "approved" }, { description: "Session 3", amount: "300", status: "pending" }], receiver: "GBXGQJWVLWOYHFLVTKWV5FGHA3CCH1" },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  funded: { label: "Funded", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label: "In Progress", color: "bg-[#f0b400]/10 text-[#f0b400] border-[#f0b400]/20" },
  awaiting: { label: "Awaiting Approval", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  released: { label: "Released", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
}

/* ── Chart Data ── */
const monthlyData = [
  { month: "Aug", agreements: 1, volume: 800 },
  { month: "Sep", agreements: 2, volume: 3200 },
  { month: "Oct", agreements: 1, volume: 1200 },
  { month: "Nov", agreements: 3, volume: 4500 },
  { month: "Dec", agreements: 2, volume: 2800 },
  { month: "Jan", agreements: 3, volume: 4500 },
  { month: "Feb", agreements: 1, volume: 2500 },
]

/* ── Icon helper ── */
function UseCaseIcon({ icon, className }: { icon: string; className?: string }) {
  const c = className || ""
  if (icon === "user") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={c}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  if (icon === "home") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={c}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
  if (icon === "car") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={c}><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  if (icon === "book") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={c}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
  if (icon === "tool") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={c}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={c}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
}

/* ── Sidebar nav items ── */
const sidebarItems = [
  { id: "create", label: "New Agreement", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { id: "agreements", label: "Agreements", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: "wallets", label: "My Wallets", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
  { id: "analytics", label: "Analytics", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
]

/* ════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════ */
export default function PersonalDashboardPage() {
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
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const generateAgreementPayload = (): AgreementPayload => ({    
    title,
    description,
    amount: totalAmount.toString(),
    platformFee: platformFee.toString(),
    signer: selectedWallet,
    serviceType: escrowType === "single" ? "single-release" : "multi-release",
    roles: {
      approver: selectedWallet,
      serviceProvider: selectedWallet,
      releaseSigner: signerWallet,
      receiver: selectedWallet,
    },
    milestones: escrowType === "single"
      ? [{ description: milestones[0]?.description || "Full delivery", amount: totalAmount.toString(), status: "pending" }]
      : milestones.map((m) => ({ description: m.description || "Milestone", amount: m.amount || "0", status: "pending" })),
    notifications: { notifyEmail, signerEmail },
  })

  const [copiedJson, setCopiedJson] = useState(false)
  const copyJson = () => { navigator.clipboard.writeText(JSON.stringify(generateAgreementPayload(), null, 2)); setCopiedJson(true); setTimeout(() => setCopiedJson(false), 2000) }

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

  const agreementUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard/personal` : "https://thalos.app/dashboard/personal"
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(agreementUrl)}&bgcolor=0a0a0a&color=f0b400&qzone=3&format=png`

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
            {/* Mobile sidebar toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors" aria-label="Toggle sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <Link href="/" className="flex items-center">
              <Image src="/thalos-icon.png" alt="Thalos" width={48} height={48} className="h-10 w-10 object-contain" priority />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
                <div className="h-6 w-6 rounded-full bg-[#f0b400]/10 flex items-center justify-center text-[#f0b400]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <span className="hidden sm:inline">Personal</span>
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
                    My Wallets
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
          {/* User card */}
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#f0b400]/10 flex items-center justify-center text-[#f0b400]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Personal Account</p>
                <p className="text-xs text-white/40">G...AL01</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 p-3">
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveSection(item.id); setSidebarOpen(false); if (item.id === "create") resetWizard() }}
                className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  activeSection === item.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "text-white/50 hover:bg-white/5 hover:text-white/80"
                )}>
                {item.icon}{t(`dashPage.${item.id === "create" ? "newAgreement" : item.id}`)}
              </button>
            ))}
          </nav>

          {/* Balance card */}
          <div className="mt-auto border-t border-white/[0.06] p-4">
            <div className="rounded-xl bg-[#f0b400]/5 border border-[#f0b400]/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0b400]/60">{t("dashPage.totalBalance")}</p>
              <p className="mt-1 text-xl font-bold text-[#f0b400]">15,650.50 <span className="text-xs font-normal text-white/40">USDC</span></p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* ══════ ANALYTICS ══════ */}
          {activeSection === "analytics" && (
            <div className="mx-auto max-w-5xl">
              <h1 className="mb-6 text-2xl font-semibold text-white">{t("dashPage.analytics")}</h1>

              {/* Stats row */}
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { l: t("dashPage.active"), v: "3" },
                  { l: t("dashPage.totalVolume"), v: "$4,500" },
                  { l: t("dashPage.yieldEarned"), v: "$32.50" },
                  { l: t("dashPage.completed"), v: "1" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-white/[0.06] bg-[#0a0a0c]/70 p-4 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{s.l}</p>
                    <p className="mt-1 text-lg font-bold text-white">{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
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
                        <Bar dataKey="agreements" fill="#f0b400" radius={[6, 6, 0, 0]} />
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
                          <linearGradient id="volGradP" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f0b400" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f0b400" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(15,15,18,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: 13 }} formatter={(value: number) => [`$${value.toLocaleString()}`, "Volume"]} />
                        <Area type="monotone" dataKey="volume" stroke="#f0b400" fill="url(#volGradP)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent agreements */}
              <div className="rounded-xl border border-white/[0.06] bg-[#0a0a0c]/70 p-5 backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">{t("dashPage.recentAgreements")}</h3>
                  <button onClick={() => setActiveSection("agreements")} className="text-xs font-semibold text-[#f0b400] hover:underline">{t("dashPage.viewAll")}</button>
                </div>
                <div className="flex flex-col gap-3">
                  {agreements.slice(0, 3).map((agr) => {
                    const allReleased = agr.milestones.every(m => m.status === "released")
                    const effectiveStatus = allReleased ? "released" : agr.status
                    const st = statusConfig[effectiveStatus] || statusConfig.funded
                    return (
                      <button key={agr.id} onClick={() => { setViewingAgreement(agr.id); setActiveSection("agreements") }} className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3 transition-all hover:border-white/10 text-left w-full">
                        <div>
                          <p className="text-sm font-medium text-white">{agr.title}</p>
                          <p className="text-xs text-white/30">{agr.type} -- {agr.counterparty}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", st.color)}>{st.label}</span>
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
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">My Agreements</h1>
                <Button onClick={() => { setActiveSection("create"); resetWizard() }}
                  className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]">
                  + New Agreement
                </Button>
              </div>
              <div className="flex flex-col gap-4">
                {agreements.map((agr) => {
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
                          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", st.color)}>{st.label}</span>
                          <p className="text-lg font-bold text-white">{"$"}{agr.amount} <span className="text-xs font-normal text-white/35">USDC</span></p>
                        </div>
                      </div>
                      {agr.milestones.length > 1 && (
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className={cn("h-full rounded-full transition-all duration-500", allReleased ? "bg-emerald-400" : "bg-[#f0b400]")} style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-xs text-white/30">{completedMs}/{agr.milestones.length}</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
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

                {/* Header */}
                <div className="mb-6 rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-white">{agr.title}</h1>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", st.color)}>{st.label}</span>
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
                      <p className="text-3xl font-bold text-[#f0b400]">{"$"}{agr.amount}</p>
                      <p className="text-xs text-white/35">USDC</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={cn("h-full rounded-full transition-all duration-700", allReleased ? "bg-emerald-400" : "bg-[#f0b400]")} style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-white/50">{completedMs}/{agr.milestones.length} milestones</span>
                  </div>
                </div>

                {/* Release strategy for multi-release */}
                {agr.type === "Multi Release" && agr.releaseStrategy && (
                  <div className="mb-4 rounded-xl border border-[#f0b400]/15 bg-[#f0b400]/5 px-5 py-3 flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <p className="text-xs text-[#f0b400]/80">
                      <span className="font-semibold">Release strategy: </span>
                      {agr.releaseStrategy === "per-milestone" && "Release funds per milestone as each is approved."}
                      {agr.releaseStrategy === "all-at-once" && "Release all funds at once when all milestones are approved."}
                      {agr.releaseStrategy === "upon-completion" && "Release all funds together upon full completion."}
                    </p>
                  </div>
                )}

                {/* Milestones */}
                <div className="flex flex-col gap-3 mb-6">
                  {agr.milestones.map((ms, idx) => (
                    <div key={`${agr.id}-ms-${idx}`} className={cn("rounded-2xl border p-5 backdrop-blur-md transition-all",
                      ms.status === "released" ? "border-emerald-500/20 bg-emerald-500/5" : ms.status === "approved" ? "border-[#f0b400]/20 bg-[#f0b400]/5" : "border-white/[0.06] bg-[#0a0a0c]/70"
                    )}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            ms.status === "released" ? "bg-emerald-500/20 text-emerald-400" : ms.status === "approved" ? "bg-[#f0b400]/20 text-[#f0b400]" : "bg-white/10 text-white/40"
                          )}>{idx + 1}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">{ms.description}</p>
                            <p className={cn("text-xs font-medium mt-0.5",
                              ms.status === "released" ? "text-emerald-400" : ms.status === "approved" ? "text-[#f0b400]" : "text-white/30"
                            )}>
                              {ms.status === "released" ? "Released" : ms.status === "approved" ? "Approved - Ready to release" : "Pending approval"}
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
                              className="rounded-full bg-[#f0b400] px-4 text-xs font-semibold text-background hover:bg-[#d4a000] shadow-[0_2px_8px_rgba(240,180,0,0.2)]">
                              Release Funds
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bulk actions */}
                {!allReleased && (
                  <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white/40">Release Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      {agr.type === "Single Release" && agr.milestones[0]?.status === "pending" && (
                        <Button onClick={() => { approveMilestone(agr.id, 0) }}
                          className="rounded-full bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20">
                          Approve Agreement
                        </Button>
                      )}
                      {agr.type === "Single Release" && agr.milestones[0]?.status === "approved" && (
                        <Button onClick={() => { releaseMilestone(agr.id, 0) }}
                          className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]">
                          Release All Funds
                        </Button>
                      )}
                      {agr.type === "Multi Release" && hasApproved && (
                        <Button onClick={() => releaseAllApproved(agr.id)}
                          className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]">
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

          {/* ══════ WALLETS ══════ */}
          {activeSection === "wallets" && (
            <div className="mx-auto max-w-4xl">
              <h1 className="mb-6 text-2xl font-semibold text-white">My Wallets</h1>
              <div className="flex flex-col gap-4">
                {connectedWallets.map((w) => (
                  <div key={w.value} className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md transition-all hover:border-white/15">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0b400]/10 text-[#f0b400]">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                        </div>
                        <div>
                          <p className="text-base font-semibold text-white">{w.label}</p>
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

                {/* Add wallet */}
                <button className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-white/30 hover:border-[#f0b400]/30 hover:text-[#f0b400] transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span className="text-sm font-medium">Connect New Wallet</span>
                </button>
              </div>

              {/* Trustline info */}
              <div className="mt-6 rounded-xl border border-[#f0b400]/10 bg-[#f0b400]/5 p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <p className="text-sm font-semibold text-[#f0b400]">USDC Trustline</p>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">All wallets require a USDC trustline on the Stellar network to participate in Thalos escrow agreements. You can add the trustline from your wallet provider.</p>
                <p className="mt-2 text-xs text-white/25 font-mono break-all">{TRUSTLINE_USDC.address}</p>
              </div>
            </div>
          )}

          {/* ══════ CREATE AGREEMENT ══════ */}
          {activeSection === "create" && (
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-white">New Agreement</h1>
                <Button onClick={() => { setActiveSection("agreements"); resetWizard() }}
                  className="rounded-full bg-white/10 px-6 text-sm font-semibold text-white/70 hover:bg-white/15 hover:text-white">
                  View Agreements
                </Button>
              </div>

              {/* Progress bar */}
              {!submitted && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    {wizardSteps.map((s, i) => (
                      <button key={s} onClick={() => i <= step && setStep(i)}
                        className={cn("flex items-center gap-1.5 text-xs font-semibold transition-all sm:text-sm",
                          i === step ? "text-[#f0b400]" : i < step ? "text-[#f0b400]/60 cursor-pointer" : "text-muted-foreground/40")}>
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all sm:h-7 sm:w-7 sm:text-xs",
                          i === step ? "bg-[#f0b400] text-background" : i < step ? "bg-[#f0b400]/15 text-[#f0b400]" : "bg-secondary/40 text-muted-foreground/40")}>
                          {i < step ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                        </span>
                        <span className="hidden md:inline">{s}</span>
                      </button>
                    ))}
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/30">
                    <div className="h-full bg-[#f0b400] transition-all duration-500 ease-out" style={{ width: `${(step / (wizardSteps.length - 1)) * 100}%` }} />
                  </div>
                </div>
              )}

              {submitted ? (
                <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-10 text-center backdrop-blur-md">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Agreement Created</h2>
                    <p className="mt-2 text-sm text-white/40">Your secure payment has been set up. A notification has been sent to the Release Signer.</p>
                  </div>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/40">Scan to access on mobile</p>
                    <Image src={qrUrl} alt="QR Code" width={160} height={160} className="rounded-lg" unoptimized />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={copyJson} className="rounded-full border-white/10 bg-white/5 text-sm text-white/60 hover:bg-white/10 hover:text-white">{copiedJson ? "Copied" : "Copy Details"}</Button>
                    <Button onClick={() => { resetWizard(); setActiveSection("agreements") }} className="rounded-full bg-[#f0b400] text-background font-semibold hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]">View Agreements</Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/70 p-6 backdrop-blur-md sm:p-8">

                  {/* Step 0: Escrow Type */}
                  {step === 0 && (
                    <div className="flex flex-col gap-6">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">How should the payment work?</h3><p className="mt-1 text-sm text-white/35">Choose how funds will be released.</p></div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {([
                          { id: "single" as const, label: "One-time Payment", desc: "Funds released all at once upon completion.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 8l-8 8M8 8h8v8"/></svg> },
                          { id: "multi" as const, label: "Milestone-based", desc: "Funds released in stages as work progresses.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                        ]).map((opt) => (
                          <button key={opt.id} onClick={() => { setEscrowType(opt.id); if (opt.id === "single") setMilestones([{ description: "Full delivery", amount: "" }]) }}
                            className={cn("flex flex-col gap-3 rounded-xl border p-6 text-left transition-all duration-300",
                              escrowType === opt.id ? "border-[#f0b400]/40 bg-[#f0b400]/5" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15")}>
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", escrowType === opt.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-white/5 text-white/40")}>{opt.icon}</div>
                            <div><p className="text-sm font-semibold text-white">{opt.label}</p><p className="mt-0.5 text-xs text-white/35">{opt.desc}</p></div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 1: Use Case */}
                  {step === 1 && (
                    <div className="flex flex-col gap-6">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">What is this agreement for?</h3><p className="mt-1 text-sm text-white/35">Select a category to get guided suggestions, or choose Other.</p></div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {useCases.map((uc) => (
                          <button key={uc.id} onClick={() => { setUseCase(uc.id); setGuidePrefilled(false) }}
                            className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                              useCase === uc.id ? "border-[#f0b400]/40 bg-[#f0b400]/5" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15")}>
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", useCase === uc.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-white/5 text-white/40")}>
                              <UseCaseIcon icon={uc.icon} />
                            </div>
                            <span className="text-sm font-medium text-white">{uc.label}</span>
                          </button>
                        ))}
                      </div>
                      {useCase === "other" && <FormInput label="Describe your use case" value={customUseCase} onChange={(v) => { setCustomUseCase(v); setGuidePrefilled(false) }} placeholder="e.g. Equipment purchase, consulting fee..." required />}
                    </div>
                  )}

                  {/* Step 2: Agreement Info */}
                  {step === 2 && (
                    <div className="flex flex-col gap-5">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">Agreement Information</h3><p className="mt-1 text-sm text-white/35">{useCase && useCase !== "other" ? "We pre-filled some suggestions. Feel free to edit." : "Describe what this agreement is about."}</p></div>
                      {useCase && useCase !== "other" && (
                        <div className="flex items-start gap-3 rounded-xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-4">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <p className="text-xs text-[#f0b400]/80">Based on <span className="font-semibold">{useCases.find((u) => u.id === useCase)?.label}</span></p>
                        </div>
                      )}
                      <FormInput label="Title" value={title} onChange={setTitle} placeholder="e.g. Website Redesign Project" required />
                      <FormTextarea label="Description" value={description} onChange={setDescription} placeholder="Brief description of the agreement scope..." rows={4} />
                    </div>
                  )}

                  {/* Step 3: Payment & Wallets */}
                  {step === 3 && (
                    <div className="flex flex-col gap-6">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">Payment Details</h3><p className="mt-1 text-sm text-white/35">Select your wallet and enter the counterparty information.</p></div>
                      <FormSelect label="Your Wallet" value={selectedWallet} onChange={setSelectedWallet} options={connectedWallets.map(w => ({ value: w.value, label: `${w.label} (${w.short})` }))} info="Your connected wallet" required />
                      <FormInput label="Release Signer Wallet" value={signerWallet} onChange={setSignerWallet} placeholder="G...SIGNER" info="Who releases the funds" required />
                      {escrowType === "single" ? (
                        <FormInput label="Amount" value={milestones[0]?.amount || ""} onChange={(v) => updateMilestone(0, "amount", v)} placeholder="1000" type="number" info="USDC" required />
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment Stages</p>
                            <button onClick={addMilestone} className="text-xs font-semibold text-[#f0b400] hover:underline">+ Add Stage</button>
                          </div>
                          {milestones.map((m, i) => (
                            <div key={i} draggable onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                              className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:gap-3 cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-3 sm:gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-white/20"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10 text-xs font-bold text-[#f0b400]">{i + 1}</span>
                              </div>
                              <input value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder="Stage description..." className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none" />
                              <input value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder="Amount" type="number" className="w-28 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/15 focus:border-[#f0b400]/40 focus:outline-none" />
                              {milestones.length > 1 && <button onClick={() => removeMilestone(i)} className="text-white/20 hover:text-red-400 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>}
                            </div>
                          ))}
                          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3"><span className="text-xs text-white/30">Total</span><span className="text-sm font-bold text-white">{totalAmount.toFixed(2)} USDC</span></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Review & Send */}
                  {step === 4 && (
                    <div className="flex flex-col gap-5">
                      <div><h3 className="text-lg font-semibold text-white sm:text-xl">Review & Send</h3><p className="mt-1 text-sm text-white/35">Confirm the details and send a notification to the Release Signer.</p></div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">Agreement</p>
                          <p className="text-sm font-semibold text-white">{title || "Untitled"}</p>
                          <p className="mt-1 text-xs text-white/35 line-clamp-2">{description || "No description"}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">Protected Funds</p>
                          <p className="text-3xl font-bold text-[#f0b400]">{totalAmount.toFixed(2)} <span className="text-sm font-normal text-white/35">USDC</span></p>
                          <p className="mt-2 text-xs text-white/30">Platform fee: {platformFee} USDC (1%)</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#f0b400]/15 bg-[#f0b400]/5 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          <p className="text-sm font-semibold text-[#f0b400]">Email Notifications</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <FormInput label="Release Signer Email" value={signerEmail} onChange={setSignerEmail} placeholder="signer@email.com" required />
                          <FormInput label="Your Email (optional)" value={notifyEmail} onChange={setNotifyEmail} placeholder="you@email.com" info="Receive a copy" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between border-t border-white/[0.04] pt-6">
                    <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-full text-sm text-white/40 hover:text-white disabled:opacity-20">Back</Button>
                    {step < wizardSteps.length - 1 ? (
                      <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] disabled:opacity-20 shadow-[0_4px_16px_rgba(240,180,0,0.25)]">Continue</Button>
                    ) : (
                     <>
                     <Button
                          onClick={async () => {
                            setCreating(true);
                            setError(null);
                            try {
                              // 1. Agreement creation
                              const payload = generateAgreementPayload();
                              const agreementRes = await createAgreement(payload);
                              if (!agreementRes.success) throw new Error(agreementRes.error || "Agreement creation failed");
                              // 2. Get XDR from the response
                              const xdr = agreementRes.data?.unsignedTransaction;
                              if (!xdr) throw new Error("No XDR returned from agreement API");
                              // 3. Sign the transaction (using Freighter)
                              const { signTransaction } = await import("@stellar/freighter-api");
                              const signedXdr = await signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" });
                              if (!signedXdr) throw new Error("Transaction signing failed");
                              // 4. Send the signed transaction to the API for submission
                              const sendRes = await sendTransaction(signedXdr.signedTxXdr);
                              if (!sendRes.success) throw new Error(sendRes.error || "Transaction send failed");
                              setSubmitted(true);
                            } catch (e: any) {
                              setError(e.message || "Unknown error");
                            } finally {
                              setCreating(false);
                            }
                          }}
                          disabled={!signerEmail.trim() || creating}
                          className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] disabled:opacity-20 shadow-[0_4px_16px_rgba(240,180,0,0.25)]"
                        >
                          {creating ? "Creating..." : "Create & Notify Signer"}
                        </Button>
                        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
                      </>
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
