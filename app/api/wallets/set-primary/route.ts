import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: Request) {
  try {
    const { userId, walletId } = await req.json()

    if (!userId || !walletId) {
      return NextResponse.json({ error: "User ID and wallet ID are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Remove primary from all user wallets
    await supabase
      .from("linked_wallets")
      .update({ is_primary: false })
      .eq("user_id", userId)

    // Set the selected wallet as primary
    const { error } = await supabase
      .from("linked_wallets")
      .update({ is_primary: true })
      .eq("id", walletId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error setting primary wallet:", error)
      return NextResponse.json({ error: "Failed to set primary wallet" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error in set-primary:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
