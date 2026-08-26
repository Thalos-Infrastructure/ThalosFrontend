"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ThalosLoader } from "@/components/thalos-loader"
import { useLanguage } from "@/lib/i18n"
import { useAuthStore } from "@/lib/auth-store"
import {
  Search,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  ExternalLink,
  User,
} from "lucide-react"
import {
  discoverProfiles,
  type BuilderProfile,
  type ProfileDiscoveryParams,
} from "@/lib/api/profiles"
import {
  discoverOpportunities,
  type Opportunity,
  type OpportunityDiscoveryParams,
  type EngagementType,
} from "@/lib/api/opportunities"

const ITEMS_PER_PAGE = 12

const availabilityOptions = [
  { value: "available", label: "Available Now" },
  { value: "open", label: "Open to Offers" },
  { value: "unavailable", label: "Unavailable" },
]

const engagementTypeLabels: Record<EngagementType, string> = {
  fixed: "Fixed Price",
  milestone: "Milestone-Based",
  hourly: "Hourly",
}

const availabilityColors: Record<string, string> = {
  available: "bg-green-500/15 text-green-400 border-green-500/30",
  open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  unavailable: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

const engagementColors: Record<EngagementType, string> = {
  fixed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  milestone: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  hourly: "bg-orange-500/15 text-orange-400 border-orange-500/30",
}

export default function ConnectPage() {
  const { t } = useLanguage()
  const { token } = useAuthStore()

  const [activeTab, setActiveTab] = useState("builders")
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  // Builders state
  const [builders, setBuilders] = useState<BuilderProfile[]>([])
  const [buildersTotal, setBuildersTotal] = useState(0)
  const [buildersPage, setBuildersPage] = useState(1)
  const [buildersTotalPages, setBuildersTotalPages] = useState(0)
  const [builderSearch, setBuilderSearch] = useState("")
  const [builderSkills, setBuilderSkills] = useState<string[]>([])
  const [builderTechStack, setBuilderTechStack] = useState<string[]>([])
  const [builderAvailability, setBuilderAvailability] = useState<string>("")
  const [builderSkillInput, setBuilderSkillInput] = useState("")
  const [builderTechInput, setBuilderTechInput] = useState("")

  // Opportunities state
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [opportunitiesTotal, setOpportunitiesTotal] = useState(0)
  const [opportunitiesPage, setOpportunitiesPage] = useState(1)
  const [opportunitiesTotalPages, setOpportunitiesTotalPages] = useState(0)
  const [oppSearch, setOppSearch] = useState("")
  const [oppSkills, setOppSkills] = useState<string[]>([])
  const [oppEngagementType, setOppEngagementType] = useState<string>("")
  const [oppBudgetMin, setOppBudgetMin] = useState("")
  const [oppBudgetMax, setOppBudgetMax] = useState("")
  const [oppSkillInput, setOppSkillInput] = useState("")

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch builders ──
  const fetchBuilders = useCallback(
    async (page: number, immediate = false) => {
      if (!immediate) setIsSearching(true)
      else setIsLoading(true)

      const params: ProfileDiscoveryParams = {
        page,
        limit: ITEMS_PER_PAGE,
      }
      if (builderSearch) params.q = builderSearch
      if (builderSkills.length) params.skills = builderSkills
      if (builderTechStack.length) params.tech_stack = builderTechStack
      if (builderAvailability) {
        params.availability = builderAvailability as "available" | "open" | "unavailable"
      }

      const result = await discoverProfiles(params, token ?? undefined)

      if (result.success && result.data) {
        setBuilders(result.data.data)
        setBuildersTotal(result.data.total)
        setBuildersPage(result.data.page)
        setBuildersTotalPages(result.data.totalPages)
      } else {
        setBuilders([])
        setBuildersTotal(0)
      }

      setIsLoading(false)
      setIsSearching(false)
    },
    [builderSearch, builderSkills, builderTechStack, builderAvailability, token]
  )

  // ── Fetch opportunities ──
  const fetchOpportunities = useCallback(
    async (page: number, immediate = false) => {
      if (!immediate) setIsSearching(true)
      else setIsLoading(true)

      const params: OpportunityDiscoveryParams = {
        page,
        limit: ITEMS_PER_PAGE,
      }
      if (oppSearch) params.q = oppSearch
      if (oppSkills.length) params.skills_required = oppSkills
      if (oppEngagementType) {
        params.engagement_type = oppEngagementType as EngagementType
      }
      if (oppBudgetMin) params.budget_min = Number(oppBudgetMin)
      if (oppBudgetMax) params.budget_max = Number(oppBudgetMax)

      const result = await discoverOpportunities(params, token ?? undefined)

      if (result.success && result.data) {
        setOpportunities(result.data.data)
        setOpportunitiesTotal(result.data.total)
        setOpportunitiesPage(result.data.page)
        setOpportunitiesTotalPages(result.data.totalPages)
      } else {
        setOpportunities([])
        setOpportunitiesTotal(0)
      }

      setIsLoading(false)
      setIsSearching(false)
    },
    [oppSearch, oppSkills, oppEngagementType, oppBudgetMin, oppBudgetMax, token]
  )

  // ── Initial load ──
  useEffect(() => {
    fetchBuilders(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Re-fetch when tab changes ──
  useEffect(() => {
    if (activeTab === "builders") {
      fetchBuilders(buildersPage, true)
    } else {
      fetchOpportunities(opportunitiesPage, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ── Debounced search for builders ──
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      if (activeTab === "builders") {
        fetchBuilders(1)
      }
    }, 400)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [builderSearch, builderSkills, builderTechStack, builderAvailability, activeTab, fetchBuilders])

  // ── Debounced search for opportunities ──
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      if (activeTab === "opportunities") {
        fetchOpportunities(1)
      }
    }, 400)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [oppSearch, oppSkills, oppEngagementType, oppBudgetMin, oppBudgetMax, activeTab, fetchOpportunities])

  // ── Tag helpers ──
  function addTag(
    value: string,
    tags: string[],
    setTags: (v: string[]) => void,
    setInput: (v: string) => void
  ) {
    const trimmed = value.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setInput("")
  }

  function removeTag(tag: string, tags: string[], setTags: (v: string[]) => void) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleTagKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    value: string,
    tags: string[],
    setTags: (v: string[]) => void,
    setInput: (v: string) => void
  ) {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag(value, tags, setTags, setInput)
    }
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ThalosLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/personal">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
          <Link href="/">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={32}
              height={32}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Page Title */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0b400]/15 text-[#f0b400]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Thalos Connect
            </h1>
            <p className="mt-1 text-muted-foreground">
              Discover builders and opportunities in the Thalos ecosystem
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-12 w-full max-w-md rounded-xl bg-muted/50 p-1">
            <TabsTrigger
              value="builders"
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium data-[state=active]:bg-[#f0b400]/15 data-[state=active]:text-[#f0b400]"
            >
              <Users className="h-4 w-4" />
              Builders
              {activeTab === "builders" && buildersTotal > 0 && (
                <Badge variant="secondary" className="ml-1 bg-[#f0b400]/20 text-[#f0b400] text-[10px] px-1.5 py-0">
                  {buildersTotal}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="opportunities"
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium data-[state=active]:bg-[#f0b400]/15 data-[state=active]:text-[#f0b400]"
            >
              <Briefcase className="h-4 w-4" />
              Opportunities
              {activeTab === "opportunities" && opportunitiesTotal > 0 && (
                <Badge variant="secondary" className="ml-1 bg-[#f0b400]/20 text-[#f0b400] text-[10px] px-1.5 py-0">
                  {opportunitiesTotal}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Builders Tab ── */}
          <TabsContent value="builders" className="space-y-5">
            {/* Search + Filters */}
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={builderSearch}
                  onChange={(e) => setBuilderSearch(e.target.value)}
                  placeholder="Search builders by name, headline, or bio..."
                  className="pl-10 bg-card/50 border-border/40 h-11"
                />
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  Filters:
                </div>

                {/* Availability filter */}
                <Select
                  value={builderAvailability}
                  onValueChange={(v) => setBuilderAvailability(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-auto text-xs bg-card/50 border-border/40">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Availability</SelectItem>
                    {availabilityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Skills input */}
                <div className="flex items-center gap-1.5">
                  <Input
                    value={builderSkillInput}
                    onChange={(e) => setBuilderSkillInput(e.target.value)}
                    onKeyDown={(e) =>
                      handleTagKeyDown(e, builderSkillInput, builderSkills, setBuilderSkills, setBuilderSkillInput)
                    }
                    placeholder="Add skill..."
                    className="h-8 w-32 text-xs bg-card/50 border-border/40"
                  />
                </div>

                {/* Tech stack input */}
                <div className="flex items-center gap-1.5">
                  <Input
                    value={builderTechInput}
                    onChange={(e) => setBuilderTechInput(e.target.value)}
                    onKeyDown={(e) =>
                      handleTagKeyDown(e, builderTechInput, builderTechStack, setBuilderTechStack, setBuilderTechInput)
                    }
                    placeholder="Add tech..."
                    className="h-8 w-32 text-xs bg-card/50 border-border/40"
                  />
                </div>

                {/* Clear filters */}
                {(builderSkills.length > 0 || builderTechStack.length > 0 || builderAvailability) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setBuilderSkills([])
                      setBuilderTechStack([])
                      setBuilderAvailability("")
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Active filter tags */}
              {(builderSkills.length > 0 || builderTechStack.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {builderSkills.map((skill) => (
                    <Badge
                      key={`skill-${skill}`}
                      variant="secondary"
                      className="bg-[#f0b400]/10 text-[#f0b400] text-[11px] gap-1 pr-1"
                    >
                      {skill}
                      <button
                        onClick={() => removeTag(skill, builderSkills, setBuilderSkills)}
                        className="ml-0.5 rounded-full hover:bg-[#f0b400]/20 p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {builderTechStack.map((tech) => (
                    <Badge
                      key={`tech-${tech}`}
                      variant="secondary"
                      className="bg-blue-500/10 text-blue-400 text-[11px] gap-1 pr-1"
                    >
                      {tech}
                      <button
                        onClick={() => removeTag(tech, builderTechStack, setBuilderTechStack)}
                        className="ml-0.5 rounded-full hover:bg-blue-500/20 p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {isSearching ? (
              <div className="flex items-center justify-center py-16">
                <ThalosLoader />
              </div>
            ) : builders.length === 0 ? (
              <EmptyState
                icon={<Users className="h-12 w-12" />}
                title="No builders found"
                description="Try adjusting your search or filters to find builders."
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {builders.map((builder) => (
                    <BuilderCard key={builder.id} builder={builder} />
                  ))}
                </div>
                <Pagination
                  currentPage={buildersPage}
                  totalPages={buildersTotalPages}
                  total={buildersTotal}
                  onPageChange={(p) => fetchBuilders(p)}
                />
              </>
            )}
          </TabsContent>

          {/* ── Opportunities Tab ── */}
          <TabsContent value="opportunities" className="space-y-5">
            {/* Search + Filters */}
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={oppSearch}
                  onChange={(e) => setOppSearch(e.target.value)}
                  placeholder="Search opportunities by title or description..."
                  className="pl-10 bg-card/50 border-border/40 h-11"
                />
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  Filters:
                </div>

                {/* Engagement type filter */}
                <Select
                  value={oppEngagementType}
                  onValueChange={(v) => setOppEngagementType(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="h-8 w-auto text-xs bg-card/50 border-border/40">
                    <SelectValue placeholder="Engagement Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="milestone">Milestone-Based</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>

                {/* Budget range */}
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={oppBudgetMin}
                    onChange={(e) => setOppBudgetMin(e.target.value)}
                    placeholder="Min"
                    className="h-8 w-20 text-xs bg-card/50 border-border/40"
                    min="0"
                  />
                  <span className="text-muted-foreground text-xs">-</span>
                  <Input
                    type="number"
                    value={oppBudgetMax}
                    onChange={(e) => setOppBudgetMax(e.target.value)}
                    placeholder="Max"
                    className="h-8 w-20 text-xs bg-card/50 border-border/40"
                    min="0"
                  />
                </div>

                {/* Skills input */}
                <div className="flex items-center gap-1.5">
                  <Input
                    value={oppSkillInput}
                    onChange={(e) => setOppSkillInput(e.target.value)}
                    onKeyDown={(e) =>
                      handleTagKeyDown(e, oppSkillInput, oppSkills, setOppSkills, setOppSkillInput)
                    }
                    placeholder="Add skill..."
                    className="h-8 w-32 text-xs bg-card/50 border-border/40"
                  />
                </div>

                {/* Clear filters */}
                {(oppSkills.length > 0 || oppEngagementType || oppBudgetMin || oppBudgetMax) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setOppSkills([])
                      setOppEngagementType("")
                      setOppBudgetMin("")
                      setOppBudgetMax("")
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Active filter tags */}
              {oppSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {oppSkills.map((skill) => (
                    <Badge
                      key={`opp-skill-${skill}`}
                      variant="secondary"
                      className="bg-[#f0b400]/10 text-[#f0b400] text-[11px] gap-1 pr-1"
                    >
                      {skill}
                      <button
                        onClick={() => removeTag(skill, oppSkills, setOppSkills)}
                        className="ml-0.5 rounded-full hover:bg-[#f0b400]/20 p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            {isSearching ? (
              <div className="flex items-center justify-center py-16">
                <ThalosLoader />
              </div>
            ) : opportunities.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="h-12 w-12" />}
                title="No opportunities found"
                description="Try adjusting your search or filters to find opportunities."
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {opportunities.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
                <Pagination
                  currentPage={opportunitiesPage}
                  totalPages={opportunitiesTotalPages}
                  total={opportunitiesTotal}
                  onPageChange={(p) => fetchOpportunities(p)}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// ── Builder Card ──
function BuilderCard({ builder }: { builder: BuilderProfile }) {
  return (
    <Link
      href={builder.handle ? `/profile/${builder.handle}` : "#"}
      className="group rounded-xl border border-border/40 bg-card/50 p-5 transition-all duration-200 hover:border-[#f0b400]/30 hover:bg-card hover:shadow-lg hover:shadow-[#f0b400]/5"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
          {builder.avatar_url ? (
            <Image
              src={builder.avatar_url}
              alt={builder.display_name || "Builder"}
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f0b400]/10 text-[#f0b400]">
              <User className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-[#f0b400] transition-colors">
              {builder.display_name || "Unnamed Builder"}
            </h3>
            {builder.handle && (
              <span className="text-[11px] text-muted-foreground">@{builder.handle}</span>
            )}
          </div>
          {builder.headline && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{builder.headline}</p>
          )}
        </div>

        {builder.availability && (
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${availabilityColors[builder.availability] || availabilityColors.unavailable}`}
          >
            <Clock className="mr-1 h-2.5 w-2.5" />
            {builder.availability}
          </Badge>
        )}
      </div>

      {builder.bio && (
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{builder.bio}</p>
      )}

      {/* Skills */}
      {builder.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {builder.skills.slice(0, 4).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="bg-muted/50 text-muted-foreground text-[10px] px-1.5 py-0"
            >
              {skill}
            </Badge>
          ))}
          {builder.skills.length > 4 && (
            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px] px-1.5 py-0">
              +{builder.skills.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Tech stack */}
      {builder.tech_stack.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {builder.tech_stack.slice(0, 3).map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="border-blue-500/20 text-blue-400/80 text-[10px] px-1.5 py-0"
            >
              {tech}
            </Badge>
          ))}
          {builder.tech_stack.length > 3 && (
            <Badge variant="outline" className="border-blue-500/20 text-blue-400/80 text-[10px] px-1.5 py-0">
              +{builder.tech_stack.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Hourly rate */}
      {builder.hourly_rate !== null && (
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          <span className="font-medium text-foreground">${builder.hourly_rate}</span>
          <span>/hr</span>
        </div>
      )}
    </Link>
  )
}

// ── Opportunity Card ──
function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Link
      href={`/opportunities/${opportunity.id}`}
      className="group rounded-xl border border-border/40 bg-card/50 p-5 transition-all duration-200 hover:border-[#f0b400]/30 hover:bg-card hover:shadow-lg hover:shadow-[#f0b400]/5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-[#f0b400] transition-colors">
          {opportunity.title}
        </h3>
        <Badge
          variant="outline"
          className={`shrink-0 text-[10px] ${engagementColors[opportunity.engagement_type]}`}
        >
          {engagementTypeLabels[opportunity.engagement_type]}
        </Badge>
      </div>

      {opportunity.description && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{opportunity.description}</p>
      )}

      {/* Project info */}
      {opportunity.project && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-5 w-5 overflow-hidden rounded-full bg-muted">
            {opportunity.project.avatar_url ? (
              <Image
                src={opportunity.project.avatar_url}
                alt={opportunity.project.org_name || ""}
                width={20}
                height={20}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#f0b400]/10 text-[#f0b400]">
                <User className="h-2.5 w-2.5" />
              </div>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {opportunity.project.org_name || opportunity.project.display_name || "Project"}
          </span>
          {opportunity.project.handle && (
            <span className="text-[11px] text-muted-foreground/60">
              @{opportunity.project.handle}
            </span>
          )}
        </div>
      )}

      {/* Skills required */}
      {opportunity.skills_required.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {opportunity.skills_required.slice(0, 4).map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="bg-muted/50 text-muted-foreground text-[10px] px-1.5 py-0"
            >
              {skill}
            </Badge>
          ))}
          {opportunity.skills_required.length > 4 && (
            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px] px-1.5 py-0">
              +{opportunity.skills_required.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Budget */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          <span className="font-semibold text-foreground">
            {opportunity.budget_amount.toLocaleString()}
          </span>
          <span>{opportunity.budget_asset}</span>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-[#f0b400] transition-colors" />
      </div>
    </Link>
  )
}

// ── Pagination ──
function Pagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, total)

  // Generate page numbers to show
  const pages: (number | "ellipsis")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("ellipsis")
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/50 px-4 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {startItem}–{endItem} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((page, i) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "ghost"}
              size="sm"
              className={`h-8 w-8 p-0 text-xs ${
                page === currentPage
                  ? "bg-[#f0b400]/15 text-[#f0b400] hover:bg-[#f0b400]/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          )
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ── Empty State ──
function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 bg-card/30 py-16 text-center">
      <div className="mb-4 text-muted-foreground/30">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
