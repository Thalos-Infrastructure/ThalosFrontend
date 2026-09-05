import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import { apiRequest } from "../client"

describe("apiRequest contract", () => {
  afterEach(() => vi.restoreAllMocks())

  it("returns { success: true, data } on 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ wallets: [] }), { status: 200 }),
    )
    const res = await apiRequest("/wallets", { method: "GET" }, "tok")
    expect(res.success).toBe(true)
    expect(res.data).toEqual({ wallets: [] })
    expect(res.error).toBeUndefined()
  })

  it("returns { success: false, error } on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "not found" }), { status: 404 }),
    )
    const res = await apiRequest("/nope")
    expect(res.success).toBe(false)
    expect(res.error).toBe("not found")
    expect(res.data).toBeUndefined()
  })

  it("falls back to error field when message is absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "forbidden" }), { status: 403 }),
    )
    const res = await apiRequest("/secret")
    expect(res.success).toBe(false)
    expect(res.error).toBe("forbidden")
  })

  it("sends Authorization header when token is provided", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    await apiRequest("/test", { method: "GET" }, "my-jwt")
    const init = spy.mock.calls[0][1] as RequestInit
    expect(init.headers).toEqual(expect.objectContaining({ Authorization: "Bearer my-jwt" }))
  })

  it("omits Authorization header when token is absent", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    await apiRequest("/test", { method: "GET" })
    const init = spy.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it("returns network error on fetch throw", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new TypeError("Failed to fetch"))
    const res = await apiRequest("/timeout")
    expect(res.success).toBe(false)
    expect(res.error).toBe("Failed to fetch")
  })
})
