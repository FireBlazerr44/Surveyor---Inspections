"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building2, Loader2 } from "lucide-react"
import Link from "next/link"

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const propertyId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

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
    notes: "",
    latitude: null as number | null,
    longitude: null as number | null,
  })

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const role = profile?.role || "user"
      setUserRole(role)

      if (role === "read_only") {
        router.push("/properties/search")
        return
      }

      // Load property data
      const { data: property } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single()

      if (property) {
        setFormData({
          house_name: property.house_name || "",
          house_number: property.house_number || "",
          street_name: property.street_name || "",
          area: property.area || "",
          town: property.town || "",
          postcode: property.postcode || "",
          type: property.type || "",
          form: property.form || "",
          age: property.age ? String(property.age) : "",
          notes: property.notes || "",
          latitude: property.latitude,
          longitude: property.longitude,
        })
      }

      setLoading(false)
    }

    checkUserAndLoad()
  }, [router, supabase, propertyId])

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
    setSubmitting(true)

    try {
      const { error } = await supabase.from("properties").update({
        house_name: formData.house_name || null,
        house_number: formData.house_number || null,
        street_name: formData.street_name || null,
        area: formData.area || null,
        town: formData.town || null,
        postcode: formData.postcode || null,
        type: formData.type || null,
        form: formData.form || null,
        age: formData.age ? parseInt(formData.age) : null,
        notes: formData.notes || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
      }).eq("id", propertyId)

      if (error) throw error
      router.push(`/properties/${propertyId}`)
    } catch (error) {
      console.error("Error updating property:", error)
      alert("Failed to update property")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this property? This will also delete all associated inspections. This action cannot be undone.")) {
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("properties").delete().eq("id", propertyId)
      if (error) throw error
      router.push("/properties/search")
    } catch (error) {
      console.error("Error deleting property:", error)
      alert("Failed to delete property")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (userRole === "read_only") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/properties/${propertyId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Building2 className="h-6 w-6" />
            <h1 className="text-xl font-bold">Edit Property</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
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
              <div className="flex justify-between">
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
                  Delete Property
                </Button>
                <div className="flex gap-4">
                  <Link href={`/properties/${propertyId}`}>
                    <Button type="button" variant="outline">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}