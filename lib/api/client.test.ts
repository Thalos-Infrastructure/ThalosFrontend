import { afterEach, describe, expect, it, vi } from "vitest"
import { apiRequest } from "./client"

const fetchMock = vi.fn()

describe("apiRequest", () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it("returns data and sends the shared headers on success", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "agreement-1" }), { status: 200 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await apiRequest<{ id: string }>(
      "/agreements/agreement-1",
      { method: "GET", headers: { "X-Request-ID": "request-1" } },
      "token-1",
    )

    expect(result).toEqual({ success: true, data: { id: "agreement-1" }, status: 200 })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/agreements/agreement-1"),
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-1",
          "X-Request-ID": "request-1",
        },
      }),
    )
  })

  it("uses the backend message or error for failed JSON responses", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Agreement not found" }), { status: 404 }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(apiRequest("/agreements/missing")).resolves.toEqual({
      success: false,
      error: "Agreement not found",
      status: 404,
      errorBody: { message: "Agreement not found" },
    })
  })

  it("returns the default error for failed non-JSON responses", async () => {
    fetchMock.mockResolvedValue(
      new Response("Service unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(apiRequest("/health")).resolves.toEqual({
      success: false,
      error: "Request failed",
      status: 503,
    })
  })

  it("joins validation messages from nested error details", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            details: ["wallet is required", { message: "amount must be positive" }],
          },
        }),
        { status: 400 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    await expect(apiRequest("/wallets")).resolves.toEqual({
      success: false,
      error: "wallet is required; amount must be positive",
      status: 400,
      errorBody: {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          details: ["wallet is required", { message: "amount must be positive" }],
        },
      },
    })
  })

  it("keeps the error body, so a caller can read the structure behind the sentence", async () => {
    // Some refusals carry a machine-readable shape the UI needs — a missing
    // trustline names the addresses at fault, and only their owners can fix it.
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "One recipient cannot receive USDC yet.",
          code: "TRUSTLINE_MISSING",
          problems: [{ address: "GPAYEE", reason: "missing" }],
        }),
        { status: 400 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await apiRequest("/escrows/resolve-dispute", { method: "POST" })

    expect(result.error).toBe("One recipient cannot receive USDC yet.")
    expect(result.errorBody).toMatchObject({
      code: "TRUSTLINE_MISSING",
      problems: [{ address: "GPAYEE", reason: "missing" }],
    })
  })

  it("exposes the HTTP status so callers can distinguish 404 from other failures", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "nope" }), { status: 404 }))
    vi.stubGlobal("fetch", fetchMock)

    const result = await apiRequest("/profiles/handle/ghost")
    expect(result.success).toBe(false)
    expect(result.status).toBe(404)
  })
})
