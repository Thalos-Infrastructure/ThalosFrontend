import { afterEach, describe, expect, it, vi } from "vitest"
import { getAgreementsByWallet } from "./agreements"

const fetchMock = vi.fn()

describe("getAgreementsByWallet", () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it("hits /agreements/by-wallet with the wallet querystring", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ agreements: [] }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await getAgreementsByWallet("GABC123", "token-1")

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/agreements\/by-wallet\?wallet=GABC123$/),
      expect.objectContaining({ method: "GET" }),
    )
  })

  it("appends status and type filters to the querystring", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ agreements: [] }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    await getAgreementsByWallet("GABC123", "token-1", { status: "funded", type: "multi" })

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain("wallet=GABC123")
    expect(url).toContain("status=funded")
    expect(url).toContain("type=multi")
  })

  it("unwraps the { agreements } envelope on success, including participants", async () => {
    const agreement = {
      id: "agr-1",
      contract_id: "CONTRACT1",
      title: "Website Redesign",
      amount: "2500",
      status: "funded",
      agreement_type: "single",
      milestones: [],
      created_by: "GPAYER",
      created_at: "2026-01-15T00:00:00.000Z",
      participants: [{ id: "p1", agreement_id: "agr-1", wallet_address: "GPAYEE", role: "payee", joined_at: "2026-01-15T00:00:00.000Z" }],
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ agreements: [agreement] }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await getAgreementsByWallet("GABC123")

    expect(result).toEqual({ success: true, data: [agreement] })
  })

  it("returns an empty array when the wallet has no agreements (empty state)", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ agreements: [] }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await getAgreementsByWallet("GABC123")

    expect(result).toEqual({ success: true, data: [] })
  })

  it("surfaces a failure when the request errors (error state)", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Wallet not linked" }), { status: 404 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await getAgreementsByWallet("GABC123")

    expect(result).toEqual({ success: false, error: "Wallet not linked" })
  })
})
