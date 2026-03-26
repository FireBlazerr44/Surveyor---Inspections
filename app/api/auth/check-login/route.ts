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

    try {
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
    } catch (e) {
      console.error("Profile fetch error:", e)
      return NextResponse.json({ failedAttempts: 0, lockedAt: null })
    }

  } catch (error) {
    console.error("Login check error:", error)
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
      try {
        await supabase
          .from("user_profiles")
          .update({ 
            failed_attempts: 0, 
            locked_at: null,
            last_login_at: new Date().toISOString()
          })
          .eq("email", emailLower)
      } catch (e) {
        console.log("Success update (profile may not have columns):", e)
      }

      return NextResponse.json({ success: true })
    }

    try {
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
    } catch (e) {
      console.log("Failed attempt update error:", e)
      return NextResponse.json({ failedAttempts: 1, remaining: 4 })
    }

  } catch (error) {
    console.error("Login check error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}