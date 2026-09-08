import type { ApiResponse } from "@/lib/api/client"
import {
  getWalletVerificationChallenge,
  linkWallet,
  walletVerificationMessageToSign,
  type UserWallet,
  type WalletType,
} from "@/lib/api/wallets"
import { getStoredAuthWallet } from "@/lib/signing/session"
import { signMessage } from "@/lib/signing"

/**
 * Persist a wallet the user is actively signing with into Nest `user_wallets`.
 *
 * - Pollar embedded: no SEP-53 message signing. Nest auto-verifies `custodial`.
 *   Only allowed when the address matches the JWT session wallet (never forge
 *   custodial for an arbitrary Kit address).
 * - External Kit wallets: challenge → sign → link with proof (Nest rejects
 *   unsigned non-custodial POSTs).
 */
export async function linkExternalWalletWithProof(
  walletAddress: string,
  token: string,
  walletType: WalletType = "other",
): Promise<ApiResponse<UserWallet>> {
  const authWallet = getStoredAuthWallet()
  const isSessionEmbedded =
    Boolean(authWallet) &&
    authWallet!.provider !== "accesly" &&
    authWallet!.publicKey === walletAddress

  if (isSessionEmbedded) {
    return linkWallet(
      {
        wallet_address: walletAddress,
        wallet_type: "custodial",
        label: "Pollar",
      },
      token,
    ).then((result) => {
      // Re-login / remount often re-POSTs; Nest 409 = already linked.
      if (
        !result.success &&
        (result.status === 409 || /already linked/i.test(result.error ?? ""))
      ) {
        return { success: true as const, data: result.data, status: result.status ?? 409 }
      }
      return result
    })
  }

  const challengeResult = await getWalletVerificationChallenge(walletAddress, token)
  if (!challengeResult.success || !challengeResult.data) {
    return {
      success: false,
      error: challengeResult.error || "Could not get wallet verification challenge",
    }
  }

  const challenge = challengeResult.data.challenge
  const signed = await signMessage(walletVerificationMessageToSign(challenge), walletAddress)
  if (!signed) {
    return { success: false, error: "Wallet signature cancelled" }
  }

  return linkWallet(
    {
      wallet_address: walletAddress,
      wallet_type: walletType,
      signed_message: challenge,
      signature: signed.signedMessage,
    },
    token,
  )
}
