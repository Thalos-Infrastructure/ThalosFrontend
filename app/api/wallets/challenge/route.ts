import { NextResponse } from "next/server"
import {
  CHALLENGE_TTL_SECONDS,
  buildChallengeMessage,
} from "@/lib/stellar/sep0043"

/**
 * GET /api/wallets/challenge?userId=<id>&walletAddress=<G...>
 *
 * Returns a short-lived SEP-0043 challenge the client must sign with their
 * Stellar keypair before calling the link or verify endpoints.
 *
 * Flow: challenge → wallet signs signed_message → link / verify
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const walletAddress = searchParams.get("walletAddress")

  if (!userId || !walletAddress) {
    return NextResponse.json(
      { error: "userId and walletAddress are required" },
      { status: 400 },
    )
  }

  const expiresAt = Math.floor(Date.now() / 1000) + CHALLENGE_TTL_SECONDS
  const signed_message = buildChallengeMessage(userId, walletAddress, expiresAt)

  return NextResponse.json({
    signed_message,
    expires_at: new Date(expiresAt * 1000).toISOString(),
  })
}
