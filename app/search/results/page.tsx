"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Loader2, ChevronUp, ChevronDown } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { formatDate } from "@/lib/utils"

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

interface ComparableResult {
  id: string
  property_id: string
  inspection_id: string
  house_number: string | null
  house_name: string | null
  street_name: string | null
  postcode: string | null
  type: string | null
  form: string | null
  floors: string | null
  living_rooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  garage: string | null
  inspection_type: string | null
  status: string | null
  sale_price: number | null
  inspection_date: string | null
  latitude: number | null
  longitude: number | null
  distance: number
}

type SortField = "distance" | "house_number" | "house_name" | "street_name" | "postcode" | "type" | "form" | "bedrooms" | "bathrooms" | "sale_price" | "inspection_date" | "status" | "inspection_type"
type SortDirection = "asc" | "desc"

function PropertyIllustration({ type, className }: { type?: string | null; className?: string }) {
  const colors: Record<string, { bg: string; light: string }> = {
    House: { bg: "#22c55e", light: "#dcfce7" },
    Bungalow: { bg: "#3b82f6", light: "#dbeafe" },
    Flat: { bg: "#f59e0b", light: "#fef3c7" },
    default: { bg: "#6b7280", light: "#f3f4f6" }
  }
  
  const style = type ? (colors[type] || colors.default) : colors.default
  
  return (
    <div className={`${className}`} style={{ width: 40, height: 40 }}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill={style.light} />
        {type === "House" && (
          <path d="M20 8L8 18V32H14V24H26V32H32V18L20 8Z" fill={style.bg} />
        )}
        {type === "Bungalow" && (
          <path d="M20 12L8 22V32H32V22L20 12ZM11 29V25H15V29H11ZM19 29V25H21V29H19ZM25 29V25H29V29H25Z" fill={style.bg} />
        )}
        {type === "Flat" && (
          <path d="M8 8H32V32H8V8ZM11 11V21H19V11H11ZM21 11V21H29V11H21ZM11 23V29H19V23H11ZM21 23V29H29V23H21Z" fill={style.bg} />
        )}
        {!type && (
          <path d="M20 8L8 18V32H14V24H26V32H32V18L20 8Z" fill={style.bg} />
        )}
      </svg>
    </div>
  )
}

