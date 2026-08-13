/**
 * Guarda el entregable de #107: una sola version del Stellar SDK en el arbol.
 *
 * No basta con mirar package.json. El Kit depende de @trezor/connect, que arrastra
 * @trezor/blockchain-link, que declara su propio @stellar/stellar-sdk. Ese worker de
 * Trezor no se ejecuta aqui (el modulo no esta en defaultModules()), pero si cuenta
 * en el lockfile. Por eso el test lee el lockfile y no las dependencias declaradas:
 * es lo unico que refleja lo que de verdad se instala.
 *
 * Si este test falla, lo mas probable es que falten (o se hayan quedado cortos) los
 * `overrides` de pnpm-workspace.yaml.
 */

import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const LOCKFILE = join(__dirname, "..", "..", "pnpm-lock.yaml")

/** Devuelve las versiones distintas con las que un paquete aparece en el lockfile. */
function resolvedVersions(packageName: string): string[] {
  const lockfile = readFileSync(LOCKFILE, "utf8")
  // Las claves del lockfile son lineas tipo:  '@stellar/stellar-sdk@16.1.0':
  const entry = new RegExp(`^ {2}'?${packageName}@([^'()@]+)'?[('):]`, "gm")

  const versions = new Set<string>()
  for (const match of lockfile.matchAll(entry)) {
    versions.add(match[1])
  }
  return [...versions].sort()
}

describe("resolucion del Stellar SDK", () => {
  it("resuelve una unica version de @stellar/stellar-sdk", () => {
    expect(resolvedVersions("@stellar/stellar-sdk")).toHaveLength(1)
  })

  it("resuelve una unica version de @stellar/freighter-api", () => {
    expect(resolvedVersions("@stellar/freighter-api")).toHaveLength(1)
  })

  it("no queda rastro del paquete legacy stellar-sdk", () => {
    // El alias deprecado que se movio a @stellar/stellar-sdk.
    expect(resolvedVersions("stellar-sdk")).toHaveLength(0)
  })
})
