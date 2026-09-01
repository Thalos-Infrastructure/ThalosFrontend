"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  getProfile,
  saveProfile,
  type ConnectProfile,
  type ProfileType,
} from "@/lib/api/profiles"
import { BriefcaseBusiness, FolderKanban, Save, X } from "lucide-react"

interface ProfileEditorProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
}

const EMPTY_PROFILE: ConnectProfile = {
  profile_types: [],
  headline: "",
  bio: "",
  skills: [],
  tech_stack: [],
  hourly_rate: null,
  availability: "",
  portfolio_links: [],
  social_links: [],
  handle: "",
  org_name: "",
  org_description: "",
  org_website: "",
  looking_for: [],
  org_links: [],
}

const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/30"
const textareaClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/50"

function toLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">
        {label}
      </span>
      {children}
    </label>
  )
}

export function ProfileEditor({ isOpen, onClose, token }: ProfileEditorProps) {
  const [form, setForm] = useState<ConnectProfile>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    if (!token) {
      setForm(EMPTY_PROFILE)
      setError("Sign in to edit your profile.")
      return
    }

    let active = true

    async function loadProfile() {
      setLoading(true)
      setError(null)

      const result = await getProfile(token)
      if (!active) return

      if (result.success && result.data) {
        setForm({
          ...EMPTY_PROFILE,
          ...result.data,
          profile_types: result.data.profile_types ?? [],
        })
      } else {
        setForm(EMPTY_PROFILE)
        if (result.error && !/not found/i.test(result.error)) {
          setError(result.error)
        }
      }

      setLoading(false)
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [isOpen, token])

  if (!isOpen) return null

  const selected = (type: ProfileType) => form.profile_types.includes(type)

  const toggleType = (type: ProfileType) => {
    setForm((current) => ({
      ...current,
      profile_types: current.profile_types.includes(type)
        ? current.profile_types.filter((item) => item !== type)
        : [...current.profile_types, type],
    }))
  }

  const handleSave = async () => {
    if (!token) return setError("Sign in to save your profile.")
    if (form.profile_types.length === 0) {
      return setError("Select Builder, Project, or both.")
    }

    if (selected("builder") && form.handle && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.handle)) {
      return setError("Handle must use lowercase letters, numbers, and single hyphens only.")
    }

    setSaving(true)
    setError(null)

    const result = await saveProfile(
      {
        ...form,
        handle: form.handle?.trim().toLowerCase() || null,
        hourly_rate:
          form.hourly_rate === null || Number.isNaN(form.hourly_rate)
            ? null
            : form.hourly_rate,
      },
      token
    )

    setSaving(false)

    if (!result.success) {
      return setError(result.error || "Could not save profile.")
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close profile editor"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c1220] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Thalos Connect profile</h2>
            <p className="text-sm text-white/45">Choose either profile type or use both.</p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {error ? (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {(["builder", "project"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={selected(type)}
                onClick={() => toggleType(type)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                  selected(type)
                    ? "border-[#f0b400] bg-[#f0b400]/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/55"
                }`}
              >
                {type === "builder" ? <BriefcaseBusiness /> : <FolderKanban />}
                <span>
                  <strong className="block capitalize">{type}</strong>
                  <span className="text-xs">
                    {selected(type) ? "Included in your profile" : "Click to include"}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center text-white/50">Loading profile...</p>
          ) : (
            <div className="space-y-6">
              {selected("builder") ? (
                <section className="space-y-4 rounded-xl border border-white/10 p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-white">
                    <BriefcaseBusiness className="h-4 w-4 text-[#f0b400]" />
                    Builder
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Handle">
                      <Input
                        value={form.handle ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            handle: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                          }))
                        }
                        placeholder="jane-builder"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Headline">
                      <Input
                        value={form.headline ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, headline: event.target.value }))
                        }
                        placeholder="Full-stack product engineer"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Skills (comma separated)">
                      <Input
                        value={form.skills.join(", ")}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, skills: toLines(event.target.value) }))
                        }
                        placeholder="Product design, Smart contracts"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Tech stack (comma separated)">
                      <Input
                        value={form.tech_stack.join(", ")}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            tech_stack: toLines(event.target.value),
                          }))
                        }
                        placeholder="React, NestJS, Soroban"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Hourly rate">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.hourly_rate ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            hourly_rate:
                              event.target.value === "" ? null : Number(event.target.value),
                          }))
                        }
                        placeholder="75"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Availability">
                      <Input
                        value={form.availability ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, availability: event.target.value }))
                        }
                        placeholder="Available for 20 hrs/week"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Bio">
                    <textarea
                      rows={3}
                      value={form.bio ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, bio: event.target.value }))
                      }
                      className={textareaClass}
                      placeholder="Tell projects what you build."
                    />
                  </Field>
                  <Field label="Portfolio links (one per line)">
                    <textarea
                      rows={2}
                      value={form.portfolio_links.join("\n")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          portfolio_links: toLines(event.target.value),
                        }))
                      }
                      className={textareaClass}
                      placeholder="https://portfolio.example"
                    />
                  </Field>
                  <Field label="Social links (one per line)">
                    <textarea
                      rows={2}
                      value={form.social_links.join("\n")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          social_links: toLines(event.target.value),
                        }))
                      }
                      className={textareaClass}
                      placeholder="https://github.com/jane"
                    />
                  </Field>
                </section>
              ) : null}

              {selected("project") ? (
                <section className="space-y-4 rounded-xl border border-white/10 p-5">
                  <h3 className="flex items-center gap-2 font-semibold text-white">
                    <FolderKanban className="h-4 w-4 text-blue-400" />
                    Project
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Organization name">
                      <Input
                        value={form.org_name ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, org_name: event.target.value }))
                        }
                        placeholder="Acme Labs"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Website">
                      <Input
                        type="url"
                        value={form.org_website ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            org_website: event.target.value,
                          }))
                        }
                        placeholder="https://acme.example"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Description">
                    <textarea
                      rows={3}
                      value={form.org_description ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          org_description: event.target.value,
                        }))
                      }
                      className={textareaClass}
                      placeholder="What is your project building?"
                    />
                  </Field>
                  <Field label="Looking for (comma separated)">
                    <Input
                      value={form.looking_for.join(", ")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          looking_for: toLines(event.target.value),
                        }))
                      }
                      placeholder="Frontend engineer, Auditor"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Organization links (one per line)">
                    <textarea
                      rows={2}
                      value={form.org_links.join("\n")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          org_links: toLines(event.target.value),
                        }))
                      }
                      className={textareaClass}
                      placeholder="https://github.com/acme"
                    />
                  </Field>
                </section>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white/60 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || !token}
            className="gap-2 bg-[#f0b400] text-[#0c1220] hover:bg-[#dba500]"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </div>
  )
}
