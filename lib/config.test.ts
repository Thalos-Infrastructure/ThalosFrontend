/**
 * La red se decide en un unico sitio (config.ts). Lo que fijan estos tests no es el
 * valor concreto de cada constante, sino la invariante que importa: passphrase,
 * Horizon y explorer apuntan SIEMPRE a la misma red.
 *
 * El bug que motivo esto era exactamente esa incoherencia: STELLAR_EXPLORER_BASE_URL
 * no ramificaba, asi que con NEXT_PUBLIC_STELLAR_NETWORK=MAINNET se obtenia Horizon
 * de mainnet y passphrase de mainnet, pero enlaces de explorer a testnet.
 */

import { describe, it, expect, vi } from "vitest"

const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015"
const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015"

async function loadConfig(env: Record<string, string | undefined>) {
  vi.resetModules()

  const saved: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    // import() dinamico y no estatico: necesitamos releer el modulo con cada entorno.
    return await import("./config")
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

describe("configuracion de red Stellar", () => {
  it("con MAINNET, las tres constantes apuntan a mainnet", async () => {
    const config = await loadConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "MAINNET" })

    expect(config.STELLAR_NETWORK).toBe("MAINNET")
    expect(config.STELLAR_NETWORK_PASSPHRASE).toBe(MAINNET_PASSPHRASE)
    expect(config.HORIZON_URL).toBe("https://horizon.stellar.org")
    expect(config.STELLAR_EXPLORER_BASE_URL).toContain("/public/")
  })

  it("con TESTNET, las tres constantes apuntan a testnet", async () => {
    const config = await loadConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "TESTNET" })

    expect(config.STELLAR_NETWORK).toBe("TESTNET")
    expect(config.STELLAR_NETWORK_PASSPHRASE).toBe(TESTNET_PASSPHRASE)
    expect(config.HORIZON_URL).toBe("https://horizon-testnet.stellar.org")
    expect(config.STELLAR_EXPLORER_BASE_URL).toContain("/testnet/")
  })

  it("sin variable de entorno, cae en testnet", async () => {
    const config = await loadConfig({ NEXT_PUBLIC_STELLAR_NETWORK: undefined })

    expect(config.STELLAR_NETWORK).toBe("TESTNET")
    expect(config.STELLAR_NETWORK_PASSPHRASE).toBe(TESTNET_PASSPHRASE)
  })

  it("un valor desconocido cae en testnet de forma coherente, no a medias", async () => {
    const config = await loadConfig({ NEXT_PUBLIC_STELLAR_NETWORK: "FUTURENET" })

    expect(config.STELLAR_NETWORK).toBe("TESTNET")
    expect(config.STELLAR_NETWORK_PASSPHRASE).toBe(TESTNET_PASSPHRASE)
    expect(config.HORIZON_URL).toBe("https://horizon-testnet.stellar.org")
    expect(config.STELLAR_EXPLORER_BASE_URL).toContain("/testnet/")
  })

  it("NEXT_PUBLIC_STELLAR_EXPLORER_URL sobreescribe el explorer por defecto", async () => {
    const config = await loadConfig({
      NEXT_PUBLIC_STELLAR_NETWORK: "TESTNET",
      NEXT_PUBLIC_STELLAR_EXPLORER_URL: "https://example.test/explorer/",
    })

    expect(config.STELLAR_EXPLORER_BASE_URL).toBe("https://example.test/explorer/")
  })
})

const ESCROW_FLAG_NAMES = [
  "NEXT_PUBLIC_ESCROW_MIGRATION_GET_ESCROWS_BY_SIGNER_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_GET_ESCROWS_BY_ROLE_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_CREATE_AGREEMENT_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_FUND_ESCROW_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_APPROVE_MILESTONE_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_CHANGE_MILESTONE_STATUS_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_RELEASE_FUNDS_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_DISPUTE_MILESTONE_USE_NEST",
  "NEXT_PUBLIC_ESCROW_MIGRATION_SEND_TRANSACTION_USE_NEST",
] as const

describe("escrow migration flag configuration", () => {
  it("uses Nest for reads and Trustless Work for writes when flags are unset", async () => {
    const config = await loadConfig(Object.fromEntries(
      ESCROW_FLAG_NAMES.map((name) => [name, undefined]),
    ))

    expect(config.ESCROW_MIGRATION_FLAGS).toEqual({
      getEscrowsBySigner: true,
      getEscrowsByRole: true,
      createAgreement: false,
      fundEscrow: false,
      approveMilestone: false,
      changeMilestoneStatus: false,
      releaseFunds: false,
      disputeMilestone: false,
      sendTransaction: false,
    })
  })

  it("honors explicit true and false values per operation", async () => {
    const config = await loadConfig({
      NEXT_PUBLIC_ESCROW_MIGRATION_GET_ESCROWS_BY_SIGNER_USE_NEST: "false",
      NEXT_PUBLIC_ESCROW_MIGRATION_FUND_ESCROW_USE_NEST: "true",
    })

    expect(config.ESCROW_MIGRATION_FLAGS.getEscrowsBySigner).toBe(false)
    expect(config.ESCROW_MIGRATION_FLAGS.fundEscrow).toBe(true)
  })
})
