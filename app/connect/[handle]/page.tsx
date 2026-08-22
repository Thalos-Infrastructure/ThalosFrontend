"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchReputation, type ReputationSummary } from "@/lib/api/reputation"
import { ReputationSummary as ReputationCard } from "@/components/profile/reputation-summary"

export default function ShowcasePage() {
  const params = useParams<{ handle: string }>()
  const [reputation, setReputation] = useState<ReputationSummary | null>(null)
  useEffect(() => { if (params.handle) fetchReputation({ handle: params.handle }).then(setReputation) }, [params.handle])
  return <main className="mx-auto max-w-3xl px-6 py-12"><h1 className="mb-8 text-3xl font-bold">{params.handle}</h1><ReputationCard reputation={reputation} /></main>
}
