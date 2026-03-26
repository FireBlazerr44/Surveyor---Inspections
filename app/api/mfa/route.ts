import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyToken, generateBackupCodes, removeUsedBackupCode } from "@/lib/mfa"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, code, secret, userId } = body

    if (action === "verify") {
      if (!code || !secret) {
        return NextResponse.json({ error: "Code and secret required" }, { status: 400 })
      }

      const isValid = await verifyToken(secret, code)
      return NextResponse.json({ valid: isValid })
    }

    if (action === "verify-login") {
      const supabase = await createClient()
      
      let targetUserId = userId
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        targetUserId = user?.id
      }

      if (!targetUserId) {
        return NextResponse.json({ error: "User not found" }, { status: 401 })
      }

      if (!code) {
        return NextResponse.json({ mfaRequired: true })
      }

      let isValidToken = false
      
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("mfa_secret, mfa_backup_codes")
        .eq("id", targetUserId)
        .single()

      if (profile?.mfa_secret) {
        isValidToken = await verifyToken(profile.mfa_secret, code)
      }
      
      if (!isValidToken && profile?.mfa_backup_codes) {
        const isValidBackup = profile.mfa_backup_codes.some((bc: string) => 
          bc.replace("-", "").toUpperCase() === code.replace("-", "").toUpperCase()
        )
        
        if (isValidBackup) {
          const newCodes = removeUsedBackupCode(profile.mfa_backup_codes, code)
          await supabase
            .from("user_profiles")
            .update({ mfa_backup_codes: newCodes })
            .eq("id", targetUserId)
          
          return NextResponse.json({ valid: true })
        }
      }

      return NextResponse.json({ valid: isValidToken })
    }

    if (action === "setup-enable") {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      if (!secret) {
        return NextResponse.json({ error: "Secret required" }, { status: 400 })
      }

      const backupCodes = generateBackupCodes(10)

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          mfa_enabled: true,
          mfa_secret: secret,
          mfa_backup_codes: backupCodes
        })
        .eq("id", user.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        backupCodes 
      })
    }

    if (action === "disable") {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          mfa_backup_codes: null
        })
        .eq("id", user.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("MFA API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}