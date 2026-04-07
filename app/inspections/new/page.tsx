"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ClipboardList, Loader2, Search, Building2 } from "lucide-react"
import Link from "next/link"
import { LocationSlider } from "@/components/location-slider"
import type { Property } from "@/types"

export default function NewInspectionPage({ searchParams }: { searchParams: Promise<{ propertyId?: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const params = use(searchParams)
  const [loading, setLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<"existing" | "new">("existing")
  const [propertySearch, setPropertySearch] = useState("")
  const [searchResults, setSearchResults] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    reference: "",
    inspection_type: "",
    floors: "",
    location: "5",
    condition: "Average",
    living_rooms: "1",
    bedrooms: "1",
    bathrooms: "1",
    cloaks: "0",
    utility: "0",
    garage: "None",
    conservatory: "0",
    floor_area: "",
    status: "Completed",
    valuation: "",
    sale_price: "",
    price_per_sqm: "",
    inspection_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    const fetchProperty = async () => {
      if (params.propertyId) {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .eq("id", params.propertyId)
          .single()
        
        if (data) {
          setSelectedProperty(data)
          setSearchMode("existing")
        }
      }
    }
    fetchProperty()
  }, [params.propertyId, supabase])

  useEffect(() => {
    const searchProperties = async () => {
      if (propertySearch.length >= 2) {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .or(`postcode.ilike.%${propertySearch}%,street_name.ilike.%${propertySearch}%,house_number.ilike.%${propertySearch}%`)
          .limit(10)
        
        if (data) setSearchResults(data)
      } else {
        setSearchResults([])
      }
    }

    const timeoutId = setTimeout(searchProperties, 300)
    return () => clearTimeout(timeoutId)
  }, [propertySearch, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProperty) {
      alert("Please select a property")
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const floorArea = formData.floor_area ? parseFloat(formData.floor_area) : 1
      const valuation = parseFloat(formData.valuation) || 0
      const calculatedPricePerSqm = formData.price_per_sqm ? parseFloat(formData.price_per_sqm) : (valuation / floorArea)

      const { error } = await supabase.from("inspections").insert({
        property_id: selectedProperty.id,
        user_id: user?.id,
        reference: formData.reference,
        inspection_type: formData.inspection_type || null,
        floors: formData.floors || null,
        location: parseInt(formData.location),
        condition: formData.condition,
        living_rooms: parseInt(formData.living_rooms),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        cloaks: parseInt(formData.cloaks),
        utility: parseInt(formData.utility),
        garage: formData.garage,
        conservatory: parseInt(formData.conservatory),
        floor_area: formData.floor_area ? parseInt(formData.floor_area) : null,
        status: formData.status || null,
        valuation: formData.valuation ? parseFloat(formData.valuation) : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        price_per_sqm: calculatedPricePerSqm || null,
        inspection_date: formData.inspection_date || null,
        notes: formData.notes || null,
      })

      if (error) throw error
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating survey record:", error)
      alert("Failed to create survey record")
    } finally {
      setSubmitting(false)
    }
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
            <ClipboardList className="h-6 w-6" />
            <h1 className="text-xl font-bold">New Survey Record</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Selection</CardTitle>
                <CardDescription>Select an existing property or add a new one</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={searchMode === "existing" ? "default" : "outline"}
                    onClick={() => setSearchMode("existing")}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={searchMode === "new" ? "default" : "outline"}
                    onClick={() => router.push("/properties/new?redirect=/inspections/new")}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Add New Property
                  </Button>
                </div>

                {searchMode === "existing" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Search for a property</Label>
                      <Input
                        placeholder="Search by postcode, street, or number..."
                        value={propertySearch}
                        onChange={(e) => setPropertySearch(e.target.value)}
                      />
                    </div>

                    {searchResults.length > 0 && !selectedProperty && (
                      <div className="border rounded-md max-h-60 overflow-y-auto">
                        {searchResults.map((property) => (
                          <button
                            key={property.id}
                            type="button"
                            className="w-full text-left p-3 hover:bg-muted border-b last:border-0"
                            onClick={() => {
                              setSelectedProperty(property)
                              setSearchResults([])
                              setPropertySearch("")
                            }}
                          >
                            <div className="font-medium">
                              {property.house_number} {property.street_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.postcode} • {property.type}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedProperty && (
                      <div className="p-4 border rounded-md bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {selectedProperty.house_number} {selectedProperty.street_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {selectedProperty.postcode} • {selectedProperty.type} • {selectedProperty.form}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProperty(null)}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Survey Record Details</CardTitle>
                <CardDescription>Enter survey record information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference *</Label>
                    <Input
                      id="reference"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inspection_type">Survey Type</Label>
                    <Select
                      value={formData.inspection_type}
                      onValueChange={(value) => setFormData({ ...formData, inspection_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="H2B Sale">H2B Sale</SelectItem>
                        <SelectItem value="H2B Repayment">H2B Repayment</SelectItem>
                        <SelectItem value="SO Sale">SO Sale</SelectItem>
                        <SelectItem value="SO Repayment">SO Repayment</SelectItem>
                        <SelectItem value="Sale">Sale</SelectItem>
                        <SelectItem value="Valuation">Valuation</SelectItem>
                        <SelectItem value="Comparable">Comparable</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="floors">Floors</Label>
                    <Input
                      id="floors"
                      value={formData.floors}
                      onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                      placeholder="2"
                    />
                  </div>
                  <div className="space-y-2">
                    <LocationSlider
                      value={parseInt(formData.location)}
                      onChange={(value) => setFormData({ ...formData, location: String(value) })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Poor">Poor</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="living_rooms">Living Rooms</Label>
                    <Input
                      id="living_rooms"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.living_rooms}
                      onChange={(e) => setFormData({ ...formData, living_rooms: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cloaks">Cloaks</Label>
                    <Input
                      id="cloaks"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.cloaks}
                      onChange={(e) => setFormData({ ...formData, cloaks: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="utility">Utility</Label>
                    <Input
                      id="utility"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.utility}
                      onChange={(e) => setFormData({ ...formData, utility: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conservatory">Conservatory</Label>
                    <Input
                      id="conservatory"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.conservatory}
                      onChange={(e) => setFormData({ ...formData, conservatory: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="garage">Garage</Label>
                    <Select
                      value={formData.garage}
                      onValueChange={(value) => setFormData({ ...formData, garage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="PS">PS - Parking Space</SelectItem>
                        <SelectItem value="CP">CP - Car Port</SelectItem>
                        <SelectItem value="GGE">GGE - Garage</SelectItem>
                        <SelectItem value="DG">DG - Double Garage</SelectItem>
                        <SelectItem value="TP">TP - Triple Garage</SelectItem>
                        <SelectItem value="O">O - Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Exchanged">Exchanged</SelectItem>
                        <SelectItem value="Under Offer">Under Offer</SelectItem>
                        <SelectItem value="For Sale">For Sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inspection_date">Survey Date</Label>
                    <Input
                      id="inspection_date"
                      type="date"
                      value={formData.inspection_date}
                      onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="floor_area">Floor Area (sq ft)</Label>
                    <Input
                      id="floor_area"
                      type="number"
                      value={formData.floor_area}
                      onChange={(e) => setFormData({ ...formData, floor_area: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valuation">Valuation (£)</Label>
                    <Input
                      id="valuation"
                      type="number"
                      value={formData.valuation}
                      onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                      placeholder="250000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Sale Price (£)</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      placeholder="245000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_sqm">£ per sq m</Label>
                    <Input
                      id="price_per_sqm"
                      type="number"
                      value={formData.price_per_sqm}
                      onChange={(e) => setFormData({ ...formData, price_per_sqm: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Survey Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Survey notes..."
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Link href="/dashboard">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={!selectedProperty || submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Survey Record
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  )
}
