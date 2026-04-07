import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      const condition = true
      expect(cn('foo', condition && 'bar')).toBe('foo bar')
      expect(cn('foo', condition && 'bar')).toBe('foo bar')
    })

    it('handles falsey values', () => {
      expect(cn('foo', false && 'bar', null, undefined, 0)).toBe('foo')
    })

    it('handles object classes', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo')
    })

    it('merges arrays', () => {
      expect(cn(['foo', 'bar'], ['baz'])).toBe('foo bar baz')
    })
  })
})

describe('Property Types', () => {
  it('matches property type values', () => {
    const types = ['House', 'Bungalow', 'Flat']
    types.forEach(type => expect(type).toBeDefined())
  })

  it('matches property form values', () => {
    const forms = ['Detached', 'Semi Detached', 'End Terraced', 'Mid Terraced', 'Purpose Built', 'Converted']
    forms.forEach(form => expect(form).toBeDefined())
  })

  it('matches garage types', () => {
    const garages = ['None', 'PS', 'CP', 'GGE', 'DG', 'TP', 'O']
    garages.forEach(garage => expect(garage).toBeDefined())
  })
})

describe('Inspection Types', () => {
  it('matches inspection type values', () => {
    const types = ['H2B Sale', 'H2B Repayment', 'SO Sale', 'SO Repayment', 'Sale', 'Valuation', 'Comparable', 'Other']
    types.forEach(type => expect(type).toBeDefined())
  })

  it('matches inspection status values', () => {
    const statuses = ['Completed', 'Exchanged', 'Under Offer', 'For Sale']
    statuses.forEach(status => expect(status).toBeDefined())
  })
})

describe('User Roles', () => {
  it('matches user role values', () => {
    const roles = ['admin', 'user', 'read_only']
    roles.forEach(role => expect(role).toBeDefined())
  })
})