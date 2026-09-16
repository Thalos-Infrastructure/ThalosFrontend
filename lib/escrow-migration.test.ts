import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  flags: {
    getEscrowsBySigner: true,
    getEscrowsByRole: true,
    createAgreement: false,
    fundEscrow: false,
    approveMilestone: false,
    changeMilestoneStatus: false,
    releaseFunds: false,
    disputeMilestone: false,
    sendTransaction: false,
  },
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
  trustlessWork: {
    getEscrowsBySigner: vi.fn(),
    getEscrowsByRole: vi.fn(),
    createAgreement: vi.fn(),
    fundEscrow: vi.fn(),
    approveMilestone: vi.fn(),
    changeMilestoneStatus: vi.fn(),
    releaseFunds: vi.fn(),
    disputeMilestone: vi.fn(),
    sendTransaction: vi.fn(),
  },
  emitTelemetry: vi.fn(),
}))

vi.mock("@/lib/config", () => ({
  ESCROW_MIGRATION_FLAGS: mocks.flags,
}))

vi.mock("@/lib/api/escrow", () => mocks.api)

vi.mock("@/lib/telemetry/escrow-migration", () => ({
  emitEscrowMigrationTelemetry: mocks.emitTelemetry,
}))

vi.mock("@/services/trustlessworkService", () => mocks.trustlessWork)

import * as migration from "@/services/escrowMigration"

const token = "jwt"
const agreement = {
  title: "Website delivery",
  description: "Build and deliver the website",
  amount: "100",
  platformFee: "2",
  signer: "G-SIGNER",
  serviceType: "single-release" as const,
  roles: {
    approver: "G-APPROVER",
    serviceProvider: "G-PROVIDER",
    releaseSigner: "G-RELEASER",
    receiver: "G-RECEIVER",
  },
  milestones: [{ description: "Delivery", amount: "100", status: "pending" }],
  notifications: { notifyEmail: "", signerEmail: "" },
}

type Operation = keyof typeof mocks.flags
type RouteCase = {
  operation: Operation
  invoke: () => Promise<unknown>
  nestMock: ReturnType<typeof vi.fn>
  nestArgs: unknown[]
  trustlessWorkMock: ReturnType<typeof vi.fn>
  trustlessWorkArgs: unknown[]
}

const routeCases: RouteCase[] = [
  {
    operation: "getEscrowsBySigner",
    invoke: () => migration.getEscrowsBySigner("G-SIGNER", token),
    nestMock: mocks.api.getEscrowsBySigner,
    nestArgs: ["G-SIGNER", token],
    trustlessWorkMock: mocks.trustlessWork.getEscrowsBySigner,
    trustlessWorkArgs: ["G-SIGNER"],
  },
  {
    operation: "getEscrowsByRole",
    invoke: () =>
      migration.getEscrowsByRole(
        {
          address: "G-PROVIDER",
          role: "service_provider",
          status: "funded",
          type: "multi-release",
        },
        token,
      ),
    nestMock: mocks.api.getEscrowsByRole,
    nestArgs: [
      {
        address: "G-PROVIDER",
        role: "service_provider",
        status: "funded",
        type: "multi-release",
      },
      token,
    ],
    trustlessWorkMock: mocks.trustlessWork.getEscrowsByRole,
    trustlessWorkArgs: [
      {
        roleAddress: "G-PROVIDER",
        role: "serviceProvider",
        status: "funded",
        type: "multi-release",
      },
    ],
  },
  {
    operation: "createAgreement",
    invoke: () => migration.createAgreement(agreement, token),
    nestMock: mocks.api.buildCreateEscrow,
    nestArgs: [
      {
        title: agreement.title,
        description: agreement.description,
        amount: agreement.amount,
        platformFee: agreement.platformFee,
        signer: agreement.signer,
        serviceType: agreement.serviceType,
        roles: agreement.roles,
        milestones: [{ description: "Delivery" }],
      },
      token,
    ],
    trustlessWorkMock: mocks.trustlessWork.createAgreement,
    trustlessWorkArgs: [agreement],
  },
  {
    operation: "fundEscrow",
    invoke: () => migration.fundEscrow("contract-1", "G-SIGNER", 25, "single-release", token),
    nestMock: mocks.api.buildFundEscrow,
    nestArgs: [
      {
        contractId: "contract-1",
        signer: "G-SIGNER",
        amount: 25,
        type: "single-release",
      },
      token,
    ],
    trustlessWorkMock: mocks.trustlessWork.fundEscrow,
    trustlessWorkArgs: ["contract-1", "G-SIGNER", 25, "single-release"],
  },
  {
    operation: "approveMilestone",
    invoke: () =>
      migration.approveMilestone("contract-1", "0", "G-APPROVER", "multi-release", token),
    nestMock: mocks.api.buildApproveMilestone,
    nestArgs: [
      {
        contractId: "contract-1",
        milestoneIndex: "0",
        approver: "G-APPROVER",
        type: "multi-release",
      },
      token,
    ],
    trustlessWorkMock: mocks.trustlessWork.approveMilestone,
    trustlessWorkArgs: ["contract-1", "0", "G-APPROVER", "multi-release"],
  },
  {
    operation: "changeMilestoneStatus",
    invoke: () =>
      migration.changeMilestoneStatus(
        "contract-1",
        "0",
        "ipfs://evidence",
        "completed",
        "G-PROVIDER",
        "multi-release",
        token,
      ),
    nestMock: mocks.api.buildChangeMilestoneStatus,
    nestArgs: [
      {
        contractId: "contract-1",
        milestoneIndex: "0",
        newEvidence: "ipfs://evidence",
        newStatus: "completed",
        serviceProvider: "G-PROVIDER",
        type: "multi-release",
      },
      token,
    ],
    trustlessWorkMock: mocks.trustlessWork.changeMilestoneStatus,
    trustlessWorkArgs: [
      "contract-1",
      "0",
      "ipfs://evidence",
      "completed",
      "G-PROVIDER",
      "multi-release",
    ],
  },
  {
    operation: "releaseFunds",
    invoke: () => migration.releaseFunds("contract-1", "G-RELEASER", "multi-release", "0", token),
    nestMock: mocks.api.buildReleaseFunds,
    nestArgs: [
      {
        contractId: "contract-1",
        releaseSigner: "G-RELEASER",
        type: "multi-release",
        milestoneIndex: "0",
      },
      token,
    ],
    trustlessWorkMock: mocks.trustlessWork.releaseFunds,
    trustlessWorkArgs: ["contract-1", "G-RELEASER", "multi-release", "0"],
  },
  {
    operation: "disputeMilestone",
    invoke: () => migration.disputeMilestone("contract-1", "0", "G-SIGNER", token),
    nestMock: mocks.api.buildDisputeMilestone,
    nestArgs: [
      {
        contractId: "contract-1",
        milestoneIndex: "0",
        signer: "G-SIGNER",
        type: "multi-release",
      },
      token,
    ],
    trustlessWorkMock: mocks.trustlessWork.disputeMilestone,
    trustlessWorkArgs: ["contract-1", "0", "G-SIGNER"],
  },
  {
    operation: "sendTransaction",
    invoke: () => migration.sendTransaction("signed-xdr", token),
    nestMock: mocks.api.submitSignedTransaction,
    nestArgs: ["signed-xdr", token],
    trustlessWorkMock: mocks.trustlessWork.sendTransaction,
    trustlessWorkArgs: ["signed-xdr"],
  },
]

