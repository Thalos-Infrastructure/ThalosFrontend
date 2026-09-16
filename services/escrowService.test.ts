import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  api: {
    getEscrowsBySigner: vi.fn(),
    getEscrowsByRole: vi.fn(),
    buildCreateEscrow: vi.fn(),
    buildFundEscrow: vi.fn(),
    buildApproveMilestone: vi.fn(),
    buildChangeMilestoneStatus: vi.fn(),
    buildReleaseFunds: vi.fn(),
    buildDisputeMilestone: vi.fn(),
    submitSignedTransaction: vi.fn(),
  },
  emitTelemetry: vi.fn(),
}))

vi.mock("@/lib/api/escrow", () => mocks.api)
vi.mock("@/lib/telemetry/escrow", () => ({ emitEscrowTelemetry: mocks.emitTelemetry }))

import * as escrow from "./escrowService"
import type { AgreementPayload } from "./escrow.types"

const TOKEN = "jwt-token"

const payload: AgreementPayload = {
  title: "Design work",
  description: "Landing page",
  amount: "100",
  platformFee: "1",
  signer: "GSIGNER",
  serviceType: "multi-release",
  roles: {
    approver: "GAPPROVER",
    serviceProvider: "GPROVIDER",
    releaseSigner: "GRELEASE",
    disputeResolver: "GDISPUTE",
    platformAddress: "GPLATFORM",
    receiver: "GRECEIVER",
  },
  milestones: [{ description: "Phase 1", amount: "100", status: "pending" }],
  notifications: { notifyEmail: "buyer@example.com", signerEmail: "seller@example.com" },
}

/** Every write, with the api function it must reach and the args it must pass. */
const writeCases = [
  {
    operation: "createAgreement",
    invoke: () => escrow.createAgreement(payload, TOKEN),
    apiMock: mocks.api.buildCreateEscrow,
    args: () => [expect.objectContaining({ title: "Design work", signer: "GSIGNER" }), TOKEN],
  },
  {
    operation: "fundEscrow",
    invoke: () => escrow.fundEscrow("C1", "GSIGNER", 50, "multi-release", TOKEN),
    apiMock: mocks.api.buildFundEscrow,
    args: () => [{ contractId: "C1", signer: "GSIGNER", amount: 50, type: "multi-release" }, TOKEN],
  },
  {
    operation: "approveMilestone",
    invoke: () => escrow.approveMilestone("C1", "0", "GAPPROVER", "multi-release", TOKEN),
    apiMock: mocks.api.buildApproveMilestone,
    args: () => [
      { contractId: "C1", milestoneIndex: "0", approver: "GAPPROVER", type: "multi-release" },
      TOKEN,
    ],
  },
  {
    operation: "changeMilestoneStatus",
    invoke: () =>
      escrow.changeMilestoneStatus(
        "C1",
        "0",
        "https://evidence",
        "completed",
        "GPROVIDER",
        "multi-release",
        TOKEN,
      ),
    apiMock: mocks.api.buildChangeMilestoneStatus,
    args: () => [
      {
        contractId: "C1",
        milestoneIndex: "0",
        newEvidence: "https://evidence",
        newStatus: "completed",
        serviceProvider: "GPROVIDER",
        type: "multi-release",
      },
      TOKEN,
    ],
  },
  {
    operation: "releaseFunds",
    invoke: () => escrow.releaseFunds("C1", "GRELEASE", "multi-release", "0", TOKEN),
    apiMock: mocks.api.buildReleaseFunds,
    args: () => [
      { contractId: "C1", releaseSigner: "GRELEASE", type: "multi-release", milestoneIndex: "0" },
      TOKEN,
    ],
  },
  {
    operation: "disputeMilestone",
    invoke: () => escrow.disputeMilestone("C1", "0", "GSIGNER", TOKEN),
    apiMock: mocks.api.buildDisputeMilestone,
    args: () => [
      { contractId: "C1", milestoneIndex: "0", signer: "GSIGNER", type: "multi-release" },
      TOKEN,
    ],
  },
  {
    operation: "sendTransaction",
    invoke: () => escrow.sendTransaction("SIGNED_XDR", TOKEN),
    apiMock: mocks.api.submitSignedTransaction,
    args: () => ["SIGNED_XDR", TOKEN],
  },
] as const

