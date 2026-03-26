"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { Building2, Shield, Loader2, AlertCircle, Copy } from "lucide-react"
import { generateSecretForUser } from "@/lib/mfa"

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  }
  if (!PASSWORD_COMPLEXITY_REGEX.test(password)) {
    errors.push("Password must include uppercase, lowercase, number, and special character")
  }
  
  const commonPasswords = ["password", "123456", "qwerty", "admin", "letmein", "welcome"]
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    errors.push("Password is too common")
  }
  
  return { valid: errors.length === 0, errors }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"credentials" | "mfa" | "mfa-setup" | "register">("credentials")
  const [mfaCode, setMfaCode] = useState("")
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaSecret, setMfaSecret] = useState("")
  const [mfaQrUri, setMfaQrUri] = useState("")
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState("")
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const checkLoginAllowed = async (email: string) => {
    try {
      const response = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      const result = await response.json()
      if (result.error) {
        return { allowed: false, error: result.error }
      }
      return { allowed: true, error: null }
    } catch {
      return { allowed: true, error: null }
    }
  }

  const recordFailedAttempt = async (email: string) => {
    try {
      await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, failed: true })
      })
    } catch {}
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (isRegisterMode) {
      const validation = validatePassword(password)
      if (!validation.valid) {
        setError(validation.errors.join(". "))
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        setLoading(false)
        return
      }
    }

    const loginCheck = await checkLoginAllowed(email)
    if (!loginCheck.allowed) {
      setError(loginCheck.error)
      setLoading(false)
      return
    }

    try {
      if (isRegisterMode) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password
        })

        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { secret, uri } = generateSecretForUser(email)
          setMfaSecret(secret)
          setMfaQrUri(uri)
          setStep("mfa-setup")
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          await recordFailedAttempt(email)
          setError(signInError.message)
          setLoading(false)
          return
        }

        if (data.user) {
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

  const toggleRegisterMode = () => {
    setIsRegisterMode(!isRegisterMode)
    setError("")
    setPassword("")
    setConfirmPassword("")
  }

  const getFormTitle = () => {
    if (step === "mfa-setup") return "Set Up Two-Factor Authentication"
    if (step === "mfa") return "Two-Factor Authentication"
    if (isRegisterMode) return "Create Account"
    return "Sign In"
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{getFormTitle()}</CardTitle>
        <CardDescription>
          {step === "mfa-setup"
            ? "Scan this QR code with your authenticator app, then enter the code"
            : step === "mfa"
            ? "Enter the authentication code from your authenticator app"
            : isRegisterMode
            ? "Create your account to access the inspection database"
            : "Enter your credentials to access the inspection database"
          }
        </CardDescription>
      </CardHeader>
      
      {step === "credentials" ? (
        <form onSubmit={handleCredentialsSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2" role="alert">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isRegisterMode ? "Password" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                placeholder={isRegisterMode ? "Min 8 chars, uppercase, lowercase, number, special" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegisterMode ? "new-password" : "current-password"}
              />
            </div>
            {isRegisterMode && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email || !password || (isRegisterMode && !confirmPassword)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegisterMode ? "Create Account" : "Sign In"}
            </Button>
            <div className="flex flex-col items-center gap-2">
              <button 
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={toggleRegisterMode}
              >
                {isRegisterMode ? "Already have an account? Sign In" : "Don't have an account? Register"}
              </button>
            </div>
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