import {
  getAgreementsByWallet as getAgreementsByWalletApi,
  type AgreementWithParticipants,
} from "@/lib/api/agreements"

/**
 * Browser-side replacement for the `getAgreementsByWallet` Server Action.
 * Server Actions are queued one at a time per client and add a Next.js hop,
 * which made dashboard polling stall behind profile/KYC calls. Nest allows
 * CORS from the frontend, so the dashboards call it directly.
 */
export async function getAgreementsByWallet(
  walletAddress: string,
  token?: string,
  params?: { status?: string; type?: string },
): Promise<{ agreements: AgreementWithParticipants[]; error: string | null }> {
  try {
    const result = await getAgreementsByWalletApi(walletAddress, token, params)
    if (!result.success) {
      return { agreements: [], error: result.error || "Failed to fetch agreements" }
    }
    return { agreements: result.data || [], error: null }
  } catch (e) {
    return {
      agreements: [],
      error: e instanceof Error ? e.message : "Failed to fetch agreements",
    }
  }
}
