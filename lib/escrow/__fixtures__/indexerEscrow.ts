/**
 * Trustless Work payloads, as Trustless Work returns them.
 *
 * Transcribed from the vendored skill's documented examples — see README.md in
 * this directory for what that is worth and how to replace them with captured
 * responses.
 *
 * Deliberately `unknown`: the parser's job is to find out what these are, so
 * typing them as our own shape would make the tests assert nothing.
 */

const APPROVER = "GGHI7890123456789012345678901234567890123"
const PROVIDER = "GDEF4567890123456789012345678901234567890"
const PLATFORM = "GPLT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const RESOLVER = "GJKL0123456789012345678901234567890123456"
const CONTRACT = "CHASVBD1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

export const ADDRESSES = { APPROVER, PROVIDER, PLATFORM, RESOLVER, CONTRACT }

/** A single-release escrow, deployed and not yet funded. */
export const singleReleaseUnfunded: unknown = {
  contractId: CONTRACT,
  engagementId: "project-123",
  title: "Website Development",
  description: "Build a responsive website with 3 pages",
  type: "single-release",
  roles: {
    approver: APPROVER,
    serviceProvider: PROVIDER,
    platformAddress: PLATFORM,
    releaseSigner: APPROVER,
    disputeResolver: RESOLVER,
    receiver: PROVIDER,
  },
  amount: 5000,
  platformFee: 100,
  milestones: [
    { description: "Design mockups", status: "pending", approved: false },
    { description: "Frontend development", status: "pending", approved: false },
  ],
  flags: { disputed: false, released: false, resolved: false },
  isActive: true,
  trustline: { address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  createdAt: "2026-09-26T10:00:00.000Z",
}

/**
 * The same escrow after funding, as the indexer reports it: `balance` present.
 */
export const singleReleaseFunded: unknown = {
  ...(singleReleaseUnfunded as Record<string, unknown>),
  balance: 5000,
  fundedBy: APPROVER,
}

/**
 * Funded, but the indexer omitted `balance`.
 *
 * `balance` is optional on `GetEscrowsFromIndexerResponse`, and reading its
 * absence as "not funded" is what made a funded escrow keep offering the Fund
 * button on every reload.
 */
export const fundedWithoutBalance: unknown = {
  ...(singleReleaseUnfunded as Record<string, unknown>),
  fundedBy: APPROVER,
}

/** Multi-release: amounts live on the milestones, one already approved. */
export const multiReleaseInProgress: unknown = {
  contractId: `${CONTRACT}-multi`,
  engagementId: "project-456",
  title: "Mobile App",
  type: "multi-release",
  roles: {
    approver: APPROVER,
    serviceProvider: PROVIDER,
    platformAddress: PLATFORM,
    releaseSigner: APPROVER,
    disputeResolver: RESOLVER,
    receiver: PROVIDER,
  },
  platformFee: 100,
  balance: 3000,
  fundedBy: APPROVER,
  milestones: [
    { description: "Phase 1", amount: 1000, status: "approved", flags: { approved: true } },
    { description: "Phase 2", amount: 2000, status: "pending", flags: { approved: false } },
  ],
  flags: { disputed: false, released: false, resolved: false },
  createdAt: "2026-09-26T11:00:00.000Z",
}

/** A disputed escrow: funds frozen until it is settled. */
export const disputed: unknown = {
  ...(singleReleaseFunded as Record<string, unknown>),
  contractId: `${CONTRACT}-disputed`,
  flags: { disputed: true, released: false, resolved: false },
  disputeStartedBy: PROVIDER,
}

/** Fully released. */
export const released: unknown = {
  ...(singleReleaseFunded as Record<string, unknown>),
  contractId: `${CONTRACT}-released`,
  milestones: [
    { description: "Design mockups", status: "released", approved: true },
    { description: "Frontend development", status: "released", approved: true },
  ],
  flags: { disputed: false, released: true, resolved: false },
}

/**
 * Roles the indexer has not resolved. Not hypothetical: the dashboards used to
 * fill these with "-", which is truthy, so role checks compared against it and
 * rejected the real party.
 */
export const rolesUnresolved: unknown = {
  ...(singleReleaseUnfunded as Record<string, unknown>),
  contractId: `${CONTRACT}-noroles`,
  roles: {},
}

/**
 * The shape the business dashboard assumed for months: parties at the escrow
 * root rather than under `roles`. Kept so a regression reads as a parse issue
 * instead of as an escrow nobody can act on.
 */
export const rolesAtRootLegacy: unknown = {
  contractId: `${CONTRACT}-legacy`,
  title: "Website Development",
  type: "single-release",
  amount: 5000,
  approver: APPROVER,
  serviceProvider: PROVIDER,
  receiver: PROVIDER,
  milestones: [{ description: "Design mockups", status: "pending" }],
}

export const escrowList: unknown = [singleReleaseFunded, multiReleaseInProgress]
