import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, ipAddress } = body

    const supabase = await createClient()

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentAttempts } = await supabase
      .from("login_attempts")
      .select("attempt_count, locked_until")
      .eq("email", email.toLowerCase())
      .gte("created_at", fiveMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (recentAttempts?.locked_until && new Date(recentAttempts.locked_until) > new Date()) {
      const lockedUntil = new Date(recentAttempts.locked_until)
      const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutesLeft} minutes.` },
        { status: 423 }
      )
    }

    if (recentAttempts?.attempt_count >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      await supabase.from("login_attempts").insert({
        email: email.toLowerCase(),
        ip_address: ipAddress,
        success: false,
        attempt_count: 6,
        locked_until: lockedUntil,
      })

      await supabase
        .from("user_profiles")
        .update({ locked_at: lockedUntil, failed_attempts: 6 })
        .eq("email", email.toLowerCase())

      return NextResponse.json(
        { error: "Too many failed attempts. Account locked for 15 minutes." },
        { status: 423 }
      )
    }

    return NextResponse.json({ allowed: true })

  } catch (error) {
    console.error("Login check error:", error)
    return NextResponse.json({ allowed: true })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("failed_attempts, locked_at")
      .eq("email", email.toLowerCase())
      .single()

    return NextResponse.json({
      failedAttempts: profile?.failed_attempts || 0,
      lockedAt: profile?.locked_at,
    })

  } catch (error) {
    return NextResponse.json({ failedAttempts: 0, lockedAt: null })
  }
}