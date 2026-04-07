"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react"

import Link from "next/link"

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

function validatePassword(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
  }
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    return "Password must include uppercase, lowercase, number, and special character"
  }
  return ""
}

function PasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const isForced = searchParams.get("force") === "true"

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    const validationError = validatePassword(newPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!isForced && newPassword === currentPassword) {
      setError("New password must be different from current password")
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        if (isForced) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Set password_must_change to false
            await supabase.from("user_profiles").update({ password_must_change: false }).eq("id", user.id)
            
            const { data: profile, error: profileError } = await supabase
              .from("user_profiles")
              .select("mfa_enabled, mfa_secret")
              .eq("id", user.id)
              .single()
            
            const hasMfa = profileError ? false : !!(profile?.mfa_enabled && profile?.mfa_secret)
            
            if (hasMfa) {
              router.push("/dashboard")
            } else {
              router.push("/settings/mfa")
            }
          } else {
            router.push("/dashboard")
          }
        } else {
          setSuccess(true)
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Lock className="h-6 w-6" />
              <h1 className="text-xl font-bold">Password Changed</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {isForced ? "Password Updated" : "Password Changed"}
              </CardTitle>
              <CardDescription>
                {isForced ? "Your password has been updated. Welcome!" : "Your password has been updated successfully"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-500/10 rounded-lg text-center">
                <p className="text-sm">
                  Redirecting to dashboard...
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Lock className="h-6 w-6" />
            <h1 className="text-xl font-bold">{isForced ? "Create New Password" : "Change Password"}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{isForced ? "Create Your Password" : "Update Your Password"}</CardTitle>
            <CardDescription>
              {isForced 
                ? "You must create a new password to access your account"
                : "Enter your current password and choose a new one"
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              {!isForced && (
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current"
                      type={showCurrent ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new">{isForced ? "New Password" : "New Password"}</Label>
                <div className="relative">
                  <Input
                    id="new"
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Min 8 chars, uppercase, lowercase, number, special char
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading || !newPassword || !confirmPassword}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isForced ? "Set Password" : "Update Password"}
              </Button>
              {!isForced && (
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </Link>
              )}
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PasswordForm />
    </Suspense>
  )
}