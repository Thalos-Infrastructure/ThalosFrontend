"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getContacts, addContact, searchThalosUsers, type Contact } from "@/lib/actions/contacts"
import { Search, UserPlus, Copy, Check, X, Users } from "lucide-react"

interface ContactSelectorProps {
  value: string
  onChange: (value: string, contactName?: string) => void
  placeholder?: string
  className?: string
}

export function ContactSelector({ value, onChange, placeholder = "Enter wallet address or select contact", className }: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string; wallet_address: string }>>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" })
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    const { contacts: data } = await getContacts()
    setContacts(data)
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    const { users } = await searchThalosUsers(query)
    setSearchResults(users)
  }

  async function handleAddContact() {
    if (!newContact.name) return
    setLoading(true)
    
    const { contact, inviteLink: link, error } = await addContact({
      name: newContact.name,
      email: newContact.email || undefined,
      phone: newContact.phone || undefined,
    })

    setLoading(false)

    if (error) {
      console.error("Error adding contact:", error)
      return
    }

    if (link) {
      setInviteLink(link)
    } else if (contact) {
      await loadContacts()
      setShowAddContact(false)
      setNewContact({ name: "", email: "", phone: "" })
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

  const activeContacts = contacts.filter(c => c.status === "active" && c.wallet_address)

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
          {/* Search */}
          <div className="p-3 border-b border-white/6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search Thalos users..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9 text-sm"
              />
            </div>
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
                  onClick={() => handleSelectContact(contact.wallet_address!, contact.name)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-[#f0b400]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#f0b400]">{contact.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                    <p className="text-xs text-white/50 font-mono truncate">{contact.wallet_address?.slice(0, 12)}...</p>
                  </div>
                </button>
              ))
            )}
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
