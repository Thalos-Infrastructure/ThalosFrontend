"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  FileText,
  Wallet,
  CreditCard,
  Settings,
  HelpCircle,
  Trophy,
  TrendingUp,
  ChevronRight,
  X,
  Users,
  MessageSquare,
} from "lucide-react"

export type SidebarSection = 
  | "home" 
  | "agreements" 
  | "contacts"
  | "finances" 
  | "payments" 
  | "bounty"
  | "settings"

interface NavItem {
  id: SidebarSection | string
  labelKey: string
  icon: React.ReactNode
  badge?: number | string
  children?: { id: string; labelKey: string }[]
}

const navSections: { title: string; titleKey: string; items: NavItem[] }[] = [
  {
    title: "Main",
    titleKey: "sidebar.main",
    items: [
      {
        id: "home",
        labelKey: "sidebar.home",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        id: "agreements",
        labelKey: "sidebar.agreements",
        icon: <FileText className="h-5 w-5" />,
        badge: 3,
      },
      {
        id: "contacts",
        labelKey: "sidebar.contacts",
        icon: <Users className="h-5 w-5" />,
      },
      {
        id: "bounty",
        labelKey: "sidebar.bounty",
        icon: <Trophy className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Finances",
    titleKey: "sidebar.finances",
    items: [
      {
        id: "wallets",
        labelKey: "sidebar.wallets",
        icon: <Wallet className="h-5 w-5" />,
      },
      {
        id: "yield",
        labelKey: "sidebar.yield",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        id: "ramps",
        labelKey: "sidebar.depositWithdraw",
        icon: <CreditCard className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "More",
    titleKey: "sidebar.more",
    items: [
      {
        id: "settings",
        labelKey: "sidebar.settings",
        icon: <Settings className="h-5 w-5" />,
      },
      {
        id: "support",
        labelKey: "sidebar.support",
        icon: <HelpCircle className="h-5 w-5" />,
      },
    ],
  },
]

interface DashboardSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function DashboardSidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onClose,
  className,
}: DashboardSidebarProps) {
  const { t } = useLanguage()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#0c1220] border-r border-white/6 transition-transform duration-300 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Logo header */}
        <div className="flex items-center justify-between p-5 border-b border-white/6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/thalos-logo.png" alt="Thalos" width={28} height={28} className="h-7 w-7" />
            <span className="text-lg font-bold text-white">Thalos</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 lg:hidden transition-colors"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {navSections.map((section, sectionIndex) => (
            <div key={section.titleKey} className={cn(sectionIndex > 0 && "mt-6")}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/30">
                {t(section.titleKey) || section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id)
                      onClose()
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      activeSection === item.id
                        ? "bg-[#f0b400]/10 text-[#f0b400]"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{t(item.labelKey) || item.labelKey.split('.')[1]}</span>
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        activeSection === item.id
                          ? "bg-[#f0b400]/20 text-[#f0b400]"
                          : "bg-white/10 text-white/60"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/6 p-4">
          <div className="rounded-xl bg-gradient-to-br from-[#f0b400]/10 to-[#f0b400]/5 border border-[#f0b400]/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0b400]/60 mb-1">
              {t("sidebar.needHelp") || "Need help?"}
            </p>
            <p className="text-xs text-white/50 mb-3">
              {t("sidebar.helpDescription") || "Check our documentation or contact support"}
            </p>
            <button className="w-full rounded-lg bg-[#f0b400]/20 py-2 text-xs font-semibold text-[#f0b400] hover:bg-[#f0b400]/30 transition-colors">
              {t("sidebar.viewDocs") || "View Documentation"}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
