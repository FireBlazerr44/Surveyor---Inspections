"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search, Download, Loader2, MapPin } from "lucide-react"
import Link from "next/link"
import type { Property, Inspection } from "@/types"

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface ComparableProperty extends Property {
  inspection?: Inspection
  distance?: number
}

export default function ComparablesPage({ searchParams }: { searchParams: Promise<{ propertyId?: string; radius?: string }> }) {
  const params = use(searchParams)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [comparables, setComparables] = useState<ComparableProperty[]>([])
  const [radius, setRadius] = useState(params.radius || "same_postcode")

  useEffect(() => {
    const fetchProperty = async () => {
      if (params.propertyId) {
        const { data } = await supabase
          .from("properties")
          .select("*")
          .eq("id", params.propertyId)
          .single()
        
        if (data) setProperty(data)
      }
    }
    fetchProperty()
  }, [params.propertyId, supabase])

  const searchComparables = async () => {
    if (!property) return
    
    setLoading(true)
    try {
      let query = supabase
        .from("properties")
        .select(`
          id, house_number, house_name, street_name, area, town, postcode, type, form,
          floors, living_rooms, bedrooms, bathrooms, garage, floor_area,
          latitude, longitude,
          inspections (
            id, reference, status, sale_price, inspection_date
          )
        `)
        .neq("id", property.id)

      let results: ComparableProperty[] = []

      if (radius === "same_postcode") {
        const { data } = await query.eq("postcode", property.postcode).limit(20)
        results = (data || []).map((p: any) => ({
          ...p,
          inspection: p.inspections?.[0] || null,
          distance: 0
        }))
      } else if (property.latitude && property.longitude) {
        const { data } = await query
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(50)

        const radiusMiles = radius === "0.25" ? 0.25 : 0.5
        
        results = (data || [])
          .map((p: any) => {
            const distance = calculateDistance(
              property.latitude!,
              property.longitude!,
              p.latitude,
              p.longitude
            )
            return {
              ...p,
              inspection: p.inspections?.[0] || null,
              distance
            }
          })
          .filter((p) => (p.distance ?? Infinity) <= radiusMiles)
          .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
          .slice(0, 20)
      }

      setComparables(results)
    } catch (error) {
      console.error("Error searching comparables:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (property) {
      searchComparables()
    }
  }, [property, radius])

  const exportToCSV = () => {
    const headers = [
      "House Number", "House Name", "Street Name", "Postcode", "Type", "Form",
      "Floors", "Living Rooms", "Bedrooms", "Bathrooms", "Garage", "Status",
      "Sale Price", "Inspection Date"
    ]

    const rows = comparables.map(p => [
      p.house_number || "",
      p.house_name || "",
      p.street_name || "",
      p.postcode || "",
      p.type || "",
      p.form || "",
      p.floors || "",
      p.living_rooms || "",
      p.bedrooms || "",
      p.bathrooms || "",
      p.garage || "",
      p.inspection?.status || "",
      p.inspection?.sale_price || "",
      p.inspection?.inspection_date || ""
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `comparables_${property?.postcode || "export"}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading property...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/properties/${property.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <MapPin className="h-6 w-6" />
            <h1 className="text-xl font-bold">Search Comparables</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Target Property</CardTitle>
            <CardDescription>
              {property.house_number} {property.street_name}, {property.postcode}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-sm">
                <span className="text-muted-foreground">Type:</span> {property.type} • {property.form}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Bedrooms:</span> {property.bedrooms}
              </div>
              {property.latitude && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Location:</span> {property.latitude.toFixed(4)}, {property.longitude?.toFixed(4)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Radius</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_postcode">Same Postcode</SelectItem>
                  <SelectItem value="0.25">Within 0.25 mile</SelectItem>
                  <SelectItem value="0.5">Within 0.5 mile</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={searchComparables} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>{comparables.length} comparable properties found</CardDescription>
            </div>
            {comparables.length > 0 && (
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : comparables.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Address</th>
                      <th className="p-3 text-left text-sm font-medium">Postcode</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-left text-sm font-medium">Beds</th>
                      <th className="p-3 text-left text-sm font-medium">Sale Price</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      <th className="p-3 text-left text-sm font-medium">Date</th>
                      {radius !== "same_postcode" && (
                        <th className="p-3 text-left text-sm font-medium">Distance</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {comparables.map((comp) => (
                      <tr key={comp.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <Link href={`/properties/${comp.id}`} className="hover:underline">
                            {comp.house_number} {comp.street_name}
                          </Link>
                        </td>
                        <td className="p-3">{comp.postcode}</td>
                        <td className="p-3">{comp.type}</td>
                        <td className="p-3">{comp.bedrooms}</td>
                        <td className="p-3">
                          {comp.inspection?.sale_price
                            ? `£${comp.inspection.sale_price.toLocaleString()}`
                            : "N/A"}
                        </td>
                        <td className="p-3">{comp.inspection?.status || "N/A"}</td>
                        <td className="p-3">{comp.inspection?.inspection_date || "N/A"}</td>
                        {radius !== "same_postcode" && (
                          <td className="p-3">
                            {comp.distance !== undefined ? `${comp.distance.toFixed(2)} mi` : "N/A"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No comparable properties found. Try a different radius.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}