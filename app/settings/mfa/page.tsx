"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Loader2, Copy, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { generateSecretForUser } from "@/lib/mfa"

export default function MFASetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [setupStep, setSetupStep] = useState<"none" | "generate" | "verify" | "done">("none")
  const [secret, setSecret] = useState("")
  const [qrUri, setQrUri] = useState("")
  const [verifyCode, setVerifyCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkMFAStatus()
  }, [])

  const checkMFAStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("mfa_enabled")
      .eq("id", user.id)
      .single()

    setMfaEnabled(profile?.mfa_enabled || false)
    setLoading(false)
  }

  const startSetup = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { secret: newSecret, uri } = generateSecretForUser(user.email || "")
    setSecret(newSecret)
    setQrUri(uri)
    setSetupStep("generate")
  }

  const handleVerifyAndEnable = async () => {
    setError("")
    setSubmitting(true)

    try {
      const response = await fetch("/api/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "verify", 
          code: verifyCode,
          secret 
        })
      })

      const result = await response.json()

      if (result.valid) {
        const enableResponse = await fetch("/api/mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            action: "enable", 
            secret,
            email: ""
          })
        })

        const enableResult = await enableResponse.json()

        if (enableResult.success) {
          setBackupCodes(enableResult.backupCodes)
          setSetupStep("done")
          setMfaEnabled(true)
          setSuccess("Two-factor authentication has been enabled!")
        } else {
          setError(enableResult.error || "Failed to enable MFA")
        }
      } else {
        setError("Invalid code. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const disableMFA = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" })
      })

      const result = await response.json()

      if (result.success) {
        setMfaEnabled(false)
        setSuccess("Two-factor authentication has been disabled.")
        setSetupStep("none")
      } else {
        setError(result.error || "Failed to disable MFA")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Shield className="h-6 w-6" />
            <h1 className="text-xl font-bold">Two-Factor Authentication</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {error && (
          <div className="mb-6 p-4 text-sm text-destructive bg-destructive/10 rounded-md flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 text-sm text-green-600 bg-green-600/10 rounded-md flex items-center gap-2" role="status">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {setupStep === "none" && (
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account using an authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      {mfaEnabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                </div>
                {mfaEnabled ? (
                  <Button variant="destructive" onClick={disableMFA} disabled={submitting}>
                    Disable
                  </Button>
                ) : (
                  <Button onClick={startSetup} disabled={submitting}>
                    Enable
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {setupStep === "generate" && (
          <Card>
            <CardHeader>
              <CardTitle>Set Up Authenticator App</CardTitle>
              <CardDescription>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
                  alt="QR Code"
                  className="border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Or enter this key manually:</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-md font-mono text-sm tracking-wider">
                    {secret}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verify-code">Enter code to verify setup</Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center tracking-widest font-mono text-lg"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSetupStep("none")
                    setError("")
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleVerifyAndEnable}
                  disabled={submitting || verifyCode.length !== 6}
                  className="flex-1"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {setupStep === "done" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Two-Factor Authentication Enabled
              </CardTitle>
              <CardDescription>
                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm font-mono"
                  >
                    <span>{code}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(code, index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => {
                  setSetupStep("none")
                  setSuccess("")
                }}
                className="w-full"
              >
                Done
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}