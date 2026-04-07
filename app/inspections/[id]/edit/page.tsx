"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react"
import Link from "next/link"
import { LocationSlider } from "@/components/location-slider"

export default function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: inspectionId } = use(params)
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

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
    status: "Completed",
    valuation: "",
    sale_price: "",
    price_per_sqm: "",
    floor_area: "",
    inspection_date: "",
    notes: "",
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
        router.push("/dashboard")
        return
      }

      // Load inspection data
      const { data: inspection } = await supabase
        .from("inspections")
        .select("*")
        .eq("id", inspectionId)
        .single()

      if (inspection) {
        setFormData({
          reference: inspection.reference || "",
          inspection_type: inspection.inspection_type || "",
          floors: inspection.floors || "",
          location: String(inspection.location || "5"),
          condition: inspection.condition || "Average",
          living_rooms: String(inspection.living_rooms || "1"),
          bedrooms: String(inspection.bedrooms || "1"),
          bathrooms: String(inspection.bathrooms || "1"),
          cloaks: String(inspection.cloaks || "0"),
          utility: String(inspection.utility || "0"),
          garage: inspection.garage || "None",
          conservatory: String(inspection.conservatory || "0"),
          status: inspection.status || "Completed",
          valuation: String(inspection.valuation || ""),
          sale_price: String(inspection.sale_price || ""),
          price_per_sqm: String(inspection.price_per_sqm || ""),
          floor_area: String(inspection.floor_area || ""),
          inspection_date: inspection.inspection_date || "",
          notes: inspection.notes || "",
        })
      }

      setLoading(false)
    }

    checkUserAndLoad()
  }, [router, supabase, inspectionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const floorArea = formData.floor_area ? parseFloat(formData.floor_area) : 1
      const valuation = parseFloat(formData.valuation) || 0
      const calculatedPricePerSqm = formData.price_per_sqm ? parseFloat(formData.price_per_sqm) : (valuation / floorArea)

      const { error } = await supabase.from("inspections").update({
        reference: formData.reference,
        inspection_type: formData.inspection_type || null,
        floors: formData.floors || null,
        location: parseInt(formData.location),
        condition: formData.condition || null,
        living_rooms: parseInt(formData.living_rooms),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        cloaks: parseInt(formData.cloaks),
        utility: parseInt(formData.utility),
        garage: formData.garage || null,
        conservatory: parseInt(formData.conservatory),
        floor_area: formData.floor_area ? parseInt(formData.floor_area) : null,
        status: formData.status || null,
        valuation: formData.valuation ? parseFloat(formData.valuation) : null,
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        price_per_sqm: calculatedPricePerSqm || null,
        inspection_date: formData.inspection_date || null,
        notes: formData.notes || null,
      }).eq("id", inspectionId)

      if (error) throw error
      router.push(`/inspections/${inspectionId}`)
    } catch (error) {
      console.error("Error updating inspection:", error)
      alert("Failed to update inspection")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this inspection? This action cannot be undone.")) {
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from("inspections").delete().eq("id", inspectionId)
      if (error) throw error
      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting inspection:", error)
      alert("Failed to delete inspection")
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/inspections/${inspectionId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <ClipboardList className="h-6 w-6" />
            <h1 className="text-xl font-bold">Edit Survey Record</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Survey Record Details</CardTitle>
              <CardDescription>Update survey record information</CardDescription>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valuation">Valuation (£)</Label>
                  <Input
                    id="valuation"
                    type="number"
                    value={formData.valuation}
                    onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Sale Price (£)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_sqm">£ per sq m</Label>
                  <Input
                    id="price_per_sqm"
                    type="number"
                    value={formData.price_per_sqm}
                    onChange={(e) => setFormData({ ...formData, price_per_sqm: e.target.value })}
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
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={submitting}>
              Delete Survey Record
            </Button>
            <div className="flex gap-4">
              <Link href={`/inspections/${inspectionId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

