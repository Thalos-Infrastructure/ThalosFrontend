"use client"

import { useEffect, useState } from "react"
import { OpportunityCard } from "./opportunity-card"
import { discoverOpenOpportunities, type Opportunity } from "@/lib/api/opportunities"

export function PublicOpportunities() {
  const [items, setItems] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    discoverOpenOpportunities().then((result) => {
      if (!active) return
      if (result.success) setItems((result.data ?? []).filter((item) => item.status === "open"))
      else setError(result.error || "Could not load opportunities.")
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  if (loading) return <p className="py-16 text-center text-white/50">Loading opportunities…</p>
  if (error) return <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-300">{error}</p>
  if (!items.length) return <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><h2 className="font-semibold text-white">No open opportunities yet</h2><p className="mt-2 text-sm text-white/45">Check back soon for new ways to contribute.</p></div>
  return <div className="grid gap-5 md:grid-cols-2">{items.map((item) => <OpportunityCard key={item.id} opportunity={item} />)}</div>
}
