import type { EscrowMigrationOperation } from "@/lib/config";

export type EscrowMigrationPath = "nest" | "trustless_work";
export type EscrowMigrationOutcome = "success" | "failure";

export interface EscrowMigrationTelemetryEvent {
  event: "escrow_migration.route";
  schemaVersion: 1;
  operation: EscrowMigrationOperation;
  path: EscrowMigrationPath;
  outcome: EscrowMigrationOutcome;
  durationMs: number;
  timestamp: string;
  error?: string;
}

/**
 * A single structured sink for escrow migration telemetry. Keeping transport
 * details here makes it straightforward to replace the console transport with
 * an observability SDK without touching routing code.
 */
export function emitEscrowMigrationTelemetry(
  event: Omit<EscrowMigrationTelemetryEvent, "event" | "schemaVersion" | "timestamp">,
): void {
  const record: EscrowMigrationTelemetryEvent = {
    event: "escrow_migration.route",
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    ...event,
  };

  const serialized = JSON.stringify(record);
  if (record.outcome === "failure") {
    globalThis.console.error(serialized);
  } else {
    globalThis.console.info(serialized);
  }
}
