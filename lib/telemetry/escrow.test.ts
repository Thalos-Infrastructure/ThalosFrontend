import { afterEach, describe, expect, it, vi } from "vitest"

import { emitEscrowTelemetry } from "./escrow"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("escrow telemetry", () => {
  it("serializes a successful operation as one structured info record", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const error = vi.spyOn(console, "error").mockImplementation(() => {})

    emitEscrowTelemetry({ operation: "fundEscrow", outcome: "success", durationMs: 42 })

    expect(error).not.toHaveBeenCalled()
    expect(info).toHaveBeenCalledOnce()
    const record = JSON.parse(info.mock.calls[0][0] as string)
    expect(record).toMatchObject({
      event: "escrow.operation",
      schemaVersion: 2,
      operation: "fundEscrow",
      outcome: "success",
      durationMs: 42,
    })
    expect(typeof record.timestamp).toBe("string")
    expect(record).not.toHaveProperty("error")
    // The direct Trustless Work path is gone, so nothing records a route.
    expect(record).not.toHaveProperty("path")
  })

  it("serializes a failure as one structured error record carrying the message", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {})
    const error = vi.spyOn(console, "error").mockImplementation(() => {})

    emitEscrowTelemetry({
      operation: "releaseFunds",
      outcome: "failure",
      durationMs: 7,
      error: "escrow not funded",
    })

    expect(info).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledOnce()
    expect(JSON.parse(error.mock.calls[0][0] as string)).toMatchObject({
      event: "escrow.operation",
      schemaVersion: 2,
      operation: "releaseFunds",
      outcome: "failure",
      error: "escrow not funded",
    })
  })
})
