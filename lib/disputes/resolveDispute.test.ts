import { describe, it, expect, vi, beforeEach } from "vitest"
import type { EscrowSnapshot } from "@/lib/api/escrow"

const buildResolveDispute = vi.fn()
const getEscrowByContractId = vi.fn()
const sendTransaction = vi.fn()
const signEscrowOperation = vi.fn()
const persistResolution = vi.fn()

vi.mock("@/services/escrowService", () => ({
  resolveDispute: (...args: unknown[]) => buildResolveDispute(...args),
  getEscrowByContractId: (...args: unknown[]) => getEscrowByContractId(...args),
  sendTransaction: (...args: unknown[]) => sendTransaction(...args),
}))

vi.mock("@/lib/signing", () => ({
  signEscrowOperation: (...args: unknown[]) => signEscrowOperation(...args),
}))

vi.mock("@/lib/api/disputes", () => ({
  resolveDispute: (...args: unknown[]) => persistResolution(...args),
}))

// A static import is fine here: `vi.mock` calls are hoisted above it.
import { resolveDisputeOnChain, allocationsFor, readTrustlineProblems } from "./resolveDispute"

const APPROVER = "GAPPROVER00000000000000000000000000000000000000000000000"
const PROVIDER = "GPROVIDER00000000000000000000000000000000000000000000000"
const RESOLVER = "GRESOLVER00000000000000000000000000000000000000000000000"

const escrow = (overrides: Partial<EscrowSnapshot> = {}): EscrowSnapshot => ({
  contractId: "C1",
  type: "single-release",
  amount: 100,
  balance: 15,
  roles: { approver: APPROVER, serviceProvider: PROVIDER, disputeResolver: RESOLVER },
  flags: { disputed: true, released: false, resolved: false },
  milestones: [],
  trustline: { address: "GISSUER", symbol: "USDC" },
  ...overrides,
})

const params = (overrides: Record<string, unknown> = {}) => ({
  disputeId: "d1",
  contractId: "C1",
  escrow: escrow(),
  payerPercentage: 60,
  resolutionNotes: "split 60/40",
  walletAddress: RESOLVER,
  token: "jwt",
  // Poll fast: the production window is 10 tries two seconds apart, and
  // waiting it out here would only prove that setTimeout works.
  confirm: { attempts: 3, intervalMs: 1 },
  ...overrides,
})

/** Submitted and already reported settled by the indexer. */
const settled = () =>
  getEscrowByContractId.mockResolvedValue({
    success: true,
    data: escrow({ flags: { disputed: false, released: false, resolved: true } }),
  })

beforeEach(() => {
  vi.clearAllMocks()
  buildResolveDispute.mockResolvedValue({ success: true, data: { unsignedTransaction: "xdr" } })
  signEscrowOperation.mockResolvedValue({ signedTxXdr: "signed" })
  sendTransaction.mockResolvedValue({ success: true })
  persistResolution.mockResolvedValue({ success: true })
  settled()
})

describe("resolveDisputeOnChain — the order the steps happen in", () => {
  it("settles on-chain before it records anything", async () => {
    // The whole point: the database write used to be the only thing that
    // happened, and it claimed a resolution the chain never saw.
    const order: string[] = []
    buildResolveDispute.mockImplementation(() => {
      order.push("build")
      return Promise.resolve({ success: true, data: { unsignedTransaction: "xdr" } })
    })
    signEscrowOperation.mockImplementation(() => {
      order.push("sign")
      return Promise.resolve({ signedTxXdr: "signed" })
    })
    sendTransaction.mockImplementation(() => {
      order.push("submit")
      return Promise.resolve({ success: true })
    })
    persistResolution.mockImplementation(() => {
      order.push("persist")
      return Promise.resolve({ success: true })
    })

    const result = await resolveDisputeOnChain(params())

    expect(result.success).toBe(true)
    expect(order).toEqual(["build", "sign", "submit", "persist"])
  })

  it("sends percentages, and the escrow's own role addresses", async () => {
    await resolveDisputeOnChain(params())

    expect(buildResolveDispute).toHaveBeenCalledWith(
      {
        contractId: "C1",
        type: "single-release",
        disputeResolver: RESOLVER,
        allocations: [
          { address: APPROVER, percentage: 60 },
          { address: PROVIDER, percentage: 40 },
        ],
      },
      "jwt",
    )
  })

  it("names the milestone on a multi-release escrow", async () => {
    await resolveDisputeOnChain(
      params({ escrow: escrow({ type: "multi-release" }), milestoneIndex: "2" }),
    )

    expect(buildResolveDispute).toHaveBeenCalledWith(
      expect.objectContaining({ milestoneIndex: "2", type: "multi-release" }),
      "jwt",
    )
  })

  it("gives the signer the escrow roles, so a wrong wallet is refused before the popup", async () => {
    await resolveDisputeOnChain(params())

    expect(signEscrowOperation).toHaveBeenCalledWith(
      expect.objectContaining({ operation: "resolve", roles: escrow().roles, address: RESOLVER }),
    )
  })

  it("records the split that was actually distributed", async () => {
    await resolveDisputeOnChain(params())

    expect(persistResolution).toHaveBeenCalledWith(
      "d1",
      {
        resolved_by: RESOLVER,
        payer_percentage: 60,
        payee_percentage: 40,
        resolution_notes: "split 60/40",
      },
      "jwt",
    )
  })
})

