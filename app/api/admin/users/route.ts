import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

interface AuthUser {
  id: string
  email: string | null
  created_at: string
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
      // Skip the current user
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
      }
    })
  )

  // Filter out null (current user) and return
  const filteredUsers = usersWithProfiles.filter(Boolean)

  return NextResponse.json(filteredUsers)
}

export async function POST(request: Request) {
  const supabase = createAdminClient()

  const { email, password, role } = await request.json()

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
    await supabase.from("user_profiles").insert({
      id: newUser.user.id,
      role: role || "user",
      can_view_all: true,
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