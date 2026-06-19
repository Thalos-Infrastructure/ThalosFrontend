import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import {
  parseChallengeMessage,
  verifyStellarSignature,
} from "@/lib/stellar/sep0043"

/**
 * POST /api/wallets/:id/verify
 *
 * Verifies an already-linked external wallet that was linked without a
 * signature (e.g. imported from a legacy flow). Accepts the same
 * SEP-0043 challenge proof as the link endpoint.
 *
 * Body: { userId, signed_message, signature }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: walletId } = await params
    const { userId, signed_message, signature } = await req.json()

    if (!userId || !signed_message || !signature) {
      return NextResponse.json(
        { error: "userId, signed_message and signature are required" },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const { data: wallet } = await supabase
      .from("linked_wallets")
      .select("id, wallet_address, wallet_type, is_verified")
      .eq("id", walletId)
      .eq("user_id", userId)
      .single()

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 },
      )
    }

    if (wallet.is_verified) {
      return NextResponse.json(
        { error: "Wallet is already verified" },
        { status: 400 },
      )
    }

    const challenge = parseChallengeMessage(signed_message)

    if (
      !challenge ||
      challenge.userId !== userId ||
      challenge.walletAddress !== wallet.wallet_address
    ) {
      return NextResponse.json(
        { error: "Invalid or tampered challenge" },
        { status: 403 },
      )
    }

    if (Math.floor(Date.now() / 1000) > challenge.expiresAt) {
      return NextResponse.json(
        { error: "Challenge has expired" },
        { status: 403 },
      )
    }

    if (
      !verifyStellarSignature(wallet.wallet_address, signed_message, signature)
    ) {
      return NextResponse.json(
        { error: "Signature verification failed" },
        { status: 403 },
      )
    }

    const now = new Date().toISOString()

    const { data: updated, error } = await supabase
      .from("linked_wallets")
      .update({ is_verified: true, verified_at: now })
      .eq("id", walletId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error verifying wallet:", error)
      return NextResponse.json(
        { error: "Failed to verify wallet" },
        { status: 500 },
      )
    }

    return NextResponse.json({ wallet: updated })
  } catch (err) {
    console.error("Error in verify wallet:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
