import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: Request) {
  try {
    const { userId, walletAddress, walletType, label } = await req.json()

    if (!userId || !walletAddress) {
      return NextResponse.json({ error: "User ID and wallet address are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if wallet is already linked to this user
    const { data: existing } = await supabase
      .from("linked_wallets")
      .select("id")
      .eq("user_id", userId)
      .eq("wallet_address", walletAddress)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Wallet already linked" }, { status: 400 })
    }

    // Check if this is the first wallet (make it primary)
    const { count } = await supabase
      .from("linked_wallets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    const isPrimary = count === 0

    // Insert new linked wallet
    const { data: wallet, error } = await supabase
      .from("linked_wallets")
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        wallet_type: walletType || "other",
        label: label || null,
        is_primary: isPrimary,
      })
      .select()
      .single()

    if (error) {
      console.error("Error linking wallet:", error)
      return NextResponse.json({ error: "Failed to link wallet" }, { status: 500 })
    }

    return NextResponse.json({ wallet })
  } catch (err) {
    console.error("Error in link wallet:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
