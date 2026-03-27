"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Camera, User, Mail, Wallet, Building, Save } from "lucide-react"

interface ProfileData {
  displayName: string
  email: string
  walletAddress: string
  avatar?: string
  company?: string
  bio?: string
}

interface ProfileEditorProps {
  isOpen: boolean
  onClose: () => void
  profile: ProfileData
  onSave: (profile: ProfileData) => Promise<void>
  type?: "personal" | "enterprise"
}

export function ProfileEditor({ isOpen, onClose, profile, onSave, type = "personal" }: ProfileEditorProps) {
  const [formData, setFormData] = useState<ProfileData>(profile)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
        setFormData(prev => ({ ...prev, avatar: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const accentColor = type === "enterprise" ? "#3b82f6" : "#f0b400"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0c1220] rounded-2xl border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            Edit {type === "enterprise" ? "Company" : "Personal"} Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div 
                className="h-24 w-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden"
                style={{ 
                  background: avatarPreview ? 'transparent' : `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
                  color: type === "enterprise" ? "#ffffff" : "#0c1220"
                }}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  formData.displayName?.slice(0, 2).toUpperCase() || "TH"
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#0c1220] border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="mt-2 text-xs text-white/40">Click the camera to upload a photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                <User className="h-3.5 w-3.5" />
                {type === "enterprise" ? "Company Name" : "Display Name"}
              </label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder={type === "enterprise" ? "Acme Corporation" : "John Doe"}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                <Mail className="h-3.5 w-3.5" />
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                <Wallet className="h-3.5 w-3.5" />
                Wallet Address
              </label>
              <Input
                value={formData.walletAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="G..."
                className="bg-white/5 border-white/10 text-white font-mono text-sm placeholder:text-white/30"
              />
            </div>

            {type === "enterprise" && (
              <div>
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50 mb-2">
                  <Building className="h-3.5 w-3.5" />
                  Industry
                </label>
                <Input
                  value={formData.company || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Technology, Finance, etc."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-white/50 mb-2 block">
                Bio
              </label>
              <textarea
                value={formData.bio || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f0b400]/50"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
            style={{ backgroundColor: accentColor, color: type === "enterprise" ? "#ffffff" : "#0c1220" }}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
