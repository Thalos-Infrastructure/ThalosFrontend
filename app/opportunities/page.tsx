import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PublicOpportunities } from "@/components/opportunities/public-opportunities"

export default function OpportunitiesPage() {
  return <main className="min-h-screen bg-[#080d18] text-white"><div className="mx-auto max-w-6xl px-6 py-12"><header className="mb-12 flex flex-wrap items-center justify-between gap-5"><Link href="/" className="text-xl font-bold">Thalos <span className="text-[#f0b400]">Connect</span></Link><Button asChild variant="outline"><Link href="/dashboard/opportunities">Manage opportunities</Link></Button></header><section className="mb-10 max-w-3xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f0b400]">Build with great projects</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Open opportunities</h1><p className="mt-4 text-lg leading-7 text-white/55">Discover roles and project tasks that match your skills.</p></section><PublicOpportunities /></div></main>
}
