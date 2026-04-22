"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { useAuthStore } from "@/lib/auth-store"
import { useCurrentAddress } from "@/lib/use-current-address"
import { 
  getContacts, 
  addContact, 
  updateContact, 
  deleteContact,
  type Contact 
} from "@/lib/actions/contacts"
import { WalletAddress } from "@/components/ui/wallet-address"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  MessageSquare,
  FileText,
  X,
  User,
  Wallet,
  Mail,
  Phone,
  Building,
} from "lucide-react"

interface ContactsSectionProps {
  onCreateAgreementWith?: (contact: Contact) => void
  onChatWith?: (contact: Contact) => void
  className?: string
}

export function ContactsSection({ 
  onCreateAgreementWith, 
  onChatWith,
  className 
}: ContactsSectionProps) {
  const { t } = useLanguage()
  const currentAddress = useCurrentAddress()
  const { user } = useAuthStore()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    wallet_address: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  })

  useEffect(() => {
    if (currentAddress) {
      loadContacts()
    }
  }, [currentAddress])

  const loadContacts = async () => {
    if (!currentAddress) return
    setIsLoading(true)
    try {
      const data = await getContacts(currentAddress)
      setContacts(data)
    } catch (err) {
      console.error("Failed to load contacts:", err)
      toast.error("Failed to load contacts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContact = async () => {
    if (!currentAddress || !formData.name || !formData.wallet_address) {
      toast.error("Name and wallet address are required")
      return
    }

    try {
      const newContact = await addContact(currentAddress, {
        name: formData.name,
        wallet_address: formData.wallet_address,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        notes: formData.notes || undefined,
      })
      
      if (newContact) {
        setContacts(prev => [newContact, ...prev])
        setShowAddModal(false)
        resetForm()
        toast.success("Contact added successfully")
      }
    } catch (err) {
      toast.error("Failed to add contact")
    }
  }

  const handleUpdateContact = async () => {
    if (!editingContact) return

    try {
      const updated = await updateContact(editingContact.id, {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        notes: formData.notes || undefined,
      })
      
      if (updated) {
        setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
        setEditingContact(null)
        resetForm()
        toast.success("Contact updated successfully")
      }
    } catch (err) {
      toast.error("Failed to update contact")
    }
  }

  const handleDeleteContact = async (contact: Contact) => {
    if (!confirm(`Delete ${contact.name}?`)) return

    try {
      const success = await deleteContact(contact.id)
      if (success) {
        setContacts(prev => prev.filter(c => c.id !== contact.id))
        setSelectedContact(null)
        toast.success("Contact deleted")
      }
    } catch (err) {
      toast.error("Failed to delete contact")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      wallet_address: "",
      email: "",
      phone: "",
      company: "",
      notes: "",
    })
  }

  const openEditModal = (contact: Contact) => {
    setFormData({
      name: contact.name,
      wallet_address: contact.wallet_address,
      email: contact.email || "",
      phone: contact.phone || "",
      company: contact.company || "",
      notes: contact.notes || "",
    })
    setEditingContact(contact)
  }

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase()
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.wallet_address.toLowerCase().includes(query) ||
      (contact.email?.toLowerCase().includes(query)) ||
      (contact.company?.toLowerCase().includes(query))
    )
  })

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {t("contacts.title") || "Contacts"}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {t("contacts.description") || "Manage your contacts for quick agreement creation"}
          </p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#d4a000]"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("contacts.addContact") || "Add Contact"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder={t("contacts.searchPlaceholder") || "Search contacts..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
        />
      </div>

      {/* Contacts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f0b400] border-t-transparent" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <User className="h-12 w-12 text-white/20 mb-4" />
          <p className="text-lg font-medium text-white/60">
            {searchQuery 
              ? t("contacts.noResults") || "No contacts found" 
              : t("contacts.noContacts") || "No contacts yet"}
          </p>
          <p className="text-sm text-white/40 mt-1">
            {searchQuery 
              ? t("contacts.tryDifferentSearch") || "Try a different search term"
              : t("contacts.addFirstContact") || "Add your first contact to get started"}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setShowAddModal(true)}
              variant="outline"
              className="mt-4 border-white/15 text-white hover:bg-white/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("contacts.addContact") || "Add Contact"}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={cn(
                "group rounded-2xl border border-white/6 bg-[#0c1220]/60 p-4 transition-all duration-200",
                "hover:border-white/15 hover:bg-[#0c1220]/80"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#f0b400]/20 to-[#f0b400]/5 border border-white/10 flex items-center justify-center text-sm font-bold text-[#f0b400] flex-shrink-0">
                  {getInitials(contact.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{contact.name}</p>
                  {contact.company && (
                    <p className="text-xs text-white/50 truncate">{contact.company}</p>
                  )}
                  <WalletAddress 
                    address={contact.wallet_address} 
                    showCopy 
                    className="text-xs text-white/40 mt-1"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(contact)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-white/50" />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-400/70" />
                  </button>
                </div>
              </div>

              {/* Contact details */}
              {(contact.email || contact.phone) && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => onCreateAgreementWith?.(contact)}
                  size="sm"
                  className="flex-1 h-9 rounded-lg bg-[#f0b400]/10 text-[#f0b400] hover:bg-[#f0b400]/20 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  {t("contacts.createAgreement") || "New Agreement"}
                </Button>
                <Button
                  onClick={() => onChatWith?.(contact)}
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-lg border-white/10 text-white/60 hover:bg-white/5 text-xs px-3"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingContact) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1220] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {editingContact 
                  ? t("contacts.editContact") || "Edit Contact"
                  : t("contacts.addContact") || "Add Contact"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingContact(null)
                  resetForm()
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1.5 block">
                  {t("contacts.name") || "Name"} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="h-11 pl-10 rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1.5 block">
                  {t("contacts.walletAddress") || "Wallet Address"} *
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    value={formData.wallet_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
                    placeholder="GXXX..."
                    disabled={!!editingContact}
                    className="h-11 pl-10 rounded-xl border-white/10 bg-white/5 text-white font-mono text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1.5 block">
                  {t("contacts.email") || "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="h-11 pl-10 rounded-xl border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1.5 block">
                    {t("contacts.phone") || "Phone"}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 234..."
                      className="h-11 pl-10 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1.5 block">
                    {t("contacts.company") || "Company"}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Company Inc."
                      className="h-11 pl-10 rounded-xl border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1.5 block">
                  {t("contacts.notes") || "Notes"}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/50 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingContact(null)
                  resetForm()
                }}
                variant="outline"
                className="flex-1 border-white/15 text-white hover:bg-white/5"
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button
                onClick={editingContact ? handleUpdateContact : handleAddContact}
                className="flex-1 bg-[#f0b400] text-background hover:bg-[#d4a000]"
              >
                {editingContact 
                  ? t("common.save") || "Save"
                  : t("contacts.addContact") || "Add Contact"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
