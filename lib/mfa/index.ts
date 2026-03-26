import { generateSecret, generateURI, verify } from "otplib"
import * as crypto from "crypto"

const APP_NAME = "Surveyor Inspection"

export function generateNewSecret(): string {
  return generateSecret()
}

export function generateSecretURL(email: string): string {
  const secret = generateSecret()
  return generateURI({
    secret,
    issuer: APP_NAME,
    label: email
  })
}

export function generateSecretForUser(email: string): { secret: string; uri: string } {
  const secret = generateSecret()
  const uri = generateURI({
    secret,
    issuer: APP_NAME,
    label: email
  })
  return { secret, uri }
}

export async function verifyToken(secret: string, token: string): Promise<boolean> {
  try {
    const result = await verify({ token, secret })
    return result.valid
  } catch {
    return false
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

export function verifyBackupCode(codes: string[], providedCode: string): boolean {
  const normalizedCode = providedCode.replace("-", "").toUpperCase()
  return codes.some(code => code.replace("-", "").toUpperCase() === normalizedCode)
}

export function removeUsedBackupCode(codes: string[], usedCode: string): string[] {
  const normalizedCode = usedCode.replace("-", "").toUpperCase()
  return codes.filter(code => code.replace("-", "").toUpperCase() !== normalizedCode)
}