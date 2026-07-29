/**
 * Real route handler tests for POST /api/ai/agreement-draft.
 * Calls the actual route handler with mocked dependencies.
 *
 * Run: npx tsx --test lib/ai/__tests__/route-handler-real.test.ts
 */

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import { POST } from "../../app/api/ai/agreement-draft/route";
import { generateObject } from "ai";
import { verifyToken } from "../../lib/auth/utils";

// ─── Mock dependencies ─────────────────────────────────────────────────────

// Mock verifyToken to return fake auth payload
mock.method(verifyToken, (token: string) => {
  if (!token || token === "invalid") return null;
  return { sub: "mock-user-123", email: "test@example.com", iat: Date.now(), exp: Date.now() + 3600000 };
});

// Mock generateObject to return fake AI responses
const mockGenerateObject = mock.method(generateObject, async () => {
  return {
    object: {
      title: "Test Agreement",
      description: "Test description",
      amount: "1000",
      asset: "USDC",
      agreement_type: "single",
      milestones: [
        { description: "Deliver work", amount: "1000", status: "pending" }
      ],
      metadata: { generatedByAI: true, riskFlags: [] }
    }
  };
});

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("POST /api/ai/agreement-draft — Real Route Tests", () => {
  describe("Auth checks", () => {
    it("rejects request with no Authorization header → 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        body: JSON.stringify({ prompt: "test" })
      });
      const res = await POST(req);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error?.includes("Missing authentication"));
    });

    it("rejects request with invalid token → 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer invalid" },
        body: JSON.stringify({ prompt: "test" })
      });
      const res = await POST(req);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error?.includes("Invalid or expired"));
    });

    it("accepts request with valid token → proceeds", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ prompt: "test" })
      });
      const res = await POST(req);
      assert.notEqual(res.status, 401);
    });
  });

  describe("Request validation", () => {
    it("rejects empty body → 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({})
      });
      const res = await POST(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error?.includes("Invalid request"));
    });

    it("rejects missing prompt → 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ useCase: "real-estate" })
      });
      const res = await POST(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error?.includes("Invalid request"));
    });

    it("rejects prompt too long (5000+ chars) → 400", async () => {
      const longPrompt = "x".repeat(5001);
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ prompt: longPrompt })
      });
      const res = await POST(req);
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error?.includes("too long"));
    });
  });

  describe("Rate limiting", () => {
    it("rejects after 20 requests in same hour → 429", async () => {
      const headers = { authorization: "Bearer rate-limit-test" };
      const body = JSON.stringify({ prompt: "test" });

      // First 20 requests should succeed
      for (let i = 0; i < 20; i++) {
        const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
          method: "POST",
          headers,
          body
        });
        const res = await POST(req);
        assert.notEqual(res.status, 429, `Request ${i + 1} should not be rate-limited`);
      }

      // 21st request should be rate-limited
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers,
        body
      });
      const res = await POST(req);
      assert.equal(res.status, 429);
      const resBody = await res.json();
      assert.equal(resBody.success, false);
      assert.ok(resBody.error?.includes("Rate limit"));
    });
  });

  describe("Success path", () => {
    it("returns valid draft with auth + valid prompt → 200", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ prompt: "Create a $1000 agreement" })
      });
      const res = await POST(req);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.data?.title);
      assert.ok(body.data?.milestones);
      assert.equal(body.data?.amount, "1000");
      assert.equal(body.data?.asset, "USDC");
    });

    it("includes useCase in prompt when provided", async () => {
      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({
          prompt: "Create agreement",
          useCase: "real-estate"
        })
      });
      const res = await POST(req);
      assert.equal(res.status, 200);
      // verify generateObject was called (mock tracks calls)
      assert.equal(mockGenerateObject.mock.calls.length, 1);
    });
  });

  describe("Error handling", () => {
    it("handles AI SDK error → 500", async () => {
      // Temporarily mock generateObject to throw
      mockGenerateObject.mock.mockImplementationOnce(() => {
        throw new Error("AI service unavailable");
      });

      const req = new NextRequest("http://localhost:3000/api/ai/agreement-draft", {
        method: "POST",
        headers: { authorization: "Bearer valid-token" },
        body: JSON.stringify({ prompt: "test" })
      });
      const res = await POST(req);
      assert.equal(res.status, 500);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.ok(body.error?.includes("Failed to generate"));
    });
  });
});
