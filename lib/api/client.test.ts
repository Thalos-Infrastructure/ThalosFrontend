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

    expect(result).toEqual({ success: true, data: { id: "agreement-1" } })
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
    })
  })
})
