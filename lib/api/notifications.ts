import { API_URL } from "@/lib/config"

export type NotificationEventType =
  | "agreement_created"
  | "agreement_accepted"
  | "agreement_funded"
  | "evidence_submitted"
  | "milestone_approved"
  | "dispute_opened"
  | "dispute_resolved"
  | "agreement_completed"

export interface SendNotificationData {
  eventType: NotificationEventType
  agreementId: string
  agreementTitle: string
  recipientWallets: string[]
  amount?: string
  currency?: string
  milestoneNumber?: number
  milestoneDescription?: string
  senderName?: string
  disputeReason?: string
  resolution?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Request failed" }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error" 
    }
  }
}

// Send a notification
export async function sendNotification(
  data: SendNotificationData,
  token: string
): Promise<ApiResponse<{ sent: number; failed: number; errors: string[] }>> {
  return apiRequest<{ sent: number; failed: number; errors: string[] }>(
    "/notifications/send",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token
  )
}

// Convenience functions for common notifications
export async function notifyAgreementCreated(
  agreement: { id: string; title: string; amount?: string },
  receiverWallet: string,
  senderName: string,
  token: string
) {
  return sendNotification(
    {
      eventType: "agreement_created",
      agreementId: agreement.id,
      agreementTitle: agreement.title,
      recipientWallets: [receiverWallet],
      amount: agreement.amount,
      senderName,
    },
    token
  )
}

export async function notifyAgreementFunded(
  agreement: { id: string; title: string },
  sellerWallet: string,
  milestone?: { description: string; amount?: string },
  token?: string
) {
  return sendNotification(
    {
      eventType: "agreement_funded",
      agreementId: agreement.id,
      agreementTitle: agreement.title,
      recipientWallets: [sellerWallet],
      milestoneDescription: milestone?.description,
      amount: milestone?.amount,
    },
    token || ""
  )
}

export async function notifyMilestoneApproved(
  agreement: { id: string; title: string },
  sellerWallet: string,
  milestoneNumber: number,
  amount: string,
  token: string
) {
  return sendNotification(
    {
      eventType: "milestone_approved",
      agreementId: agreement.id,
      agreementTitle: agreement.title,
      recipientWallets: [sellerWallet],
      milestoneNumber,
      amount,
    },
    token
  )
}

export async function notifyDisputeOpened(
  agreement: { id: string; title: string },
  wallets: string[],
  reason: string,
  token: string
) {
  return sendNotification(
    {
      eventType: "dispute_opened",
      agreementId: agreement.id,
      agreementTitle: agreement.title,
      recipientWallets: wallets,
      disputeReason: reason,
    },
    token
  )
}

export async function notifyAgreementCompleted(
  agreement: { id: string; title: string; amount?: string },
  wallets: string[],
  token: string
) {
  return sendNotification(
    {
      eventType: "agreement_completed",
      agreementId: agreement.id,
      agreementTitle: agreement.title,
      recipientWallets: wallets,
      amount: agreement.amount,
    },
    token
  )
}
