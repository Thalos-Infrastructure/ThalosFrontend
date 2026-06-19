import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import {
  parseChallengeMessage,
  verifyStellarSignature,
} from "@/lib/stellar/sep0043"

export async function POST(req: Request) {
  try {
    const {
      userId,
      walletAddress,
      walletType,
      label,
      signed_message,
      signature,
    } = await req.json()

    if (!userId || !walletAddress) {
      return NextResponse.json(
        { error: "User ID and wallet address are required" },
        { status: 400 },
      )
    }

    const isCustodial = walletType === "custodial"

    if (!isCustodial) {
      // External wallets must prove ownership via a signed SEP-0043 challenge.
      if (!signed_message || !signature) {
        return NextResponse.json(
          {
            error:
              "signed_message and signature are required for external wallets",
          },
          { status: 400 },
        )
      }

      const challenge = parseChallengeMessage(signed_message)

      if (
        !challenge ||
        challenge.userId !== userId ||
        challenge.walletAddress !== walletAddress
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

      if (!verifyStellarSignature(walletAddress, signed_message, signature)) {
        return NextResponse.json(
          { error: "Signature verification failed" },
          { status: 403 },
        )
      }
    }

    const supabase = createServiceClient()

    const { data: existing } = await supabase
      .from("linked_wallets")
      .select("id")
      .eq("user_id", userId)
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Wallet already linked" },
        { status: 400 },
      )
    }

    const { count } = await supabase
      .from("linked_wallets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    const isPrimary = count === 0
    const now = new Date().toISOString()

    const { data: wallet, error } = await supabase
      .from("linked_wallets")
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        wallet_type: walletType || "other",
        label: label || null,
        is_primary: isPrimary,
        is_verified: true,
        verified_at: now,
      })
      .select()
      .single()

    if (error) {
      console.error("Error linking wallet:", error)
      return NextResponse.json(
        { error: "Failed to link wallet" },
        { status: 500 },
      )
    }

    return NextResponse.json({ wallet })
  } catch (err) {
    console.error("Error in link wallet:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