export default function ResultsPage({ searchParams }: { searchParams: Promise<{ postcode: string; type?: string; radius?: string }> }) {
  const router = useRouter()
  const params = use(searchParams)
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [userRole, setUserRole] = useState("user")
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [postcode, setPostcode] = useState("")
  const [propertyType, setPropertyType] = useState("all")
  const [radius, setRadius] = useState("same_postcode")
  
  const [targetLat, setTargetLat] = useState<number | null>(null)
  const [targetLng, setTargetLng] = useState<number | null>(null)
  
  const [results, setResults] = useState<ComparableResult[]>([])
  const [displayedResults, setDisplayedResults] = useState<ComparableResult[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const [sortField, setSortField] = useState<SortField>("distance")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUserEmail(user.email || "")
        
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        
        const role = profile?.role || "user"
        setUserRole(role)
        setIsAdmin(role === "admin")
      }
    }
    checkAuth()
  }, [router, supabase])

  useEffect(() => {
    const initSearch = async () => {
      const p = await params
      setPostcode(p.postcode || "")
      setPropertyType(p.type || "all")
      setRadius(p.radius || "same_postcode")
      
      if (p.postcode) {
        await performSearch(p.postcode, p.type || "all", p.radius || "same_postcode")
      }
    }
    initSearch()
  }, [params])

  useEffect(() => {
    if (results.length > 0) {
      let filtered = [...results]
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(r => 
          r.house_number?.toLowerCase().includes(term) ||
          r.house_name?.toLowerCase().includes(term) ||
          r.street_name?.toLowerCase().includes(term) ||
          r.postcode?.toLowerCase().includes(term) ||
          r.type?.toLowerCase().includes(term) ||
          r.form?.toLowerCase().includes(term)
        )
      }
      
      filtered.sort((a, b) => {
        let aVal: any = a[sortField]
        let bVal: any = b[sortField]
        
        if (sortField === "inspection_date") {
          aVal = aVal ? new Date(aVal).getTime() : 0
          bVal = bVal ? new Date(bVal).getTime() : 0
        } else if (typeof aVal === "string") {
          aVal = aVal?.toLowerCase() || ""
          bVal = bVal?.toLowerCase() || ""
        }
        
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
      
      setDisplayedResults(filtered.slice(0, 20))
    }
  }, [results, searchTerm, sortField, sortDirection])

  const performSearch = async (postcodeParam: string, typeParam: string, radiusParam: string) => {
    setLoading(true)
    setGeocoding(true)
    
    try {
      let targetLatVar: number | null = null
      let targetLngVar: number | null = null
      
      if (radiusParam !== "same_postcode") {
        const response = await fetch(
          `https://api.postcodes.io/postcodes/${postcodeParam.replace(/\s/g, "")}`
        )
        const data = await response.json()
        if (data.status === 200) {
          targetLatVar = data.result.latitude
          targetLngVar = data.result.longitude
          setTargetLat(targetLatVar)
          setTargetLng(targetLngVar)
        }
      }
      setGeocoding(false)
      
      let query = supabase
        .from("inspections")
        .select(`
          id,
          property_id,
          inspection_type,
          status,
          sale_price,
          inspection_date,
          property:properties (
            id, house_number, house_name, street_name, postcode, type, form,
            floors, living_rooms, bedrooms, bathrooms, garage, latitude, longitude
          )
        `)
        .not("sale_price", "is", null)
        .not("property_id", "is", null)
      
      if (typeParam !== "all") {
        query = query.eq("property.type", typeParam)
      }
      
      const { data: inspections } = await query
      
      if (!inspections) {
        setResults([])
        return
      }
      
      let processedResults: ComparableResult[] = (inspections as any[]).map(inspection => {
        const property = inspection.property
        let distance = 0
        
        if (radiusParam !== "same_postcode" && targetLatVar && targetLngVar && property?.latitude && property?.longitude) {
          distance = calculateDistance(targetLatVar, targetLngVar, property.latitude, property.longitude)
        } else if (radiusParam === "same_postcode" && property?.postcode) {
          distance = 0
        } else {
          distance = Infinity
        }
        
        return {
          id: inspection.id,
          property_id: property?.id || "",
          inspection_id: inspection.id,
          house_number: property?.house_number || null,
          house_name: property?.house_name || null,
          street_name: property?.street_name || null,
          postcode: property?.postcode || null,
          type: property?.type || null,
          form: property?.form || null,
          floors: property?.floors || null,
          living_rooms: property?.living_rooms || null,
          bedrooms: property?.bedrooms || null,
          bathrooms: property?.bathrooms || null,
          garage: property?.garage || null,
          inspection_type: inspection.inspection_type,
          status: inspection.status,
          sale_price: inspection.sale_price,
          inspection_date: inspection.inspection_date,
          latitude: property?.latitude || null,
          longitude: property?.longitude || null,
          distance
        }
      })
      
      if (radiusParam === "same_postcode") {
        processedResults = processedResults
          .filter(r => r.postcode?.toUpperCase() === postcodeParam.toUpperCase())
          .slice(0, 20)
      } else {
        const radiusMiles = radiusParam === "0.25" ? 0.25 : 0.5
        processedResults = processedResults
          .filter(r => r.distance <= radiusMiles && r.distance !== Infinity)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 20)
      }
      
      setResults(processedResults)
      setDisplayedResults(processedResults)
      
    } catch (error) {
      console.error("Error searching:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    router.push(`/search/results?postcode=${encodeURIComponent(postcode)}&type=${propertyType}&radius=${radius}`)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedResults.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayedResults.map(r => r.id)))
    }
  }

  const exportToCSV = () => {
    const selectedResults = results.filter(r => selectedIds.has(r.id))
    
    const headers = [
      "Distance (miles)", "House Number", "House Name", "Street Name", "Postcode",
      "Type", "Form", "Floors", "Living Rooms", "Bedrooms", "Bathrooms", "Garage",
      "Inspection Type", "Status", "Sale Price", "Inspection Date"
    ]

    const rows = selectedResults.map(r => [
      r.distance.toFixed(2),
      r.house_number || "",
      r.house_name || "",
      r.street_name || "",
      r.postcode || "",
      r.type || "",
      r.form || "",
      r.floors || "",
      r.living_rooms?.toString() || "",
      r.bedrooms?.toString() || "",
      r.bathrooms?.toString() || "",
      r.garage || "",
      r.inspection_type || "",
      r.status || "",
      r.sale_price?.toString() || "",
      r.inspection_date || ""
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `comparables_${postcode || "export"}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loadMore = () => {
    const currentLength = displayedResults.length
    const more = results.slice(currentLength, currentLength + 20)
    setDisplayedResults([...displayedResults, ...more])
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={userEmail} userRole={userRole} isAdmin={isAdmin} />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8 border-2 border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <Label htmlFor="postcode" className="mb-2 block">Postcode</Label>
                <Input
                  id="postcode"
                  placeholder="Enter postcode e.g. B15 3PH"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="text-lg h-12"
                />
              </div>
              <div className="w-full md:w-[180px]">
                <Label className="mb-2 block">Property Type</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="House">House</SelectItem>
                    <SelectItem value="Bungalow">Bungalow</SelectItem>
                    <SelectItem value="Flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-[180px]">
                <Label className="mb-2 block">Radius</Label>
                <Select value={radius} onValueChange={setRadius}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_postcode">Same Postcode</SelectItem>
                    <SelectItem value="0.25">Within 0.25 mile</SelectItem>
                    <SelectItem value="0.5">Within 0.5 mile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} disabled={loading || geocoding || !postcode} className="w-full md:w-auto h-12 px-8 text-lg">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Results</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {results.length} properties found
                {searchTerm && ` (${displayedResults.length} shown, filtered by "${searchTerm}")`}
              </p>
            </div>
            {selectedIds.size > 0 && (
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export {selectedIds.size} to CSV
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Filter results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {loading || geocoding ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : displayedResults.length > 0 ? (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === displayedResults.length && displayedResults.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("distance")}>
                          <div className="flex items-center gap-1">Distance <SortIcon field="distance" /></div>
                        </th>
                        <th className="p-2 text-left font-medium">Type</th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("house_number")}>
                          <div className="flex items-center gap-1">House # <SortIcon field="house_number" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("house_name")}>
                          <div className="flex items-center gap-1">House Name <SortIcon field="house_name" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("street_name")}>
                          <div className="flex items-center gap-1">Street Name <SortIcon field="street_name" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("postcode")}>
                          <div className="flex items-center gap-1">Postcode <SortIcon field="postcode" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("form")}>
                          <div className="flex items-center gap-1">Form <SortIcon field="form" /></div>
                        </th>
                        <th className="p-2 text-left font-medium">Floors</th>
                        <th className="p-2 text-left font-medium">Living</th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("bedrooms")}>
                          <div className="flex items-center gap-1">Beds <SortIcon field="bedrooms" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("bathrooms")}>
                          <div className="flex items-center gap-1">Baths <SortIcon field="bathrooms" /></div>
                        </th>
                        <th className="p-2 text-left font-medium">Garage</th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("inspection_type")}>
                          <div className="flex items-center gap-1">Insp. Type <SortIcon field="inspection_type" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("status")}>
                          <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("sale_price")}>
                          <div className="flex items-center gap-1">Sale Price <SortIcon field="sale_price" /></div>
                        </th>
                        <th className="p-2 text-left font-medium cursor-pointer hover:bg-muted" onClick={() => handleSort("inspection_date")}>
                          <div className="flex items-center gap-1">Insp. Date <SortIcon field="inspection_date" /></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedResults.map((result) => (
                        <tr 
                          key={result.id} 
                          className={`border-b hover:bg-muted/50 cursor-pointer ${selectedIds.has(result.id) ? "bg-primary/10" : ""}`}
                          onClick={() => toggleSelection(result.id)}
                        >
                          <td className="p-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(result.id)}
                              onChange={() => toggleSelection(result.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="p-2">
                            {result.distance !== Infinity ? `${result.distance.toFixed(2)} mi` : "N/A"}
                          </td>
                          <td className="p-2">
                            <PropertyIllustration type={result.type} className="w-8 h-8" />
                          </td>
                          <td className="p-2">{result.house_number || "-"}</td>
                          <td className="p-2">{result.house_name || "-"}</td>
                          <td className="p-2">{result.street_name || "-"}</td>
                          <td className="p-2">{result.postcode || "-"}</td>
                          <td className="p-2">{result.form || "-"}</td>
                          <td className="p-2">{result.floors || "-"}</td>
                          <td className="p-2">{result.living_rooms ?? "-"}</td>
                          <td className="p-2">{result.bedrooms ?? "-"}</td>
                          <td className="p-2">{result.bathrooms ?? "-"}</td>
                          <td className="p-2">{result.garage || "-"}</td>
                          <td className="p-2">{result.inspection_type || "-"}</td>
                          <td className="p-2">{result.status || "-"}</td>
                          <td className="p-2">{result.sale_price ? `£${result.sale_price.toLocaleString()}` : "-"}</td>
                          <td className="p-2">{result.inspection_date ? formatDate(result.inspection_date) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {displayedResults.length < results.length && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={loadMore}>
                      Load More ({results.length - displayedResults.length} remaining)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                No comparable properties found. Try a different postcode or radius.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
