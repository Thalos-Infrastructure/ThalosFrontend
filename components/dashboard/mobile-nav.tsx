"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import {
  LayoutDashboard,
  FileText,
  Trophy,
  Wallet,
  Settings,
  Plus,
} from "lucide-react"

export type MobileNavSection = "home" | "agreements" | "create" | "bounty" | "wallet"

interface MobileNavProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onCreateClick: () => void
  className?: string
}

const navItems: { id: MobileNavSection; labelKey: string; icon: React.ReactNode }[] = [
  {
    id: "home",
    labelKey: "mobileNav.home",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "agreements",
    labelKey: "mobileNav.agreements",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "create",
    labelKey: "mobileNav.create",
    icon: <Plus className="h-6 w-6" />,
  },
  {
    id: "bounty",
    labelKey: "mobileNav.bounty",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    id: "wallet",
    labelKey: "mobileNav.wallet",
    icon: <Wallet className="h-5 w-5" />,
  },
]

export function MobileNav({
  activeSection,
  onSectionChange,
  onCreateClick,
  className,
}: MobileNavProps) {
  const { t } = useLanguage()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/6 bg-[#0c1220]/95 backdrop-blur-xl px-2 pb-safe lg:hidden",
        className
      )}
    >
      {navItems.map((item) => {
        const isActive = activeSection === item.id
        const isCreate = item.id === "create"

        if (isCreate) {
          return (
            <button
              key={item.id}
              onClick={onCreateClick}
              className="flex flex-col items-center justify-center p-2 -mt-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0b400] shadow-[0_4px_16px_rgba(240,180,0,0.3)]">
                {item.icon}
              </div>
            </button>
          )
        }

        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id === "wallet" ? "wallets" : item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 px-4 transition-colors",
              isActive ? "text-[#f0b400]" : "text-white/40"
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">
              {t(item.labelKey) || item.labelKey.split('.')[1]}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
