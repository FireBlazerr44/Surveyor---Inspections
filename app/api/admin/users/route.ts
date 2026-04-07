import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface AuthUser {
  id: string
  email: string | null
  created_at: string
}

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

function validatePassword(password: string): { valid: boolean; error: string } {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }
  }
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return { valid: false, error: "Password must include uppercase, lowercase, number, and special character" }
  }
  const commonPasswords = ["password", "123456", "qwerty", "admin", "letmein", "welcome"]
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    return { valid: false, error: "Password is too common" }
  }
  return { valid: true, error: "" }
}

export async function GET() {
  const adminSupabase = createAdminClient()
  const regularSupabase = await createClient()
  
  const { data: { user: currentUser } } = await regularSupabase.auth.getUser()
  
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await adminSupabase.auth.admin.listUsers()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const users = data?.users || []

  const usersWithProfiles = await Promise.all(
    users.map(async (u: AuthUser) => {
      if (u.id === currentUser.id) return null
      
      const { data: profile } = await adminSupabase
        .from("user_profiles")
        .select("*")
        .eq("id", u.id)
        .single()

      return {
        id: u.id,
        email: u.email || "",
        role: profile?.role || "user",
        can_view_all: profile?.can_view_all ?? true,
        created_at: u.created_at,
        failed_attempts: profile?.failed_attempts || 0,
        locked_at: profile?.locked_at || null,
      }
    })
  )

  const filteredUsers = usersWithProfiles.filter(Boolean)

  return NextResponse.json(filteredUsers)
}

export async function POST(request: Request) {
  const supabase = createAdminClient()

  const body = await request.json()
  const { email, password, role } = body

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (newUser?.user) {
    // Use upsert in case trigger already created the profile
    await supabase.from("user_profiles").upsert({
      id: newUser.user.id,
      role: role || "user",
      can_view_all: role !== "read_only",
      password_must_change: true,
    })
  }

  return NextResponse.json({ success: true, user: newUser?.user })
}

export async function DELETE(request: Request) {
  const supabase = createAdminClient()

  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  await supabase.from("user_profiles").delete().eq("id", userId)

  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const supabase = createAdminClient()

  const { userId, action } = await request.json()

  if (!userId || !action) {
    return NextResponse.json({ error: "User ID and action required" }, { status: 400 })
  }

  if (action === "unlock") {
    const { error } = await supabase
      .from("user_profiles")
      .update({ 
        locked_at: null, 
        failed_attempts: 0 
      })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}