import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createOpportunity,
  deleteOpportunity,
  getMyOpportunities,
  getOpenOpportunities,
  updateOpportunity,
  updateOpportunityStatus,
  type Opportunity,
  type OpportunityInput,
} from "./opportunities"

const opportunity: Opportunity = {
  id: "opp-1",
  title: "Build the Connect directory",
  description: "Ship a fast and accessible directory.",
  skills_required: ["Next.js", "Accessibility"],
  budget_amount: 2500,
  budget_asset: "USDC",
  engagement_type: "milestone",
  status: "open",
}

describe("opportunities API", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("reads public open opportunities without authentication", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ opportunities: [opportunity] }) })
    vi.stubGlobal("fetch", fetchMock)
    await expect(getOpenOpportunities()).resolves.toEqual({ success: true, data: [opportunity] })
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Authorization")
  })

  it("lists all opportunities for the authenticated owner", async () => {
    const closed = { ...opportunity, status: "closed" as const }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify([closed]) }))
    await expect(getMyOpportunities("jwt")).resolves.toEqual({ success: true, data: [closed] })
  })

  it("creates, edits, and transitions status through Nest", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ opportunity }) })
    vi.stubGlobal("fetch", fetchMock)
    const input: OpportunityInput = {
      title: opportunity.title,
      description: opportunity.description,
      skills_required: opportunity.skills_required,
      budget_amount: opportunity.budget_amount,
      budget_asset: opportunity.budget_asset,
      engagement_type: opportunity.engagement_type,
      status: opportunity.status,
    }

    await createOpportunity(input, "jwt")
    await updateOpportunity("opp-1", { title: "Updated" }, "jwt")
    await updateOpportunityStatus("opp-1", "filled", "jwt")

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/opportunities$/), expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer jwt" }) }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/opportunities\/opp-1$/), expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "Updated" }) }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, expect.stringMatching(/\/opportunities\/opp-1$/), expect.objectContaining({ body: JSON.stringify({ status: "filled" }) }))
  })

  it("deletes an owner opportunity and accepts a 204 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => "" }))
    await expect(deleteOpportunity("opp-1", "jwt")).resolves.toEqual({ success: true, data: undefined })
  })
})
