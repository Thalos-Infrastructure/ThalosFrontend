export type EscrowOperation =
  | "getEscrowsBySigner"
  | "getEscrowsByRole"
  | "createAgreement"
  | "fundEscrow"
  | "approveMilestone"
  | "changeMilestoneStatus"
  | "releaseFunds"
  | "disputeMilestone"
  | "sendTransaction"

export type EscrowOutcome = "success" | "failure"

export interface EscrowTelemetryEvent {
  event: "escrow.operation"
  /**
   * 2 dropped the `path` field. Schema 1 recorded whether a call went to the
   * Nest backend or straight to Trustless Work from the browser; the direct
   * path no longer exists, so the field could only ever say "nest".
   */
  schemaVersion: 2
  operation: EscrowOperation
  outcome: EscrowOutcome
  durationMs: number
  timestamp: string
  error?: string
}

/**
 * A single structured sink for escrow telemetry. Keeping transport details here
 * makes it straightforward to replace the console transport with an
 * observability SDK without touching the service.
 *
 * Records never carry request payloads, wallet addresses, JWTs, XDRs or API
 * keys.
 */
export function emitEscrowTelemetry(
  event: Omit<EscrowTelemetryEvent, "event" | "schemaVersion" | "timestamp">,
): void {
  const record: EscrowTelemetryEvent = {
    event: "escrow.operation",
    schemaVersion: 2,
    timestamp: new Date().toISOString(),
    ...event,
  }

  const serialized = JSON.stringify(record)
  if (record.outcome === "failure") {
    globalThis.console.error(serialized)
  } else {
    globalThis.console.info(serialized)
  }
}
