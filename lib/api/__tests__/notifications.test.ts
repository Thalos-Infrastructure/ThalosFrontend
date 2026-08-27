import { describe, it, expect, vi, afterEach } from "vitest"

vi.mock("@/lib/config", () => ({ API_URL: "http://localhost:3001/v1" }))

import {
  sendNotification,
  notifyAgreementCreated,
  notifyAgreementFunded,
  notifyMilestoneApproved,
  notifyDisputeOpened,
  notifyAgreementCompleted,
  type SendNotificationData,
} from "../notifications"

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }),
  )
}

afterEach(() => vi.restoreAllMocks())

describe("notifications contract", () => {
  describe("sendNotification", () => {
    it("parses { sent, failed, errors } envelope", async () => {
      mockFetch({ sent: 3, failed: 1, errors: ["wallet X timed out"] })
      const res = await sendNotification(
        {
          eventType: "agreement_created",
          agreementId: "a1",
          agreementTitle: "Test",
          recipientWallets: ["G1...", "G2...", "G3...", "G4..."],
        },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.sent).toBe(3)
      expect(res.data!.failed).toBe(1)
      expect(res.data!.errors).toEqual(["wallet X timed out"])
    })

    it("sends correct request body", async () => {
      mockFetch({ sent: 1, failed: 0, errors: [] })
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      const data: SendNotificationData = {
        eventType: "milestone_approved",
        agreementId: "a1",
        agreementTitle: "Deal",
        recipientWallets: ["G1..."],
        milestoneNumber: 2,
        amount: "500",
        senderName: "Alice",
      }
      await sendNotification(data, "tok")
      const init = fetchSpy.mock.calls[0][1] as RequestInit
      const body = JSON.parse(init.body as string)
      expect(body.eventType).toBe("milestone_approved")
      expect(body.milestoneNumber).toBe(2)
      expect(body.amount).toBe("500")
    })

    it("drift test: missing sent/failed keys breaks contract", async () => {
      mockFetch({ ok: true })
      const res = await sendNotification(
        {
          eventType: "agreement_created",
          agreementId: "a1",
          agreementTitle: "T",
          recipientWallets: ["G1..."],
        },
        "tok",
      )
      expect(res.success).toBe(true)
      expect(res.data!.sent).toBeUndefined()
      expect(res.data!.failed).toBeUndefined()
    })
  })

  describe("convenience functions", () => {
    it("notifyAgreementCreated sends correct eventType", async () => {
      mockFetch({ sent: 1, failed: 0, errors: [] })
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      await notifyAgreementCreated({ id: "a1", title: "Deal", amount: "100" }, "G2...", "Alice", "tok")
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
      expect(body.eventType).toBe("agreement_created")
      expect(body.recipientWallets).toEqual(["G2..."])
      expect(body.senderName).toBe("Alice")
    })

    it("notifyAgreementFunded sends correct eventType", async () => {
      mockFetch({ sent: 1, failed: 0, errors: [] })
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      await notifyAgreementFunded({ id: "a1", title: "Deal" }, "G2...")
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
      expect(body.eventType).toBe("agreement_funded")
    })

    it("notifyMilestoneApproved sends correct eventType", async () => {
      mockFetch({ sent: 1, failed: 0, errors: [] })
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      await notifyMilestoneApproved({ id: "a1", title: "Deal" }, "G2...", 3, "500", "tok")
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
      expect(body.eventType).toBe("milestone_approved")
      expect(body.milestoneNumber).toBe(3)
      expect(body.amount).toBe("500")
    })

    it("notifyDisputeOpened sends correct eventType", async () => {
      mockFetch({ sent: 1, failed: 0, errors: [] })
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      await notifyDisputeOpened({ id: "a1", title: "Deal" }, ["G1...", "G2..."], "Non-delivery", "tok")
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
      expect(body.eventType).toBe("dispute_opened")
      expect(body.recipientWallets).toEqual(["G1...", "G2..."])
      expect(body.disputeReason).toBe("Non-delivery")
    })

    it("notifyAgreementCompleted sends correct eventType", async () => {
      mockFetch({ sent: 1, failed: 0, errors: [] })
      const fetchSpy = vi.spyOn(globalThis, "fetch")
      await notifyAgreementCompleted({ id: "a1", title: "Deal", amount: "1000" }, ["G1..."], "tok")
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)
      expect(body.eventType).toBe("agreement_completed")
      expect(body.amount).toBe("1000")
    })
  })
})
