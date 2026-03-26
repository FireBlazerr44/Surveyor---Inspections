"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Building2, Shield, Loader2, AlertCircle, Copy, Lock, KeyRound } from "lucide-react"
import { generateSecretForUser } from "@/lib/mfa"

const MAX_ATTEMPTS = 5

function getAttemptsRemainingText(remaining: number): string {
  if (remaining === 4) return "4 attempts remaining"
  if (remaining === 3) return "3 attempts remaining"
  if (remaining === 2) return "2 attempts remaining - last chance!"
  if (remaining === 1) return "1 attempt remaining"
  return ""
}

function getLockoutEnd(attemptCount: number): Date | null {
  if (attemptCount >= MAX_ATTEMPTS) {
    const baseMinutes = attemptCount <= 5 ? 1 : attemptCount <= 10 ? 5 : 15
    return new Date(Date.now() + baseMinutes * 60 * 1000)
  }
  return null
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"credentials" | "mfa" | "mfa-setup">("credentials")
  const [mfaCode, setMfaCode] = useState("")
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaSecret, setMfaSecret] = useState("")
  const [mfaQrUri, setMfaQrUri] = useState("")
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState("")
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(MAX_ATTEMPTS)
  const [lockoutEnd, setLockoutEnd] = useState<Date | null>(null)
  const [lockoutCountdown, setLockoutCountdown] = useState<string>("")

  useEffect(() => {
    const savedAttempts = localStorage.getItem(`login_attempts_${email}`)
    if (savedAttempts) {
      const parsed = JSON.parse(savedAttempts)
      if (parsed.email === email) {
        if (parsed.lockoutEnd && new Date(parsed.lockoutEnd) > new Date()) {
          setLockoutEnd(new Date(parsed.lockoutEnd))
        } else {
          setAttemptsRemaining(parsed.remaining || MAX_ATTEMPTS)
          if (parsed.lockoutEnd && new Date(parsed.lockoutEnd) <= new Date()) {
            localStorage.removeItem(`login_attempts_${email}`)
          }
        }
      }
    }
  }, [email])

  useEffect(() => {
    if (!lockoutEnd) return

    const updateCountdown = () => {
      const now = new Date()
      const diff = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 1000)
      
      if (diff <= 0) {
        setLockoutEnd(null)
        setLockoutCountdown("")
        setAttemptsRemaining(MAX_ATTEMPTS)
        localStorage.removeItem(`login_attempts_${email}`)
      } else {
        const minutes = Math.floor(diff / 60)
        const seconds = diff % 60
        setLockoutCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [lockoutEnd, email])

  const saveAttemptState = (remaining: number, lockout: Date | null) => {
    localStorage.setItem(`login_attempts_${email}`, JSON.stringify({
      email,
      remaining,
      lockoutEnd: lockout?.toISOString() || null
    }))
  }

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (lockoutEnd) {
      setError(`Account locked. Try again in ${lockoutCountdown}`)
      return
    }

    setError("")
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        const newRemaining = attemptsRemaining - 1
        const newLockout = getLockoutEnd(MAX_ATTEMPTS - newRemaining)
        
        setAttemptsRemaining(Math.max(0, newRemaining))
        
        if (newLockout) {
          setLockoutEnd(newLockout)
          saveAttemptState(0, newLockout)
          setError(`Too many failed attempts. Account locked for ${newLockout > new Date(Date.now() + 300000) ? "15" : newLockout > new Date(Date.now() + 60000) ? "5" : "1"} minutes`)
        } else {
          saveAttemptState(newRemaining, null)
          if (newRemaining <= 3) {
            setError(`${signInError.message}. ${getAttemptsRemainingText(newRemaining)}`)
          } else {
            setError(signInError.message)
          }
        }
        
        setLoading(false)
        return
      }

      if (data.user) {
        localStorage.removeItem(`login_attempts_${email}`)
        setAttemptsRemaining(MAX_ATTEMPTS)
        setLockoutEnd(null)
        setError("")

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("mfa_enabled, mfa_secret")
          .eq("id", data.user.id)
          .single()

        if (profile?.mfa_enabled && profile?.mfa_secret) {
          setStep("mfa")
        } else {
          const { secret, uri } = generateSecretForUser(email)
          setMfaSecret(secret)
          setMfaQrUri(uri)
          setStep("mfa-setup")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleMFASetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSetupError("")
    setMfaSetupLoading(true)

    try {
      const response = await fetch("/api/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          action: "verify", 
          code: mfaCode,
          secret: mfaSecret
        })
      })

      const result = await response.json()

      if (result.valid) {
        const enableResponse = await fetch("/api/mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            action: "setup-enable", 
            secret: mfaSecret
          })
        })

        const enableResult = await enableResponse.json()

        if (enableResult.success) {
          router.push("/dashboard")
        } else {
          setSetupError(enableResult.error || "Failed to enable MFA")
        }
      } else {
        setSetupError("Invalid code. Please try again.")
      }
    } catch (err) {
      setSetupError("Setup failed. Please try again.")
    } finally {
      setMfaSetupLoading(false)
    }
  }

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMfaLoading(true)

    try {
      const response = await fetch("/api/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          action: "verify-login", 
          code: mfaCode
        })
      })

      const result = await response.json()

      if (result.valid) {
        router.push("/dashboard")
      } else {
        setError("Invalid authentication code. Please try again.")
      }
    } catch (err) {
      setError("Verification failed. Please try again.")
    } finally {
      setMfaLoading(false)
    }
  }

  const handleBackToLogin = () => {
    supabase.auth.signOut()
    setStep("credentials")
    setMfaCode("")
    setError("")
    setSetupError("")
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>
          {step === "mfa-setup" ? "Set Up Two-Factor Authentication" : step === "mfa" ? "Two-Factor Authentication" : "Sign In"}
        </CardTitle>
        <CardDescription>
          {step === "mfa-setup"
            ? "Scan this QR code with your authenticator app, then enter the code"
            : step === "mfa"
            ? "Enter the authentication code from your authenticator app"
            : "Enter your credentials to access the inspection database"
          }
        </CardDescription>
      </CardHeader>
      
      {step === "credentials" ? (
        <form onSubmit={handleCredentialsSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {lockoutCountdown && (
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-destructive" />
                  <span className="font-medium text-destructive">Account Locked</span>
                </div>
                <div className="text-center text-3xl font-mono font-bold text-destructive">
                  {lockoutCountdown}
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Too many failed login attempts
                </p>
              </div>
            )}
            {!lockoutEnd && attemptsRemaining < MAX_ATTEMPTS && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-muted">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Login attempts:</span>
                </div>
                <Badge 
                  variant={attemptsRemaining <= 1 ? "destructive" : attemptsRemaining <= 2 ? "outline" : "secondary"}
                  className="font-mono"
                >
                  {attemptsRemaining} / {MAX_ATTEMPTS}
                </Badge>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setAttemptsRemaining(MAX_ATTEMPTS)
                }}
                required
                autoComplete="email"
                disabled={!!lockoutEnd}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={!!lockoutEnd}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email || !password || !!lockoutEnd}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Contact the administrator if you need access.
            </p>
          </CardFooter>
        </form>
      ) : step === "mfa-setup" ? (
        <form onSubmit={handleMFASetupSubmit}>
          <CardContent className="space-y-4">
            {setupError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4" />
                {setupError}
              </div>
            )}
            <div className="flex justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaQrUri)}`}
                alt="QR Code"
                className="border rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Or enter this key manually:</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-md font-mono text-sm tracking-wider">
                  {mfaSecret}
                </code>
                <Button 
                  type="button"
                  variant="outline" 
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(mfaSecret)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-code">Enter code to verify setup</Label>
              <Input
                id="setup-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                className="text-center tracking-widest font-mono text-lg"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={mfaSetupLoading || mfaCode.length !== 6}
            >
              {mfaSetupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Complete Setup
            </Button>
            <button 
              type="button" 
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={handleBackToLogin}
            >
              Back to login
            </button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleMFASubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa-code">Authentication Code</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoComplete="one-time-code"
                maxLength={6}
                className="text-center tracking-widest font-mono text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={mfaLoading || mfaCode.length < 6}
            >
              {mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify
            </Button>
            <button 
              type="button" 
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={handleBackToLogin}
            >
              Back to login
            </button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Surveyor Inspection</h1>
        </div>
        
        <Suspense fallback={
          <Card className="shadow-lg">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        }>
          <LoginForm />
        </Suspense>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>Secure login with two-factor authentication</span>
        </div>
      </div>
    </div>
  )
}