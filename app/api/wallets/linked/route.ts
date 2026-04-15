import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: wallets, error } = await supabase
    .from("linked_wallets")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching linked wallets:", error)
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 })
  }

  return NextResponse.json({ wallets: wallets || [] })
}
