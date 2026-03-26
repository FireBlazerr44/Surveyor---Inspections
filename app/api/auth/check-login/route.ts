import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MAX_ATTEMPTS = 5

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

    if (profile?.locked_at) {
      const lockedUntil = new Date(profile.locked_at)
      if (lockedUntil > new Date()) {
        return NextResponse.json({
          failedAttempts: profile.failed_attempts || 0,
          lockedAt: profile.locked_at
        })
      } else {
        await supabase
          .from("user_profiles")
          .update({ locked_at: null, failed_attempts: 0 })
          .eq("email", email.toLowerCase())
        
        return NextResponse.json({ failedAttempts: 0, lockedAt: null })
      }
    }

    return NextResponse.json({
      failedAttempts: profile?.failed_attempts || 0,
      lockedAt: profile?.locked_at || null
    })

  } catch (error) {
    return NextResponse.json({ failedAttempts: 0, lockedAt: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, success } = body

    const supabase = await createClient()
    const emailLower = email.toLowerCase()

    if (success) {
      await supabase
        .from("user_profiles")
        .update({ 
          failed_attempts: 0, 
          locked_at: null,
          last_login_at: new Date().toISOString()
        })
        .eq("email", emailLower)

      await supabase.from("login_attempts").insert({
        email: emailLower,
        success: true,
        attempt_count: 0
      })

      return NextResponse.json({ success: true })
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("failed_attempts")
      .eq("email", emailLower)
      .single()

    const failedCount = (profile?.failed_attempts || 0) + 1
    
    let lockedAt = null
    if (failedCount >= MAX_ATTEMPTS) {
      const lockoutDuration = failedCount <= 5 ? 60 : failedCount <= 10 ? 300 : 900
      lockedAt = new Date(Date.now() + lockoutDuration * 1000).toISOString()
    }

    await supabase
      .from("user_profiles")
      .update({ 
        failed_attempts: failedCount,
        locked_at: lockedAt
      })
      .eq("email", emailLower)

    await supabase.from("login_attempts").insert({
      email: emailLower,
      success: false,
      attempt_count: failedCount,
      locked_until: lockedAt
    })

    if (lockedAt) {
      return NextResponse.json(
        { 
          error: "Account locked", 
          lockedAt,
          failedAttempts: failedCount 
        },
        { status: 423 }
      )
    }

    return NextResponse.json({ 
      failedAttempts: failedCount,
      remaining: MAX_ATTEMPTS - failedCount
    })

  } catch (error) {
    console.error("Login check error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}