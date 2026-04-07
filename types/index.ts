export interface Property {
  id: string
  house_name: string | null
  house_number: string | null
  street_name: string | null
  area: string | null
  town: string | null
  postcode: string | null
  type: string | null
  form: string | null
  age: number | null
  floors: string | null
  location: number | null
  condition: string | null
  living_rooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  cloaks: number | null
  utility: number | null
  garage: string | null
  conservatory: number | null
  floor_area: number | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: string
  property_id: string
  user_id: string | null
  reference: string
  inspection_type: string | null
  status: string | null
  valuation: number | null
  sale_price: number | null
  price_per_sqm: number | null
  inspection_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  property?: Property
}

export interface UserProfile {
  id: string
  role: string
  can_view_all: boolean
  created_at: string
}

export type PropertyType = 'House' | 'Bungalow' | 'Flat'
export type PropertyForm = 'Detached' | 'Semi Detached' | 'End Terraced' | 'Mid Terraced' | 'Purpose Built' | 'Converted'
export type PropertyCondition = 'Poor' | 'Average' | 'Good'
export type GarageType = 'None' | 'PS' | 'CP' | 'GGE' | 'DG' | 'TP' | 'O'
export type InspectionType = 'H2B Sale' | 'H2B Repayment' | 'SO Sale' | 'SO Repayment' | 'Sale' | 'Valuation' | 'Other' | 'Comparable'
export type InspectionStatus = 'Completed' | 'Exchanged' | 'Under Offer' | 'For Sale'
export type UserRole = 'admin' | 'user' | 'read_only'