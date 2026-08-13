import { describe, it, expect } from "vitest";

/**
 * Real route tests for POST /api/ai/agreement-draft.
 *
 * Requires:
 * - OPENAI_API_KEY or valid OPENAI_BASE_URL + key
 * - server-side handler available at `app/api/ai/agreement-draft/route`
 */

const handlerModule = "../../../app/api/ai/agreement-draft/route";

describe("POST /api/ai/agreement-draft", () => {
  it("rejects requests with no prompt", async () => {
    const { POST } = await import(handlerModule);
    const req = {
      json: async () => ({ prompt: "", useCase: "" }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects prompts that exceed max length", async () => {
    const { POST } = await import(handlerModule);
    const req = {
      json: async () => ({ prompt: "A".repeat(5001), useCase: "" }),
    } as any;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when the OpenAI key is missing", async () => {
    const { POST } = await import(handlerModule);
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    const req = {
      json: async () => ({ prompt: "Simple freelance agreement", useCase: "" }),
    } as any;
    const res = await POST(req);
    process.env.OPENAI_API_KEY = originalKey;
    expect(res.status).toBe(500);
  });

  it("returns a structured AgreementDraft on success when backend is reachable", async () => {
    process.env.OPENAI_API_KEY ||= process.env.OPENAI_KEY || "test";
    const { POST } = await import(handlerModule);
    const req = {
      json: async () => ({
        prompt: "Pay $1200 for design ($400), build ($600), deploy ($200).",
        useCase: "",
      }),
    } as any;
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.draft.title).toBeTruthy();
  });
});