describe("escrow migration routing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const operation of Object.keys(mocks.flags) as Operation[]) {
      mocks.flags[operation] = false
    }
  })

  it.each(routeCases)(
    "routes $operation to Trustless Work when its flag is OFF",
    async ({ operation, invoke, nestMock, trustlessWorkMock, trustlessWorkArgs }) => {
      trustlessWorkMock.mockResolvedValue({ success: true, data: {} })

      const result = await invoke()

      expect(trustlessWorkMock).toHaveBeenCalledWith(...trustlessWorkArgs)
      expect(nestMock).not.toHaveBeenCalled()
      expect(result).toMatchObject({ success: true, source: "original" })
      expect(mocks.emitTelemetry).toHaveBeenCalledOnce()
      expect(mocks.emitTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          operation,
          path: "trustless_work",
          outcome: "success",
        }),
      )
    },
  )

  it.each(routeCases)(
    "routes $operation to Nest when its flag is ON",
    async ({ operation, invoke, nestMock, nestArgs, trustlessWorkMock }) => {
      mocks.flags[operation] = true
      nestMock.mockResolvedValue({ success: true, data: {} })

      const result = await invoke()

      expect(nestMock).toHaveBeenCalledWith(...nestArgs)
      expect(trustlessWorkMock).not.toHaveBeenCalled()
      expect(result).toMatchObject({ success: true, source: "backend" })
      expect(mocks.emitTelemetry).toHaveBeenCalledOnce()
      expect(mocks.emitTelemetry).toHaveBeenCalledWith(
        expect.objectContaining({
          operation,
          path: "nest",
          outcome: "success",
        }),
      )
    },
  )

  it.each([
    { enabled: false, path: "trustless_work", source: "original" },
    { enabled: true, path: "nest", source: "backend" },
  ])("emits failure telemetry for the $path path", async ({ enabled, path, source }) => {
    mocks.flags.fundEscrow = enabled
    const selectedMock = enabled ? mocks.api.buildFundEscrow : mocks.trustlessWork.fundEscrow
    selectedMock.mockResolvedValue({ success: false, error: "route unavailable" })

    const result = await migration.fundEscrow("contract-1", "G-SIGNER", 25, "single-release", token)

    expect(result).toMatchObject({
      success: false,
      error: "route unavailable",
      source,
    })
    expect(mocks.emitTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "fundEscrow",
        path,
        outcome: "failure",
        error: "route unavailable",
      }),
    )
  })
})
