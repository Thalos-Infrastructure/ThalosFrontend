import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  escrowService: {
    fundEscrow: vi.fn(),
    approveMilestone: vi.fn(),
    changeMilestoneStatus: vi.fn(),
    releaseFunds: vi.fn(),
    disputeMilestone: vi.fn(),
  },
  api: {
    buildCreateEscrow: vi.fn(),
    submitSignedTransaction: vi.fn(),
  },
  signEscrowOperation: vi.fn(),
}))

vi.mock("@/services/escrowService", () => mocks.escrowService)
vi.mock("@/lib/api/escrow", () => mocks.api)
vi.mock("@/lib/signing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/signing")>()
  return { ...actual, signEscrowOperation: mocks.signEscrowOperation }
})

import { changeMilestoneStatusAgreement, fundAndSignEscrow } from "./agreementActions"

const WALLET = "GWALLET"
const PROVIDER = "GPROVIDER"
const TOKEN = "jwt-token"
const UNSIGNED = { unsignedTransaction: "AAAA_UNSIGNED" }

/** The setters the dashboard passes in, captured so assertions can read them. */
function harness() {
  const errors: (string | null)[] = []
  const statuses: string[] = []
  return {
    errors,
    statuses,
    setError: (msg: string | null) => errors.push(msg),
    onStatus: (status: string) => statuses.push(status),
    lastError: () => errors.filter(Boolean).at(-1) ?? null,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.signEscrowOperation.mockResolvedValue({ signedTxXdr: "AAAA_SIGNED" })
  mocks.api.submitSignedTransaction.mockResolvedValue({ success: true, data: {} })
})

describe("fundAndSignEscrow", () => {
  it("builds, signs and submits in that order", async () => {
    mocks.escrowService.fundEscrow.mockResolvedValue({ success: true, data: UNSIGNED })
    const h = harness()

    await fundAndSignEscrow({
      contractId: "C1",
      amount: "100",
      walletAddress: WALLET,
      serviceType: "single-release",
      token: TOKEN,
      openWalletModal: vi.fn(),
      setFunding: vi.fn(),
      setError: h.setError,
      setSuccess: vi.fn(),
      onStatus: h.onStatus as never,
    })

    expect(mocks.escrowService.fundEscrow).toHaveBeenCalledWith(
      "C1",
      WALLET,
      100,
      "single-release",
      TOKEN,
    )
    expect(mocks.signEscrowOperation).toHaveBeenCalledWith(
      expect.objectContaining({ xdr: UNSIGNED.unsignedTransaction, operation: "fund" }),
    )
    expect(mocks.api.submitSignedTransaction).toHaveBeenCalledWith("AAAA_SIGNED", TOKEN)
    expect(h.lastError()).toBeNull()
    expect(h.statuses).toContain("confirmed")
  })

  it("never asks for a signature when the build failed", async () => {
    // The whole point of building first: a rejected build must not reach the
    // wallet, or the user signs something that cannot succeed.
    mocks.escrowService.fundEscrow.mockResolvedValue({ success: false, error: "escrow not found" })
    const h = harness()

    await fundAndSignEscrow({
      contractId: "C1",
      amount: "100",
      walletAddress: WALLET,
      token: TOKEN,
      openWalletModal: vi.fn(),
      setFunding: vi.fn(),
      setError: h.setError,
      setSuccess: vi.fn(),
      onStatus: h.onStatus as never,
    })

    expect(mocks.signEscrowOperation).not.toHaveBeenCalled()
    expect(mocks.api.submitSignedTransaction).not.toHaveBeenCalled()
    expect(h.lastError()).toBe("escrow not found")
    expect(h.statuses).toContain("error")
  })

  it("reports a failure instead of throwing when there is no session", async () => {
    mocks.escrowService.fundEscrow.mockResolvedValue({ success: true, data: UNSIGNED })
    const h = harness()

    await fundAndSignEscrow({
      contractId: "C1",
      amount: "100",
      walletAddress: WALLET,
      token: null,
      openWalletModal: vi.fn(),
      setFunding: vi.fn(),
      setError: h.setError,
      setSuccess: vi.fn(),
      onStatus: h.onStatus as never,
    })

    expect(mocks.api.submitSignedTransaction).not.toHaveBeenCalled()
    expect(h.lastError()).toMatch(/sign in/i)
  })

  it("refuses without a wallet address and never calls the backend", async () => {
    const h = harness()

    await fundAndSignEscrow({
      contractId: "C1",
      amount: "100",
      walletAddress: null,
      token: TOKEN,
      openWalletModal: vi.fn(),
      setFunding: vi.fn(),
      setError: h.setError,
      setSuccess: vi.fn(),
      onStatus: h.onStatus as never,
    })

    expect(mocks.escrowService.fundEscrow).not.toHaveBeenCalled()
    expect(h.lastError()).toMatch(/wallet address is required/i)
  })

  it("clears the busy flag whether it succeeds or fails", async () => {
    const setFunding = vi.fn()
    mocks.escrowService.fundEscrow.mockRejectedValue(new Error("network down"))

    await fundAndSignEscrow({
      contractId: "C1",
      amount: "100",
      walletAddress: WALLET,
      token: TOKEN,
      openWalletModal: vi.fn(),
      setFunding,
      setError: vi.fn(),
      setSuccess: vi.fn(),
      onStatus: vi.fn(),
    })

    expect(setFunding).toHaveBeenNthCalledWith(1, true)
    expect(setFunding).toHaveBeenLastCalledWith(false)
  })
})

