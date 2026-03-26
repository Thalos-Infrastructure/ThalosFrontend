"use client"

import { useState, useEffect } from "react"
import { Bell, MessageCircle, Copy, Check, ChevronDown, User, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import Link from "next/link"
import Image from "next/image"

interface DashboardHeaderProps {
  walletAddress: string | null
  displayName?: string | null
  avatarUrl?: string | null
  onNotificationsClick?: () => void
  onSupportClick?: () => void
  onEditProfile?: () => void
  notificationCount?: number
}

export function DashboardHeader({
  walletAddress,
  displayName,
  avatarUrl,
  onNotificationsClick,
  onSupportClick,
  onEditProfile,
  notificationCount = 0,
}: DashboardHeaderProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const userName = displayName || (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "User")
  const greeting = getGreeting()

  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return t("dashboard.goodMorning") || "Good morning"
    if (hour < 18) return t("dashboard.goodAfternoon") || "Good afternoon"
    return t("dashboard.goodEvening") || "Good evening"
  }

  const copyAddress = async () => {
    if (!walletAddress) return
    await navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileOpen && !(e.target as Element).closest('.profile-dropdown')) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [profileOpen])

  return (
    <div className="flex items-center justify-between pb-6 border-b border-white/6">
      {/* Left: User greeting and wallet */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div 
          className="profile-dropdown relative cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen) }}
        >
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#f0b400]/20 to-[#f0b400]/5 ring-2 ring-white/10 flex items-center justify-center">
                <User className="h-6 w-6 text-[#f0b400]" />
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0c1220]" />
          </div>

          {/* Profile dropdown */}
          {profileOpen && (
            <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-[#0c1220] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.6)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-3 border-b border-white/6 mb-2">
                <p className="text-sm font-semibold text-white">{userName}</p>
                {walletAddress && (
                  <button
                    onClick={(e) => { e.stopPropagation(); copyAddress() }}
                    className="flex items-center gap-2 mt-1 text-xs font-mono text-white/50 hover:text-white/70 transition-colors"
                  >
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onEditProfile?.(); setProfileOpen(false) }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t("dashboard.editProfile") || "Edit Profile"}
              </button>
              <Link
                href="/"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("dashboard.signOut") || "Sign Out"}
              </Link>
            </div>
          )}
        </div>

        {/* Greeting */}
        <div>
          <p className="text-lg font-semibold text-white">
            {greeting}, <span className="text-[#f0b400]">{userName}</span>
          </p>
          {walletAddress && (
            <button
              onClick={copyAddress}
              className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-white/60 transition-colors"
            >
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Right: Notifications and Support */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onNotificationsClick}
          className="relative h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Bell className="h-5 w-5 text-white/70" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f0b400] text-[10px] font-bold text-[#0c1220]">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>

        {/* Support Chat Button */}
        <Button
          variant="ghost"
          onClick={onSupportClick}
          className="flex items-center gap-2 h-10 rounded-full border border-white/10 bg-white/5 px-3 hover:bg-white/10 transition-colors"
        >
          <MessageCircle className="h-4 w-4 text-white/70" />
          <span className="text-xs font-medium text-white/70">Support</span>
        </Button>
      </div>
    </div>
  )
}
