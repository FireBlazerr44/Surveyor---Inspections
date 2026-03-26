import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 100

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return false
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true
  }
  
  record.count++
  return false
}

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || request.headers.get("x-real-ip") 
    || "unknown"
}

export async function middleware(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  if (isRateLimited(clientIP)) {
    return new NextResponse("Too Many Requests", { 
      status: 429,
      headers: { "Retry-After": "60" }
    })
  }

  const response = NextResponse.next()
  
  const isProduction = process.env.NODE_ENV === "production"
  
  const cspParts = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self'",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || ""} https://api.postcodes.io https://api.qrserver.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
  
  if (!isProduction) {
    cspParts.push("script-src 'unsafe-inline' 'unsafe-eval'")
  }

  response.headers.set("Content-Security-Policy", cspParts.join("; "))
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin")
  
  if (isProduction) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || 
                          request.nextUrl.pathname.startsWith("/properties") ||
                          request.nextUrl.pathname.startsWith("/inspections") ||
                          request.nextUrl.pathname.startsWith("/admin") ||
                          request.nextUrl.pathname.startsWith("/comparables") ||
                          request.nextUrl.pathname.startsWith("/settings")

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/properties/:path*", 
    "/inspections/:path*", 
    "/admin/:path*",
    "/comparables/:path*",
    "/settings/:path*",
    "/auth/signout",
    "/login",
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ],
}