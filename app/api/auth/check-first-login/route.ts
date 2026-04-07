import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Use admin client to query auth.users for last_sign_in_at
    const adminSupabase = createAdminClient()
    const { data: authUser, error } = await adminSupabase.auth.admin.getUserById(userId)

    if (error || !authUser.user) {
      return NextResponse.json({ isFirstLogin: true })
    }

    const isFirstLogin = !authUser.user.last_sign_in_at

    return NextResponse.json({ isFirstLogin })
  } catch (error) {
    console.error("Check first login error:", error)
    return NextResponse.json({ isFirstLogin: true })
  }
}