describe("escrow service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(writeCases)("routes $operation to the Nest backend", async (testCase) => {
    testCase.apiMock.mockResolvedValue({ success: true, data: {} })

    const result = await testCase.invoke()

    expect(testCase.apiMock).toHaveBeenCalledWith(...testCase.args())
    expect(result).toMatchObject({ success: true })
    expect(mocks.emitTelemetry).toHaveBeenCalledOnce()
    expect(mocks.emitTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ operation: testCase.operation, outcome: "success" }),
    )
  })

  it.each(writeCases)("refuses $operation without a session", async (testCase) => {
    const unauthenticated = {
      createAgreement: () => escrow.createAgreement(payload),
      fundEscrow: () => escrow.fundEscrow("C1", "GSIGNER", 50, "multi-release"),
      approveMilestone: () => escrow.approveMilestone("C1", "0", "GAPPROVER", "multi-release"),
      changeMilestoneStatus: () =>
        escrow.changeMilestoneStatus("C1", "0", "e", "completed", "GPROVIDER", "multi-release"),
      releaseFunds: () => escrow.releaseFunds("C1", "GRELEASE", "multi-release", "0"),
      disputeMilestone: () => escrow.disputeMilestone("C1", "0", "GSIGNER"),
      sendTransaction: () => escrow.sendTransaction("SIGNED_XDR"),
    }[testCase.operation]

    const result = await unauthenticated()

    expect(result).toEqual({
      success: false,
      error: "Escrow writes require an authenticated wallet session",
    })
    expect(testCase.apiMock).not.toHaveBeenCalled()
    // A refusal is not an attempt, so it must not land in the telemetry stream.
    expect(mocks.emitTelemetry).not.toHaveBeenCalled()
  })

  it("falls back to the stored session token when none is passed", async () => {
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => (key === "auth_token" ? "stored-token" : null) },
    })
    mocks.api.submitSignedTransaction.mockResolvedValue({ success: true, data: {} })

    await escrow.sendTransaction("SIGNED_XDR")

    expect(mocks.api.submitSignedTransaction).toHaveBeenCalledWith("SIGNED_XDR", "stored-token")
  })

  it("reads do not require a session", async () => {
    mocks.api.getEscrowsBySigner.mockResolvedValue({ success: true, data: [] })

    const result = await escrow.getEscrowsBySigner("GSIGNER")

    expect(mocks.api.getEscrowsBySigner).toHaveBeenCalledWith("GSIGNER", undefined)
    expect(result).toMatchObject({ success: true })
    expect(mocks.emitTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "getEscrowsBySigner", outcome: "success" }),
    )
  })

  it("passes by-role params straight through", async () => {
    mocks.api.getEscrowsByRole.mockResolvedValue({ success: true, data: [] })
    const params = { address: "GADDR", role: "service_provider" } as const

    await escrow.getEscrowsByRole(params, TOKEN)

    expect(mocks.api.getEscrowsByRole).toHaveBeenCalledWith(params, TOKEN)
  })

  it("turns a thrown error into a failed response and one failure record", async () => {
    mocks.api.buildFundEscrow.mockRejectedValue(new Error("network down"))

    const result = await escrow.fundEscrow("C1", "GSIGNER", 50, "multi-release", TOKEN)

    expect(result).toEqual({ success: false, error: "network down" })
    expect(mocks.emitTelemetry).toHaveBeenCalledOnce()
    expect(mocks.emitTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "fundEscrow",
        outcome: "failure",
        error: "network down",
      }),
    )
  })

  it("reports an unsuccessful response as a failure without throwing", async () => {
    mocks.api.buildReleaseFunds.mockResolvedValue({ success: false, error: "escrow not funded" })

    const result = await escrow.releaseFunds("C1", "GRELEASE", "multi-release", "0", TOKEN)

    expect(result).toMatchObject({ success: false, error: "escrow not funded" })
    expect(mocks.emitTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "failure", error: "escrow not funded" }),
    )
  })
})
