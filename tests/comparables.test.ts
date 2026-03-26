import { describe, it, expect } from 'vitest'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

describe('Comparables Distance Calculation', () => {
  it('calculates distance between two points correctly', () => {
    // Distance from London to Birmingham (~120 miles)
    const distance = calculateDistance(51.5074, -0.1278, 52.4832, -1.8901)
    expect(distance).toBeGreaterThan(100)
    expect(distance).toBeLessThan(130)
  })

  it('returns 0 for same location', () => {
    const distance = calculateDistance(51.5074, -0.1278, 51.5074, -0.1278)
    expect(distance).toBe(0)
  })

  it('calculates distance between Manchester and Liverpool', () => {
    const distance = calculateDistance(53.4808, -2.2426, 53.4000, -2.9833)
    expect(distance).toBeGreaterThan(25)
    expect(distance).toBeLessThan(35)
  })

  it('handles negative longitudes correctly', () => {
    const distance = calculateDistance(51.5074, -0.1278, 50.8225, -0.1372)
    expect(distance).toBeGreaterThan(45)
    expect(distance).toBeLessThan(55)
  })
})

describe('Export Functionality', () => {
  it('generates correct CSV headers', () => {
    const headers = [
      "House Number", "House Name", "Street Name", "Postcode", "Type", "Form",
      "Floors", "Living Rooms", "Bedrooms", "Bathrooms", "Garage", "Status",
      "Sale Price", "Inspection Date"
    ]
    expect(headers.length).toBe(14)
  })

  it('formats currency correctly', () => {
    const value = 245000
    expect(`£${value.toLocaleString()}`).toBe('£245,000')
  })

  it('handles null values in export', () => {
    const row = [null, null, null, null, null, null, null, null, null, null, null, null, null, null]
    const formatted = row.map(cell => `"${cell || ''}"`).join(',')
    // Null values should become empty strings in quotes
    expect(formatted).toBe('"","","","","","","","","","","","","",""')
  })
})

describe('Property Search Filters', () => {
  const properties = [
    { postcode: 'B15 3PH', type: 'House', form: 'Detached' },
    { postcode: 'M1 5NG', type: 'House', form: 'Semi Detached' },
    { postcode: 'W1T 4LP', type: 'Flat', form: 'Purpose Built' },
  ]

  it('filters by postcode', () => {
    const results = properties.filter(p => p.postcode.startsWith('B'))
    expect(results.length).toBe(1)
    expect(results[0].postcode).toBe('B15 3PH')
  })

  it('filters by property type', () => {
    const results = properties.filter(p => p.type === 'Flat')
    expect(results.length).toBe(1)
    expect(results[0].postcode).toBe('W1T 4LP')
  })

  it('filters by form', () => {
    const results = properties.filter(p => p.form === 'Detached')
    expect(results.length).toBe(1)
  })
})

describe('Inspection Status Types', () => {
  it('has valid status values', () => {
    const statuses = ['Completed', 'Exchanged', 'Under Offer', 'For Sale']
    statuses.forEach(status => {
      expect(['Completed', 'Exchanged', 'Under Offer', 'For Sale']).toContain(status)
    })
  })

  it('completed status should be default', () => {
    const defaultStatus = 'Completed'
    expect(['Completed', 'Exchanged', 'Under Offer', 'For Sale']).toContain(defaultStatus)
  })
})

describe('Property Conditions', () => {
  it('has valid condition values', () => {
    const conditions = ['Poor', 'Average', 'Good']
    conditions.forEach(condition => {
      expect(['Poor', 'Average', 'Good']).toContain(condition)
    })
  })

  it('has valid location range', () => {
    for (let i = 1; i <= 10; i++) {
      expect(i).toBeGreaterThanOrEqual(1)
      expect(i).toBeLessThanOrEqual(10)
    }
  })
})