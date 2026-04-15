"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getContacts, addContact, searchThalosUsers, type Contact } from "@/lib/actions/contacts"
import { Search, UserPlus, Copy, Check, X, Users, Smartphone, Share2 } from "lucide-react"
import { useStellarWallet } from "@/lib/stellar-wallet"

interface ContactSelectorProps {
  value: string
  onChange: (value: string, contactName?: string) => void
  placeholder?: string
  className?: string
  ownerWallet?: string // Optional, will use connected wallet if not provided
}

export function ContactSelector({ value, onChange, placeholder = "Enter wallet address or select contact", className, ownerWallet: propOwnerWallet }: ContactSelectorProps) {
  const { walletAddress: connectedWallet } = useStellarWallet()
  const ownerWallet = propOwnerWallet || connectedWallet
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string; wallet_address: string }>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", wallet_address: "" })
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ownerWallet) {
      loadContacts()
    }
  }, [ownerWallet])

  async function loadContacts() {
    if (!ownerWallet) return
    const { contacts: data } = await getContacts(ownerWallet)
    setContacts(data)
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    const { users } = await searchThalosUsers(query, ownerWallet || undefined)
    setSearchResults(users)
  }

  async function handleAddContact() {
    if (!newContact.name || !ownerWallet) return
    setLoading(true)
    
    const { contact, error } = await addContact(ownerWallet, {
      name: newContact.name,
      email: newContact.email || undefined,
      phone: newContact.phone || undefined,
      wallet_address: newContact.wallet_address || undefined,
    })

    setLoading(false)

    if (error) {
      console.error("Error adding contact:", error)
      return
    }

    if (contact) {
      await loadContacts()
      setShowAddContact(false)
      setNewContact({ name: "", email: "", phone: "", wallet_address: "" })
      
      // If contact has a wallet, select it
      if (contact.contact_wallet) {
        handleSelectContact(contact.contact_wallet, contact.contact_name)
      }
    }
  }

  function handleSelectContact(walletAddress: string, name?: string) {
    onChange(walletAddress, name)
    setIsOpen(false)
    setSearchQuery("")
  }

  async function copyInviteLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Import contacts from phone using Web Contacts API
  async function importPhoneContacts() {
    // Check if Contacts API is supported
    if (!("contacts" in navigator && "ContactsManager" in window)) {
      alert("Contact import is not supported on this device. Please use a mobile device with a compatible browser.")
      return
    }

    try {
      const props = ["name", "email", "tel"]
      const opts = { multiple: true }
      
      // @ts-expect-error - Contacts API types not in TypeScript
      const phoneContacts = await navigator.contacts.select(props, opts)
      
      // Add each contact to Thalos
      for (const contact of phoneContacts) {
        const name = contact.name?.[0] || "Unknown"
        const email = contact.email?.[0]
        const phone = contact.tel?.[0]
        
        if (name) {
          await addContact({ name, email, phone })
        }
      }
      
      // Reload contacts
      await loadContacts()
      alert(`Successfully imported ${phoneContacts.length} contacts!`)
    } catch (err) {
      console.error("Error importing contacts:", err)
    }
  }

  // Share Thalos referral link
  async function shareReferralLink() {
    const referralLink = `https://thalos.app/invite?ref=${encodeURIComponent(Date.now().toString(36))}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Thalos",
          text: "I'm using Thalos for secure P2P agreements. Join me!",
          url: referralLink,
        })
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled or failed:", err)
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(referralLink)
      alert("Referral link copied to clipboard!")
    }
  }

  const activeContacts = contacts.filter(c => c.status === "active" && c.contact_wallet)

  return (
    <div className={cn("relative", className)}>
      {/* Input with dropdown trigger */}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 transition-colors"
        >
          <Users className="h-4 w-4 text-white/50" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-[#0c1220] shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
          {/* Search - by ID, wallet, name */}
          <div className="p-3 border-b border-white/6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name, wallet, or ID..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9 text-sm"
              />
            </div>
            <p className="mt-2 text-[10px] text-white/30">Search contacts or Thalos users by name, wallet address, or user ID</p>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="p-2 border-b border-white/6">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Search Results</p>
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectContact(user.wallet_address, user.name)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-sky-400/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-sky-400">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/50 truncate">{user.email || user.wallet_address.slice(0, 12) + "..."}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* My Contacts */}
          <div className="p-2 max-h-48 overflow-y-auto">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">My Contacts</p>
            {activeContacts.length === 0 ? (
              <p className="px-3 py-2 text-sm text-white/40">No contacts yet</p>
            ) : (
              activeContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact.contact_wallet!, contact.contact_name)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-[#f0b400]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#f0b400]">{contact.contact_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{contact.contact_name}</p>
                    <p className="text-xs text-white/50 font-mono truncate">{contact.contact_wallet?.slice(0, 12)}...</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Import & Referral Actions */}
          <div className="p-2 border-t border-white/6 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={importPhoneContacts}
              className="flex-1 justify-center gap-2 text-white/60 hover:text-white hover:bg-white/5 h-9"
            >
              <Smartphone className="h-4 w-4" />
              <span className="text-xs">Import from Phone</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={shareReferralLink}
              className="flex-1 justify-center gap-2 text-white/60 hover:text-white hover:bg-white/5 h-9"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Refer Thalos</span>
            </Button>
          </div>

          {/* Add Contact */}
          <div className="p-3 border-t border-white/6">
            {!showAddContact ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddContact(true)}
                className="w-full justify-start gap-2 text-white/60 hover:text-white hover:bg-white/5"
              >
                <UserPlus className="h-4 w-4" />
                Add New Contact
              </Button>
            ) : inviteLink ? (
              <div className="space-y-3">
                <p className="text-sm text-white/70">Contact not on Thalos yet. Share this invite link:</p>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-white/5 border-white/10 text-white text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={copyInviteLink}
                    className="bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00]"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setInviteLink(null); setShowAddContact(false); setNewContact({ name: "", email: "", phone: "" }); }}
                  className="text-white/50"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Add Contact</p>
                  <button onClick={() => setShowAddContact(false)} className="p-1 hover:bg-white/10 rounded">
                    <X className="h-4 w-4 text-white/50" />
                  </button>
                </div>
                <Input
                  placeholder="Name *"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
                />
                <Input
                  placeholder="Phone (optional)"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
                />
                <Input
                  placeholder="Wallet Address (optional)"
                  value={newContact.wallet_address}
                  onChange={(e) => setNewContact({ ...newContact, wallet_address: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9 font-mono text-xs"
                />
                <Button
                  type="button"
                  onClick={handleAddContact}
                  disabled={!newContact.name || loading}
                  className="w-full bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00]"
                >
                  {loading ? "Adding..." : "Add Contact"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
