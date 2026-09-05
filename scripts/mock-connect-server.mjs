#!/usr/bin/env node
/**
 * Local mock for the Thalos Connect API (opportunities + applications).
 * Dev/testing aid ONLY — implements the contract of ThalosBackend#168
 * (applications) and #138 (opportunities) against the default frontend
 * API_URL (http://localhost:3001/v1).
 *
 * Run with:  pnpm mock:connect   (or: node scripts/mock-connect-server.mjs)
 * Then start the frontend:       pnpm dev  → http://localhost:3000
 *
 * In-memory store — restarting the script resets all data.
 * Auth: accepts any Bearer token; the JWT `sub` (when present) is used as the
 * caller identity so applications/opportunities carry the real user id and the
 * dashboard can resolve the builder's profile/wallet.
 */

import { createServer } from "node:http"
import { randomUUID } from "node:crypto"

const PORT = Number(process.env.PORT || 3001)
const V1 = "/v1"

/* ── In-memory store ── */
const opportunities = new Map()
const applications = new Map()

function seed() {
  const now = Date.now()
  const iso = (ms) => new Date(now + ms).toISOString()
  const opp1 = {
    id: randomUUID(),
    project_id: "mock-project",
    title: "Stellar Soroban Developer",
    description:
      "Build a milestone-based escrow dApp on Stellar. You will implement the Soroban smart contract, wire the frontend to Freighter, and ship a working demo on testnet. Deliverables: contract, integration tests, and a short walkthrough video.",
    skills_required: ["Rust", "Soroban", "TypeScript", "Freighter"],
    budget_amount: 8000,
    budget_asset: "USDC",
    engagement_type: "milestone",
    status: "open",
    created_at: iso(-86400000 * 3),
  }
  const opp2 = {
    id: randomUUID(),
    project_id: "mock-project",
    title: "Stellar Community Content Writer",
    description:
      "Write 4 beginner-friendly guides about escrow agreements, milestones, and trustlines on Stellar. Published on the Thalos blog and mirrored to the community forum.",
    skills_required: ["Writing", "Stellar", "DeFi"],
    budget_amount: 1500,
    budget_asset: "USDC",
    engagement_type: "fixed",
    status: "open",
    created_at: iso(-86400000),
  }
  opportunities.set(opp1.id, opp1)
  opportunities.set(opp2.id, opp2)
}

/* ── Helpers ── */
function send(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  let raw = ""
  for await (const chunk of req) raw += chunk
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Best-effort JWT payload decode (identity only — signatures are NOT verified in the mock). */
function callerSub(req) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return null
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    )
    return typeof payload.sub === "string" ? payload.sub : null
  } catch {
    return null
  }
}

const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s))
const ENGAGEMENTS = ["fixed", "milestone", "hourly"]
const STATUSES = ["open", "closed", "filled"]
const APP_STATUSES = ["accepted", "rejected"]

function publicOpportunity(opp) {
  return { ...opp } // contract returns full entity; discovery only includes status=open
}

