/**
 * Tests for canonical evidence submission API
 * 
 * Required by GF-4-FE: Evidence submit hits canonical path
 * Related: Issue #141, GF-4-BE #142
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { submitMilestoneEvidence, getMilestoneEvidence } from "../evidence"
import { MilestoneStatus } from "../../enums"

// Mock the client module
vi.mock("../client", () => ({
  apiRequest: vi.fn(),
}))

import { apiRequest } from "../client"

const mockedApiRequest = apiRequest as ReturnType<typeof vi.fn>

describe("Evidence API - Canonical Endpoints", () => {
  const mockToken = "mock-jwt-token"
  const mockAgreementId = "agreement-123"
  const mockMilestoneIndex = 0

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("submitMilestoneEvidence", () => {
    const mockEvidence = {
      description: "Work completed as specified",
      files: ["https://example.com/proof1.pdf", "https://example.com/proof2.jpg"],
    }

    it("should call the canonical evidence endpoint", async () => {
      const mockResponse = {
        success: true,
        milestone_index: 0,
        new_status: MilestoneStatus.APPROVED,
        agreement_id: mockAgreementId,
        timestamp: "2026-08-18T12:00:00Z",
      }

      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      })

      await submitMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockEvidence, mockToken)

      expect(mockedApiRequest).toHaveBeenCalledWith(
        `/agreements/${mockAgreementId}/milestones/${mockMilestoneIndex}/evidence`,
        {
          method: "POST",
          body: JSON.stringify(mockEvidence),
        },
        mockToken
      )
    })

    it("should use the correct HTTP method (POST)", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      await submitMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockEvidence, mockToken)

      const callArgs = mockedApiRequest.mock.calls[0]
      expect(callArgs[1]?.method).toBe("POST")
    })

    it("should send evidence in request body", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      await submitMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockEvidence, mockToken)

      const callArgs = mockedApiRequest.mock.calls[0]
      expect(callArgs[1]?.body).toBe(JSON.stringify(mockEvidence))
    })

    it("should include JWT token", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      await submitMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockEvidence, mockToken)

      const callArgs = mockedApiRequest.mock.calls[0]
      expect(callArgs[2]).toBe(mockToken)
    })

    it("should handle evidence without files", async () => {
      const evidenceWithoutFiles = {
        description: "Work completed",
      }

      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      await submitMilestoneEvidence(
        mockAgreementId,
        mockMilestoneIndex,
        evidenceWithoutFiles,
        mockToken
      )

      const callArgs = mockedApiRequest.mock.calls[0]
      expect(callArgs[1]?.body).toBe(JSON.stringify(evidenceWithoutFiles))
    })

    it("should return success response", async () => {
      const mockResponse = {
        success: true,
        milestone_index: 0,
        new_status: MilestoneStatus.APPROVED,
        agreement_id: mockAgreementId,
        timestamp: "2026-08-18T12:00:00Z",
      }

      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      })

      const result = await submitMilestoneEvidence(
        mockAgreementId,
        mockMilestoneIndex,
        mockEvidence,
        mockToken
      )

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it("should handle API errors", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: false,
        error: "Evidence submission failed",
      })

      const result = await submitMilestoneEvidence(
        mockAgreementId,
        mockMilestoneIndex,
        mockEvidence,
        mockToken
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Evidence submission failed")
    })

    it("should work with different milestone indices", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      await submitMilestoneEvidence(mockAgreementId, 5, mockEvidence, mockToken)

      expect(mockedApiRequest).toHaveBeenCalledWith(
        `/agreements/${mockAgreementId}/milestones/5/evidence`,
        expect.anything(),
        mockToken
      )
    })
  })

  describe("getMilestoneEvidence", () => {
    it("should call the canonical evidence GET endpoint", async () => {
      const mockResponse = {
        description: "Work completed",
        files: ["https://example.com/proof.pdf"],
      }

      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      })

      await getMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockToken)

      expect(mockedApiRequest).toHaveBeenCalledWith(
        `/agreements/${mockAgreementId}/milestones/${mockMilestoneIndex}/evidence`,
        {
          method: "GET",
        },
        mockToken
      )
    })

    it("should use the correct HTTP method (GET)", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      await getMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockToken)

      const callArgs = mockedApiRequest.mock.calls[0]
      expect(callArgs[1]?.method).toBe("GET")
    })

    it("should return evidence data", async () => {
      const mockResponse = {
        description: "Work completed",
        files: ["https://example.com/proof.pdf"],
      }

      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      })

      const result = await getMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockToken)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it("should handle errors", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: false,
        error: "Evidence not found",
      })

      const result = await getMilestoneEvidence(mockAgreementId, mockMilestoneIndex, mockToken)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Evidence not found")
    })
  })

  describe("Canonical Path Validation", () => {
    it("should NOT use deprecated /escrow path", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      await submitMilestoneEvidence(
        mockAgreementId,
        mockMilestoneIndex,
        { description: "test" },
        mockToken
      )

      const callArgs = mockedApiRequest.mock.calls[0]
      const endpoint = callArgs[0] as string
      
      // Ensure we're NOT using the old /escrow path
      expect(endpoint).not.toContain("/escrow/")
      
      // Ensure we're using the new canonical /agreements path
      expect(endpoint).toContain("/agreements/")
      expect(endpoint).toContain("/evidence")
    })

    it("should use agreement ID, not contract ID", async () => {
      mockedApiRequest.mockResolvedValueOnce({
        success: true,
        data: {},
      })

      const agreementId = "agreement-abc-123"
      
      await submitMilestoneEvidence(
        agreementId,
        0,
        { description: "test" },
        mockToken
      )

      const callArgs = mockedApiRequest.mock.calls[0]
      const endpoint = callArgs[0] as string
      
      // The endpoint should contain the agreement ID
      expect(endpoint).toContain(agreementId)
    })
  })
})
