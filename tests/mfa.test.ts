import { describe, it, expect } from 'vitest'
import { generateBackupCodes, removeUsedBackupCode } from '@/lib/mfa'

describe('MFA Library - Backup Codes', () => {
  it('generates backup codes with proper format', () => {
    const codes = generateBackupCodes(10)
    expect(codes).toHaveLength(10)
    expect(codes[0]).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })

  it('generates default 10 backup codes', () => {
    const codes = generateBackupCodes()
    expect(codes).toHaveLength(10)
  })

  it('generates custom number of backup codes', () => {
    const codes = generateBackupCodes(5)
    expect(codes).toHaveLength(5)
  })

  it('removes used backup code', () => {
    const codes = ['CODE1-1234', 'CODE2-5678', 'CODE3-9012']
    const remaining = removeUsedBackupCode(codes, 'CODE1-1234')
    
    expect(remaining).toHaveLength(2)
    expect(remaining).not.toContain('CODE1-1234')
  })

  it('removes used backup code with different format', () => {
    const codes = ['CODE1-1234', 'CODE2-5678']
    const remaining = removeUsedBackupCode(codes, 'CODE11234')
    
    expect(remaining).toHaveLength(1)
    expect(remaining).not.toContain('CODE1-1234')
  })

  it('returns original array if code not found', () => {
    const codes = ['CODE1-1234', 'CODE2-5678']
    const remaining = removeUsedBackupCode(codes, 'NOTEXIST')
    
    expect(remaining).toHaveLength(2)
    expect(remaining).toEqual(codes)
  })
})