describe("resolveDisputeOnChain — nothing is recorded that did not happen", () => {
  it("records nothing when the build is refused", async () => {
    buildResolveDispute.mockResolvedValue({ success: false, error: "escrow is not in dispute" })

    const result = await resolveDisputeOnChain(params())

    expect(result.success).toBe(false)
    expect(result.failure?.message).toBe("escrow is not in dispute")
    expect(signEscrowOperation).not.toHaveBeenCalled()
    expect(persistResolution).not.toHaveBeenCalled()
  })

  it("records nothing when the resolver rejects the signature", async () => {
    signEscrowOperation.mockRejectedValue(new Error("User declined the request"))

    const result = await resolveDisputeOnChain(params())

    expect(result.success).toBe(false)
    expect(result.failure?.message).toBe("User declined the request")
    expect(sendTransaction).not.toHaveBeenCalled()
    expect(persistResolution).not.toHaveBeenCalled()
  })

  it("records nothing when the submit fails", async () => {
    sendTransaction.mockResolvedValue({ success: false, error: "tx failed" })

    const result = await resolveDisputeOnChain(params())

    expect(result.success).toBe(false)
    expect(persistResolution).not.toHaveBeenCalled()
  })

  it("reports pending, not success, when the chain never confirms", async () => {
    // Submitting is not settling. Writing `resolved` off the back of a submit
    // is the same mistake this flow exists to undo.
    getEscrowByContractId.mockResolvedValue({ success: true, data: escrow() })

    const result = await resolveDisputeOnChain(params())

    expect(result).toMatchObject({ success: false, pendingConfirmation: true })
    expect(persistResolution).not.toHaveBeenCalled()
  })

  it("stops waiting as soon as the escrow is reported settled", async () => {
    getEscrowByContractId
      .mockResolvedValueOnce({ success: true, data: escrow() })
      .mockResolvedValueOnce({
        success: true,
        data: escrow({ flags: { disputed: false, released: false, resolved: true } }),
      })

    const result = await resolveDisputeOnChain(params())

    expect(result.success).toBe(true)
    expect(getEscrowByContractId).toHaveBeenCalledTimes(2)
  })

  it("still reports success when the funds moved but Thalos could not record it", async () => {
    // Telling the resolver to try again would send them at a chain that now
    // refuses it as already resolved.
    persistResolution.mockResolvedValue({ success: false, error: "database unreachable" })

    const result = await resolveDisputeOnChain(params())

    expect(result.success).toBe(true)
    expect(result.failure?.message).toMatch(/distributed on-chain/)
  })

  it("refuses before building when the escrow has no payee address", async () => {
    const result = await resolveDisputeOnChain(
      params({ escrow: escrow({ roles: { approver: APPROVER, disputeResolver: RESOLVER } }) }),
    )

    expect(result.success).toBe(false)
    expect(result.failure?.message).toMatch(/nowhere to send/)
    expect(buildResolveDispute).not.toHaveBeenCalled()
  })

  it("refuses without a wallet or a session", async () => {
    for (const missing of [{ walletAddress: null }, { token: null }]) {
      const result = await resolveDisputeOnChain(params(missing))
      expect(result.success).toBe(false)
      expect(buildResolveDispute).not.toHaveBeenCalled()
    }
  })
})

describe("allocationsFor", () => {
  it("gives the payee whatever the payer does not take", () => {
    expect(allocationsFor(escrow(), 70)).toEqual([
      { address: APPROVER, percentage: 70 },
      { address: PROVIDER, percentage: 30 },
    ])
  })

  it("falls back to the receiver when there is no service provider", () => {
    const withReceiver = escrow({ roles: { approver: APPROVER, receiver: PROVIDER } })

    expect(allocationsFor(withReceiver, 50)[1].address).toBe(PROVIDER)
  })

  it("covers the whole range, including giving one side everything", () => {
    for (const percentage of [0, 50, 100]) {
      const [payer, payee] = allocationsFor(escrow(), percentage)
      expect(payer.percentage + payee.percentage).toBe(100)
    }
  })
})

describe("readTrustlineProblems", () => {
  it("reads the addresses that cannot receive", () => {
    const problems = readTrustlineProblems({
      code: "TRUSTLINE_MISSING",
      problems: [
        { address: PROVIDER, reason: "missing" },
        { address: APPROVER, reason: "no-account" },
      ],
    })

    expect(problems).toEqual([
      { address: PROVIDER, reason: "missing" },
      { address: APPROVER, reason: "no-account" },
    ])
  })

  it("ignores any other error body", () => {
    for (const body of [
      undefined,
      "boom",
      { message: "something else" },
      { code: "INVALID_DISTRIBUTION" },
      { code: "TRUSTLINE_MISSING" },
      { code: "TRUSTLINE_MISSING", problems: [] },
      { code: "TRUSTLINE_MISSING", problems: [{ reason: "missing" }] },
    ]) {
      expect(readTrustlineProblems(body)).toBeUndefined()
    }
  })

  it("treats an unrecognised reason as a missing trustline", () => {
    // The two differ in what the holder has to do; the safer default is the one
    // that tells them to add the trustline.
    const problems = readTrustlineProblems({
      code: "TRUSTLINE_MISSING",
      problems: [{ address: PROVIDER, reason: "something-new" }],
    })

    expect(problems).toEqual([{ address: PROVIDER, reason: "missing" }])
  })
})
