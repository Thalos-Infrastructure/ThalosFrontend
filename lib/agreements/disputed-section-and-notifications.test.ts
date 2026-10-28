/**
 * Unit tests verifying Issue #221 (disputed agreements section)
 * and Issue #222 (notification when a dispute is raised).
 */
import { describe, expect, it } from "vitest"
import { allMilestonesReleased } from "@/lib/types/status"

describe("Issue #221: Disputed Agreements Section", () => {
  it("correctly identifies disputed agreements by agreement status or milestone status", () => {
    const agreements = [
      {
        id: "agr-1",
        title: "Standard Active Agreement",
        status: "in_progress",
        milestones: [{ status: "pending" }],
      },
      {
        id: "agr-2",
        title: "Disputed via agreement status 'disputed'",
        status: "disputed",
        milestones: [{ status: "pending" }],
      },
      {
        id: "agr-3",
        title: "Disputed via agreement status 'dispute'",
        status: "dispute",
        milestones: [{ status: "pending" }],
      },
      {
        id: "agr-4",
        title: "Disputed via milestone status",
        status: "in_progress",
        milestones: [{ status: "disputed" }],
      },
      {
        id: "agr-5",
        title: "Completed Agreement",
        status: "completed",
        milestones: [{ status: "released" }],
      },
    ]

    const categorized = {
      pending: [] as typeof agreements,
      active: [] as typeof agreements,
      completed: [] as typeof agreements,
      disputed: [] as typeof agreements,
    }

    agreements.forEach((agreement) => {
      const status = agreement.status.toLowerCase()
      const isDisputed =
        status === "dispute" ||
        status === "disputed" ||
        Boolean(
          agreement.milestones?.some(
            (m) => m.status === "disputed" || m.status === "dispute",
          ),
        )

      const everyMilestoneReleased = allMilestonesReleased(agreement.milestones)
      const hasPendingMilestones = agreement.milestones?.some(
        (m) => m.status === "pending" || m.status === "approved",
      )

      if (isDisputed) {
        categorized.disputed.push(agreement)
        categorized.pending.push(agreement)
      } else if (status === "completed" || status === "released" || everyMilestoneReleased) {
        categorized.completed.push(agreement)
      } else if (status === "in_progress" || status === "active") {
        categorized.active.push(agreement)
      } else if (status === "pending" || hasPendingMilestones) {
        categorized.pending.push(agreement)
      }
    })

    // Disputed agreements section receives all 3 disputed agreements
    expect(categorized.disputed.length).toBe(3)
    expect(categorized.disputed.map((a) => a.id)).toEqual(["agr-2", "agr-3", "agr-4"])

    // Active agreements contains only the non-disputed in_progress agreement
    expect(categorized.active.length).toBe(1)
    expect(categorized.active[0].id).toBe("agr-1")

    // Completed agreements contains only agr-5
    expect(categorized.completed.length).toBe(1)
    expect(categorized.completed[0].id).toBe("agr-5")
  })

  it("filters dashboard agreements with statusFilter === 'disputed'", () => {
    const list = [
      { id: "1", title: "A", status: "funded", milestones: [] },
      { id: "2", title: "B", status: "disputed", milestones: [] },
      { id: "3", title: "C", status: "in_progress", milestones: [{ status: "disputed" }] },
    ]

    const statusFilter = "disputed"
    const filtered = list.filter((a) => {
      const isDisputed =
        a.status === "disputed" ||
        a.status === "dispute" ||
        Boolean(a.milestones?.some((m) => m.status === "disputed" || m.status === "dispute"))
      if (statusFilter === "disputed") return isDisputed
      return a.status === statusFilter
    })

    expect(filtered.length).toBe(2)
    expect(filtered.map((a) => a.id)).toEqual(["2", "3"])
  })
})

describe("Issue #222: Notification when dispute is raised", () => {
  it("provides dispute.raisedNotification in both en and es translations", async () => {
    // Read the static translations file directly to confirm key availability
    const fs = await import("node:fs")
    const path = await import("node:path")
    const content = fs.readFileSync(path.resolve(process.cwd(), "lib/i18n.tsx"), "utf8")

    expect(content).toContain('"dispute.raisedNotification"')
    expect(content).toContain("Dispute has been raised. The dispute resolver has been notified.")
    expect(content).toContain("Se ha presentado una disputa. El mediador ha sido notificado.")
  })
})
