import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  uploadFileApi,
  downloadUrlApi,
  isAllowedFile,
  formatFileSize,
  FILE_ACCEPT,
  MAX_FILE_BYTES,
} from "./files"

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

/** A File without needing a DOM: only `name`, `type` and `size` are read. */
function file(name: string, type: string, size = 1024): File {
  const f = new File(["x"], name, { type })
  Object.defineProperty(f, "size", { value: size })
  return f
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("uploadFileApi", () => {
  it("sends multipart without forcing a Content-Type", async () => {
    // The browser must set it itself: a hand-written header has no boundary
    // and the request arrives unparseable.
    fetchMock.mockResolvedValue(
      jsonResponse({ file: { id: "f1", name: "a.png", contentType: "image/png", sizeBytes: 10 } }),
    )

    await uploadFileApi(
      file("a.png", "image/png"),
      { uploaderWallet: "GW", agreementId: "a1" },
      "jwt",
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBeInstanceOf(FormData)
    expect(init.headers).toEqual({ Authorization: "Bearer jwt" })
    expect(Object.keys(init.headers as object)).not.toContain("Content-Type")
  })

  it("carries the wallet and the agreement so the backend can scope the file", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ file: { id: "f1", name: "a.png", contentType: "image/png", sizeBytes: 10 } }),
    )

    await uploadFileApi(
      file("a.png", "image/png"),
      { uploaderWallet: "GW", agreementId: "a1" },
      "jwt",
    )

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData
    expect(body.get("uploader_wallet")).toBe("GW")
    expect(body.get("agreement_id")).toBe("a1")
    expect(body.get("file")).toBeInstanceOf(File)
  })

  it("omits the agreement when the upload is not scoped to one", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ file: { id: "f1", name: "a.png", contentType: "image/png", sizeBytes: 10 } }),
    )

    await uploadFileApi(file("a.png", "image/png"), { uploaderWallet: "GW" }, "jwt")

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData
    expect(body.has("agreement_id")).toBe(false)
  })

  it("surfaces the backend's reason, naming the file", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Files of type application/zip are not accepted" }, 415),
    )

    const result = await uploadFileApi(file("x.zip", "application/zip"), { uploaderWallet: "GW" })

    expect(result).toMatchObject({ success: false, status: 415 })
    expect(result.error).toMatch(/not accepted/)
  })

  it("does not throw when the network fails", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))

    await expect(
      uploadFileApi(file("a.png", "image/png"), { uploaderWallet: "GW" }),
    ).resolves.toMatchObject({ success: false, error: "offline" })
  })
})

describe("downloadUrlApi", () => {
  it("asks the backend for a link each time rather than building one", async () => {
    // The bucket is private and the link expires, so there is nothing to cache.
    fetchMock.mockResolvedValue(jsonResponse({ url: "https://signed/x", name: "a.png" }))

    const result = await downloadUrlApi("f1", "jwt")

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/files\/f1\/url$/)
    expect(result.data).toEqual({ url: "https://signed/x", name: "a.png" })
  })

  it("fails when the backend refuses, instead of returning a broken link", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Not a participant" }, 403))

    await expect(downloadUrlApi("f1", "jwt")).resolves.toMatchObject({
      success: false,
      status: 403,
    })
  })
})

describe("client-side limits", () => {
  it("accepts what the backend accepts", () => {
    expect(isAllowedFile(file("a.png", "image/png"))).toBe(true)
    expect(isAllowedFile(file("a.pdf", "application/pdf"))).toBe(true)
  })

  it("rejects archives and executables before they are uploaded", () => {
    for (const type of ["application/zip", "application/x-msdownload", "text/html"]) {
      expect(isAllowedFile(file("x", type))).toBe(false)
    }
  })

  it("offers the same list to the file picker", () => {
    expect(FILE_ACCEPT).toContain("image/png")
    expect(FILE_ACCEPT).not.toContain("application/zip")
  })

  it("formats sizes the way a person reads them", () => {
    expect(formatFileSize(512)).toBe("512 B")
    expect(formatFileSize(2048)).toBe("2 KB")
    expect(formatFileSize(MAX_FILE_BYTES)).toBe("10.0 MB")
  })
})
