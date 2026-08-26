import { describe, it, expect, beforeAll } from "vitest";

/**
 * Route tests for POST /api/ai/agreement-draft.
 *
 * The endpoint gained Bearer-JWT auth and per-user rate limiting after these
 * tests were written, so every request here needs a token AND a real `headers`
 * object — a bare `{ json }` stub made the handler throw on `req.headers.get`
 * and every assertion saw a 500.
 *
 * Only the happy path needs a real model credential; it skips without one so
 * `pnpm test` is green on a clean checkout and in CI.
 */

const handlerModule = "../../../app/api/ai/agreement-draft/route";

// vitest does not load .env files, so pin the secret the route verifies against.
process.env.JWT_SECRET = "test-secret-for-route-handler-specs";

/** Absent on a clean checkout and in CI — the happy path is skipped without it. */
const hasModelCredential = Boolean(process.env.OPENAI_API_KEY || process.env.OPENAI_KEY);

let token: string;

beforeAll(async () => {
  const { signToken } = await import("../../auth/utils");
  token = signToken({ sub: "test-user", email: "test@thalos.local" });
});

/** The handler reads `req.headers`, so the stub must provide one. */
function makeRequest(body: unknown, authHeader?: string) {
  return {
    json: async () => body,
    headers: new Headers(authHeader ? { authorization: authHeader } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("POST /api/ai/agreement-draft", () => {
  it("rejects an unauthenticated request", async () => {
    const { POST } = await import(handlerModule);
    const res = await POST(makeRequest({ prompt: "Simple freelance agreement", useCase: "" }));
    expect(res.status).toBe(401);
  });

  it("rejects requests with no prompt", async () => {
    const { POST } = await import(handlerModule);
    const res = await POST(makeRequest({ prompt: "", useCase: "" }, `Bearer ${token}`));
    expect(res.status).toBe(400);
  });

  it("rejects prompts that exceed max length", async () => {
    const { POST } = await import(handlerModule);
    const res = await POST(makeRequest({ prompt: "A".repeat(5001), useCase: "" }, `Bearer ${token}`));
    expect(res.status).toBe(400);
  });

  it("returns 500 when the model key is missing", async () => {
    const { POST } = await import(handlerModule);
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    const res = await POST(
      makeRequest({ prompt: "Simple freelance agreement", useCase: "" }, `Bearer ${token}`),
    );
    process.env.OPENAI_API_KEY = originalKey;
    expect(res.status).toBe(500);
  });

  it.skipIf(!hasModelCredential)(
    "returns a structured AgreementDraft on success when the model is reachable",
    async () => {
      const { POST } = await import(handlerModule);
      const res = await POST(
        makeRequest(
          {
            prompt: "Pay $1200 for design ($400), build ($600), deploy ($200).",
            useCase: "",
          },
          `Bearer ${token}`,
        ),
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.draft.title).toBeTruthy();
    },
  );
});
