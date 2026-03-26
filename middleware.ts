import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || 
                          request.nextUrl.pathname.startsWith("/properties") ||
                          request.nextUrl.pathname.startsWith("/inspections") ||
                          request.nextUrl.pathname.startsWith("/admin")

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/properties/:path*", "/inspections/:path*", "/admin/:path*", "/login"],
}