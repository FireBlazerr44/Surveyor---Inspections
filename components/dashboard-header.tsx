"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"

interface DashboardHeaderProps {
  userEmail: string
  userRole: string
  isAdmin: boolean
}

export function DashboardHeader({ userEmail, userRole, isAdmin }: DashboardHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const response = await fetch("/auth/signout", { method: "POST", credentials: "include" })
      if (response.ok) {
        router.push("/login")
        router.refresh()
      } else {
        console.error("Sign out failed:", response.status)
        router.push("/login")
      }
    } catch (error) {
      console.error("Sign out error:", error)
      router.push("/login")
    }
  }

  return (
    <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold">Surveyor Inspection</h1>
        </div>
        
          <div className="flex items-center gap-6">
          {isAdmin && (
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="h-9 border-border bg-card/50 hover:bg-card hover:text-secondary text-foreground">
                <Shield className="w-4 h-4 mr-2" />
                <span>User Management</span>
              </Button>
            </Link>
          )}
          
          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            
            <div className="pl-2 border-l border-border">
              <UserMenu 
                email={userEmail} 
                role={userRole} 
                onSignOut={handleSignOut} 
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}