/* ── Routes ── */
function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const path = url.pathname

  if (req.method === "OPTIONS") return send(res, 204, {})

  /* GET /v1/opportunities — discovery (open only) */
  if (req.method === "GET" && path === `${V1}/opportunities`) {
    const q = (url.searchParams.get("q") || "").toLowerCase()
    const skills = (url.searchParams.get("skills_required") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const engagement = url.searchParams.get("engagement_type")
    const budgetMin = url.searchParams.get("budget_min")
    const budgetMax = url.searchParams.get("budget_max")
    const page = Math.max(1, Number(url.searchParams.get("page") || 1))
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)))

    let rows = [...opportunities.values()].filter((o) => o.status === "open")
    if (q) rows = rows.filter((o) => `${o.title} ${o.description}`.toLowerCase().includes(q))
    if (skills.length)
      rows = rows.filter((o) =>
        skills.every((s) => o.skills_required.some((k) => k.toLowerCase() === s.toLowerCase())),
      )
    if (engagement) rows = rows.filter((o) => o.engagement_type === engagement)
    if (budgetMin !== null && budgetMin !== "")
      rows = rows.filter((o) => Number(o.budget_amount) >= Number(budgetMin))
    if (budgetMax !== null && budgetMax !== "")
      rows = rows.filter((o) => Number(o.budget_amount) <= Number(budgetMax))
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

    const total = rows.length
    const data = rows.slice((page - 1) * limit, page * limit).map(publicOpportunity)
    return send(res, 200, { opportunities: data, total, page, limit, error: null })
  }

  /* GET /v1/opportunities/mine — owner list, ALL statuses (must precede /:id) */
  if (req.method === "GET" && path === `${V1}/opportunities/mine`) {
    const sub = callerSub(req)
    const rows = [...opportunities.values()]
      .filter((o) => o.project_id === sub)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return send(res, 200, { opportunities: rows, error: null })
  }

  /* GET /v1/opportunities/:id — public detail (404 unless open) */
  const detailMatch = path.match(new RegExp(`^${V1}/opportunities/([^/]+)$`))
  if (req.method === "GET" && detailMatch) {
    const opp = opportunities.get(detailMatch[1])
    if (!opp || opp.status !== "open") {
      return send(res, 404, { opportunity: null, error: "Opportunity not found or no longer open" })
    }
    return send(res, 200, { opportunity: publicOpportunity(opp), error: null })
  }

  /* POST /v1/opportunities — owner create */
  if (req.method === "POST" && path === `${V1}/opportunities`) {
    readBody(req).then((body) => {
      if (!body) return send(res, 400, { opportunity: null, error: "Invalid JSON body" })
      const title = typeof body.title === "string" ? body.title.trim() : ""
      const description = typeof body.description === "string" ? body.description.trim() : ""
      const skills = Array.isArray(body.skills_required)
        ? body.skills_required
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean)
        : []
      const budget = Number(body.budget_amount)
      const engagement = ENGAGEMENTS.includes(body.engagement_type) ? body.engagement_type : null

      if (!title) return send(res, 400, { opportunity: null, error: "title is required" })
      if (!Number.isFinite(budget) || budget <= 0)
        return send(res, 400, {
          opportunity: null,
          error: "budget_amount must be a positive number",
        })
      if (!engagement)
        return send(res, 400, {
          opportunity: null,
          error: "engagement_type must be fixed | milestone | hourly",
        })

      const opp = {
        id: randomUUID(),
        project_id: callerSub(req) ?? "mock-project",
        title,
        description,
        skills_required: skills,
        budget_amount: budget,
        budget_asset:
          typeof body.budget_asset === "string" && body.budget_asset ? body.budget_asset : "USDC",
        engagement_type: engagement,
        status: "open",
        created_at: new Date().toISOString(),
      }
      opportunities.set(opp.id, opp)
      console.log(`[mock] POST /opportunities → ${opp.id} "${opp.title}"`)
      return send(res, 201, { opportunity: publicOpportunity(opp), error: null })
    })
    return
  }

  /* PATCH /v1/opportunities/:id — owner edit + status transitions */
  const patchMatch = path.match(new RegExp(`^${V1}/opportunities/([^/]+)$`))
  if (req.method === "PATCH" && patchMatch) {
    readBody(req).then((body) => {
      if (!body) return send(res, 400, { opportunity: null, error: "Invalid JSON body" })
      const opp = opportunities.get(patchMatch[1])
      if (!opp) return send(res, 404, { opportunity: null, error: "Opportunity not found" })

      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status))
          return send(res, 400, {
            opportunity: null,
            error: "status must be open | closed | filled",
          })
        if (opp.status === "filled" && body.status !== "filled") {
          return send(res, 409, {
            opportunity: null,
            error: "A filled opportunity cannot be reopened",
          })
        }
        opp.status = body.status
      }
      if (typeof body.title === "string") opp.title = body.title.trim()
      if (typeof body.description === "string") opp.description = body.description.trim()
      if (Array.isArray(body.skills_required))
        opp.skills_required = body.skills_required
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean)
      if (body.budget_amount !== undefined && Number.isFinite(Number(body.budget_amount)))
        opp.budget_amount = Number(body.budget_amount)
      if (typeof body.budget_asset === "string" && body.budget_asset)
        opp.budget_asset = body.budget_asset
      if (ENGAGEMENTS.includes(body.engagement_type)) opp.engagement_type = body.engagement_type

      console.log(`[mock] PATCH /opportunities/${opp.id} → status=${opp.status}`)
      return send(res, 200, { opportunity: publicOpportunity(opp), error: null })
    })
    return
  }

  /* POST /v1/applications — builder applies (409 on duplicate) */
  if (req.method === "POST" && path === `${V1}/applications`) {
    readBody(req).then((body) => {
      if (!body) return send(res, 400, { application: null, error: "Invalid JSON body" })
      const opportunityId = body.opportunity_id
      const message = typeof body.message === "string" ? body.message : ""
      const builderId = callerSub(req)

      // Apply must be attributed to a real authenticated user: the duplicate
      // guard keys on this id. An anonymous/missing JWT means no stable
      // identity, so reject it rather than minting a throwaway random id that
      // would let the same wallet apply repeatedly undetected.
      if (!builderId) {
        return send(res, 401, { application: null, error: "Authentication required to apply" })
      }

      if (!isUuid(opportunityId))
        return send(res, 400, { application: null, error: "opportunity_id must be a UUID" })
      const opp = opportunities.get(opportunityId)
      if (!opp) return send(res, 404, { application: null, error: "Opportunity not found" })

      // Owner cannot apply to their own opportunity (matches real BE#139).
      if (opp.project_id === builderId) {
        return send(res, 403, {
          application: null,
          error: "Projects cannot apply to their own opportunities",
        })
      }

      if (opp.status !== "open")
        return send(res, 409, { application: null, error: "This opportunity is no longer open" })

      const duplicate = [...applications.values()].find(
        (a) => a.opportunity_id === opportunityId && a.builder_id === builderId,
      )
      if (duplicate)
        return send(res, 409, {
          application: null,
          error: "You have already applied to this opportunity",
        })

      const application = {
        id: randomUUID(),
        opportunity_id: opportunityId,
        builder_id: builderId,
        message,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      applications.set(application.id, application)
      console.log(`[mock] POST /applications → ${application.id} (${builderId})`)
      return send(res, 201, { application, error: null })
    })
    return
  }

  /* GET /v1/applications?opportunity_id= — applicants for an opportunity */
  if (req.method === "GET" && path === `${V1}/applications`) {
    const opportunityId = url.searchParams.get("opportunity_id")
    if (!isUuid(opportunityId))
      return send(res, 400, { applications: [], error: "opportunity_id is required" })
    const callerId = callerSub(req)
    const opp = opportunities.get(opportunityId)
    const isOwner = opp && callerId && opp.project_id === callerId
    const rows = [...applications.values()]
      .filter((a) => a.opportunity_id === opportunityId && (isOwner || a.builder_id === callerId))
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    return send(res, 200, { applications: rows, error: null })
  }

  /* PATCH /v1/applications/:id — accept/reject (409 unless pending; accept also stamps filled_at) */
  const appPatch = path.match(new RegExp(`^${V1}/applications/([^/]+)$`))
  if (req.method === "PATCH" && appPatch) {
    readBody(req).then((body) => {
      if (!body || !APP_STATUSES.includes(body.status)) {
        return send(res, 400, { application: null, error: "status must be accepted | rejected" })
      }
      const application = applications.get(appPatch[1])
      if (!application) return send(res, 404, { application: null, error: "Application not found" })

      // Only the opportunity owner can accept/reject (matches real BE#139).
      const callerId = callerSub(req)
      const opp = opportunities.get(application.opportunity_id)
      if (!opp || opp.project_id !== callerId) {
        return send(res, 403, {
          application: null,
          error: "Only the owning Project can perform this action",
        })
      }

      if (application.status !== "pending") {
        return send(res, 409, {
          application: null,
          error: `Application is already ${application.status} and cannot be changed`,
        })
      }
      application.status = body.status
      application.updated_at = new Date().toISOString()
      if (body.status === "accepted") {
        // Mark opportunity as filled (matches real BE — status:"filled", not filled_at).
        if (opp) opp.status = "filled"
        // Reject all other pending applications for this opportunity.
        for (const other of applications.values()) {
          if (
            other.opportunity_id === application.opportunity_id &&
            other.id !== application.id &&
            other.status === "pending"
          ) {
            other.status = "rejected"
            other.updated_at = new Date().toISOString()
          }
        }
      }
      console.log(`[mock] PATCH /applications/${application.id} → ${application.status}`)
      return send(res, 200, { application, error: null })
    })
    return
  }

  return send(res, 404, { error: `No route for ${req.method} ${path}` })
}

/* ── Boot ── */
seed()
createServer(handle).listen(PORT, () => {
  console.log(`\n[mock] Thalos Connect mock API listening on http://localhost:${PORT}${V1}`)
  console.log(`[mock] Routes:`)
  console.log(`[mock]   GET    /v1/opportunities            (open only, filters + pagination)`)
  console.log(`[mock]   GET    /v1/opportunities/mine       (owner list, all statuses)`)
  console.log(`[mock]   GET    /v1/opportunities/:id        (404 unless open)`)
  console.log(`[mock]   POST   /v1/opportunities            (owner create)`)
  console.log(`[mock]   PATCH  /v1/opportunities/:id        (owner edit + status)`)
  console.log(`[mock]   POST   /v1/applications             (409 on duplicate)`)
  console.log(`[mock]   GET    /v1/applications?opportunity_id=`)
  console.log(
    `[mock]   PATCH  /v1/applications/:id         (accepted|rejected, 409 unless pending)`,
  )
  console.log(`[mock] Seeded with 2 demo opportunities. Restart to reset data.\n`)
})