describe("changeMilestoneStatusAgreement", () => {
  const params = {
    contractId: "C1",
    milestoneIndex: "0",
    newEvidence: "https://evidence",
    newStatus: "completed",
    serviceProvider: PROVIDER,
    serviceType: "multi-release" as const,
    walletAddress: PROVIDER,
    token: TOKEN,
    openWalletModal: vi.fn(),
    setSubmitting: vi.fn(),
    setError: vi.fn(),
  }

  it("hands the service provider role to the signer for validation", async () => {
    // Signing refuses the operation when the wallet is not this role, so the
    // address has to reach it — otherwise validation silently passes and the
    // backend is the one that rejects.
    mocks.escrowService.changeMilestoneStatus.mockResolvedValue({ success: true, data: UNSIGNED })

    await changeMilestoneStatusAgreement({ ...params })

    expect(mocks.signEscrowOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "changeMilestoneStatus",
        roles: { serviceProvider: PROVIDER },
        address: PROVIDER,
      }),
    )
  })

  it("passes the evidence through to the backend unchanged", async () => {
    mocks.escrowService.changeMilestoneStatus.mockResolvedValue({ success: true, data: UNSIGNED })

    await changeMilestoneStatusAgreement({ ...params })

    expect(mocks.escrowService.changeMilestoneStatus).toHaveBeenCalledWith(
      "C1",
      "0",
      "https://evidence",
      "completed",
      PROVIDER,
      "multi-release",
      TOKEN,
    )
  })

  it("surfaces a signing refusal as an error and submits nothing", async () => {
    mocks.escrowService.changeMilestoneStatus.mockResolvedValue({ success: true, data: UNSIGNED })
    mocks.signEscrowOperation.mockRejectedValue(
      new Error("Your connected wallet is not the service provider of this escrow"),
    )
    const h = harness()

    await changeMilestoneStatusAgreement({ ...params, setError: h.setError })

    expect(mocks.api.submitSignedTransaction).not.toHaveBeenCalled()
    expect(h.lastError()).toMatch(/not the service provider/)
  })

  it("does not run onSuccess when submission fails", async () => {
    mocks.escrowService.changeMilestoneStatus.mockResolvedValue({ success: true, data: UNSIGNED })
    mocks.api.submitSignedTransaction.mockResolvedValue({ success: false, error: "tx rejected" })
    const onSuccess = vi.fn()
    const h = harness()

    await changeMilestoneStatusAgreement({ ...params, onSuccess, setError: h.setError })

    expect(onSuccess).not.toHaveBeenCalled()
    expect(h.lastError()).toBe("tx rejected")
  })

  it("errors when the build returns no XDR to sign", async () => {
    mocks.escrowService.changeMilestoneStatus.mockResolvedValue({ success: true, data: {} })
    const h = harness()

    await changeMilestoneStatusAgreement({ ...params, setError: h.setError })

    expect(mocks.signEscrowOperation).not.toHaveBeenCalled()
    expect(h.lastError()).toMatch(/no xdr/i)
  })
})
