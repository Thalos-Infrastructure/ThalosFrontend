import { afterEach, describe, expect, it, vi } from "vitest"
import {
  discoverOpportunities,
  listMyOpportunities,
  postOpportunity,
  removeOpportunity,
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
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [opportunity],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)
    await expect(discoverOpportunities()).resolves.toMatchObject({
      success: true,
      data: {
        data: [opportunity],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    })
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Authorization")
  })

  it("lists all opportunities for the authenticated owner", async () => {
    const closed = { ...opportunity, status: "closed" as const }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify([closed]), { status: 200 }),
    ))
    await expect(listMyOpportunities("jwt")).resolves.toEqual({ success: true, data: [closed] })
  })

  it("creates, edits, and transitions status through Nest", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ opportunity }), { status: 200 }),
    )
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

    await postOpportunity(input, "jwt")
    await updateOpportunity("opp-1", { title: "Updated" }, "jwt")
    await updateOpportunityStatus("opp-1", "filled", "jwt")

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/opportunities$/), expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer jwt" }) }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/opportunities\/opp-1$/), expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "Updated" }) }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, expect.stringMatching(/\/opportunities\/opp-1$/), expect.objectContaining({ body: JSON.stringify({ status: "filled" }) }))
  })

  it("deletes an owner opportunity and accepts a 204 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(null, { status: 204 }),
    ))
    await expect(removeOpportunity("opp-1", "jwt")).resolves.toMatchObject({ success: true, data: undefined })
  })
})
