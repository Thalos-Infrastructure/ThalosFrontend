import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emitEscrowMigrationTelemetry } from "./escrow-migration";

describe("escrow migration telemetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T12:34:56.000Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("serializes successful route decisions as one structured info record", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    emitEscrowMigrationTelemetry({
      operation: "approveMilestone",
      path: "nest",
      outcome: "success",
      durationMs: 42,
    });

    expect(info).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();
    expect(JSON.parse(info.mock.calls[0][0])).toEqual({
      event: "escrow_migration.route",
      schemaVersion: 1,
      timestamp: "2026-08-23T12:34:56.000Z",
      operation: "approveMilestone",
      path: "nest",
      outcome: "success",
      durationMs: 42,
    });
  });

  it("serializes failed route decisions as one structured debug record", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    emitEscrowMigrationTelemetry({
      operation: "releaseFunds",
      path: "trustless_work",
      outcome: "failure",
      durationMs: 17,
      error: "HTTP 503",
    });

    expect(info).not.toHaveBeenCalled();
    expect(debug).toHaveBeenCalledOnce();
    expect(JSON.parse(debug.mock.calls[0][0])).toEqual({
      event: "escrow_migration.route",
      schemaVersion: 1,
      timestamp: "2026-08-23T12:34:56.000Z",
      operation: "releaseFunds",
      path: "trustless_work",
      outcome: "failure",
      durationMs: 17,
      error: "HTTP 503",
    });
  });
});
