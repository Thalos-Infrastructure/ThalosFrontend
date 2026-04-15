import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: Request) {
  try {
    const { userId, walletId } = await req.json()

    if (!userId || !walletId) {
      return NextResponse.json({ error: "User ID and wallet ID are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if wallet is primary
    const { data: wallet } = await supabase
      .from("linked_wallets")
      .select("is_primary")
      .eq("id", walletId)
      .eq("user_id", userId)
      .single()

    if (wallet?.is_primary) {
      return NextResponse.json({ error: "Cannot remove primary wallet" }, { status: 400 })
    }

    // Delete the wallet
    const { error } = await supabase
      .from("linked_wallets")
      .delete()
      .eq("id", walletId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error unlinking wallet:", error)
      return NextResponse.json({ error: "Failed to unlink wallet" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error in unlink:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
