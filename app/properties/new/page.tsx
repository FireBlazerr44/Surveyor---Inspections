"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewPropertyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  const [formData, setFormData] = useState({
    house_name: "",
    house_number: "",
    street_name: "",
    area: "",
    town: "",
    postcode: "",
    type: "",
    form: "",
    age: "",
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
    notes: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })

  useEffect(() => {
    const geocodePostcode = async () => {
      if (formData.postcode && formData.postcode.length >= 5) {
        setGeocoding(true)
        try {
          const response = await fetch(
            `https://api.postcodes.io/postcodes/${formData.postcode.replace(/\s/g, "")}`
          )
          const data = await response.json()
          if (data.status === 200) {
            setFormData((prev) => ({
              ...prev,
              latitude: data.result.latitude,
              longitude: data.result.longitude,
              town: prev.town || data.result.admin_district || "",
            }))
          }
        } catch (error) {
          console.error("Geocoding error:", error)
        } finally {
          setGeocoding(false)
        }
      }
    }

    const timeoutId = setTimeout(geocodePostcode, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.postcode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("properties").insert({
        house_name: formData.house_name || null,
        house_number: formData.house_number || null,
        street_name: formData.street_name || null,
        area: formData.area || null,
        town: formData.town || null,
        postcode: formData.postcode || null,
        type: formData.type || null,
        form: formData.form || null,
        age: formData.age ? parseInt(formData.age) : null,
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
        notes: formData.notes || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
      })

      if (error) throw error
      router.push("/properties/search")
    } catch (error) {
      console.error("Error creating property:", error)
      alert("Failed to create property")
    } finally {
      setLoading(false)
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
            <Building2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">Add New Property</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Address Details</CardTitle>
                <CardDescription>Enter the property address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="house_number">House Number</Label>
                    <Input
                      id="house_number"
                      value={formData.house_number}
                      onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="house_name">House Name</Label>
                    <Input
                      id="house_name"
                      value={formData.house_name}
                      onChange={(e) => setFormData({ ...formData, house_name: e.target.value })}
                      placeholder="Willow House"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street_name">Street Name *</Label>
                  <Input
                    id="street_name"
                    value={formData.street_name}
                    onChange={(e) => setFormData({ ...formData, street_name: e.target.value })}
                    placeholder="Church Lane"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Newtown"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="town">Town</Label>
                    <Input
                      id="town"
                      value={formData.town}
                      onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                      placeholder="Birmingham"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">
                      Postcode * {geocoding && <span className="text-muted-foreground">(Looking up coordinates...)</span>}
                    </Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value.toUpperCase() })}
                      placeholder="B15 3PH"
                      required
                    />
                    {formData.latitude && (
                      <p className="text-xs text-muted-foreground">
                        Coordinates: {formData.latitude.toFixed(4)}, {formData.longitude?.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>Enter property specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Bungalow">Bungalow</SelectItem>
                        <SelectItem value="Flat">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form">Form *</Label>
                    <Select
                      value={formData.form}
                      onValueChange={(value) => setFormData({ ...formData, form: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Detached">Detached</SelectItem>
                        <SelectItem value="Semi Detached">Semi Detached</SelectItem>
                        <SelectItem value="End Terraced">End Terraced</SelectItem>
                        <SelectItem value="Mid Terraced">Mid Terraced</SelectItem>
                        <SelectItem value="Purpose Built">Purpose Built (flats only)</SelectItem>
                        <SelectItem value="Converted">Converted (flats only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="age">Year Built (1899-2026)</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1899"
                      max="2026"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="1925"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floors">Floors</Label>
                    <Input
                      id="floors"
                      value={formData.floors}
                      onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                      placeholder="2"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (1-10)</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => setFormData({ ...formData, location: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {i + 1} - {i + 1 <= 3 ? "Poor" : i + 1 <= 6 ? "Average" : "Excellent"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
                <CardDescription>Number of rooms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
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
                </div>
                <div className="grid gap-4 md:grid-cols-4">
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
                <div className="space-y-2">
                  <Label htmlFor="floor_area">Floor Area (sq ft)</Label>
                  <Input
                    id="floor_area"
                    type="number"
                    value={formData.floor_area}
                    onChange={(e) => setFormData({ ...formData, floor_area: e.target.value })}
                    placeholder="1200"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the property..."
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Link href="/dashboard">
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Property
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