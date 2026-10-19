import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const updateMilestoneStatus = vi.fn()
const getAgreementByContractIdApi = vi.fn()

vi.mock("@/lib/api/agreements", () => ({
  updateMilestoneStatus: (...args: unknown[]) => updateMilestoneStatus(...args),
  getAgreementByContractIdApi: (...args: unknown[]) => getAgreementByContractIdApi(...args),
}))

import { reportMilestoneToNest } from "./reportMilestoneToNest"

const WALLET = "GPROVIDER0000000000000000000000000000000000000000000000"
const AGREEMENT_ID = "11111111-2222-3333-4444-555555555555"

const params = (overrides: Record<string, unknown> = {}) => ({
  step: "evidence" as const,
  agreementId: AGREEMENT_ID,
  contractId: "C1",
  milestoneIndex: 0,
  actorWallet: WALLET,
  token: "jwt",
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  updateMilestoneStatus.mockResolvedValue({ success: true })
  getAgreementByContractIdApi.mockResolvedValue({ success: true, data: { id: AGREEMENT_ID } })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("reportMilestoneToNest — what each step records", () => {
  it("sends the evidence text, which is what makes Thalos emit the event", async () => {
    // The status stays pending: Trustless Work's "completed" means delivered,
    // and the evidence fields are what EVIDENCE_SUBMITTED hangs off.
    const result = await reportMilestoneToNest(params({ evidence: "https://pr/1" }))

    expect(result.reported).toBe(true)
    expect(updateMilestoneStatus).toHaveBeenCalledWith(
      AGREEMENT_ID,
      0,
      "pending",
      WALLET,
      "https://pr/1",
      "jwt",
    )
  })

  it("falls back to a description rather than sending no evidence at all", async () => {
    await reportMilestoneToNest(params({ evidence: undefined }))

    expect(updateMilestoneStatus).toHaveBeenCalledWith(
      AGREEMENT_ID,
      0,
      "pending",
      WALLET,
      "Evidence submitted",
      "jwt",
    )
  })

  it("records an approval as approved, with no evidence text", async () => {
    await reportMilestoneToNest(params({ step: "approved", milestoneIndex: 2 }))

    expect(updateMilestoneStatus).toHaveBeenCalledWith(
      AGREEMENT_ID,
      2,
      "approved",
      WALLET,
      undefined,
      "jwt",
    )
  })

  it("records a release as released", async () => {
    await reportMilestoneToNest(params({ step: "released" }))

    expect(updateMilestoneStatus).toHaveBeenCalledWith(
      AGREEMENT_ID,
      0,
      "released",
      WALLET,
      undefined,
      "jwt",
    )
  })
})

describe("reportMilestoneToNest — finding the agreement", () => {
  it("uses the Thalos id when the caller has it, without a lookup", async () => {
    await reportMilestoneToNest(params())

    expect(getAgreementByContractIdApi).not.toHaveBeenCalled()
  })

  it("looks the agreement up by contract when the id is unknown", async () => {
    // Escrows read from the Trustless Work indexer carry no Thalos id.
    await reportMilestoneToNest(params({ agreementId: undefined }))

    expect(getAgreementByContractIdApi).toHaveBeenCalledWith("C1", "jwt")
    expect(updateMilestoneStatus).toHaveBeenCalledWith(
      AGREEMENT_ID,
      0,
      "pending",
      WALLET,
      expect.any(String),
      "jwt",
    )
  })

  it("reports, without failing, an agreement Thalos never registered", async () => {
    // The chain is still correct; there is simply no row to notify about.
    getAgreementByContractIdApi.mockResolvedValue({ success: false, error: "not found" })

    const result = await reportMilestoneToNest(params({ agreementId: undefined }))

    expect(result.reported).toBe(false)
    expect(result.error).toMatch(/not registered/)
    expect(updateMilestoneStatus).not.toHaveBeenCalled()
  })

  it("survives a lookup that throws", async () => {
    getAgreementByContractIdApi.mockRejectedValue(new Error("network"))

    await expect(reportMilestoneToNest(params({ agreementId: undefined }))).resolves.toMatchObject({
      reported: false,
    })
  })

  it("does nothing without a session", async () => {
    const result = await reportMilestoneToNest(params({ token: null }))

    expect(result.reported).toBe(false)
    expect(updateMilestoneStatus).not.toHaveBeenCalled()
  })
})

describe("reportMilestoneToNest — a failure here never undoes the chain", () => {
  it("returns the failure instead of throwing it", async () => {
    // The funds already moved. Throwing would push the caller to retry an
    // operation the chain would now reject.
    updateMilestoneStatus.mockResolvedValue({ success: false, error: "Invalid milestone index" })

    const result = await reportMilestoneToNest(params())

    expect(result).toEqual({ reported: false, error: "Invalid milestone index" })
  })

  it("survives the call throwing", async () => {
    updateMilestoneStatus.mockRejectedValue(new Error("boom"))

    await expect(reportMilestoneToNest(params())).resolves.toEqual({
      reported: false,
      error: "boom",
    })
  })

  it("says so loudly in the console, because this failing in silence is the bug", async () => {
    updateMilestoneStatus.mockResolvedValue({ success: false, error: "nope" })

    await reportMilestoneToNest(params())

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("no notification sent"),
      expect.objectContaining({ step: "evidence", agreementId: AGREEMENT_ID }),
    )
  })
})
