"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Home, Building, Building2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"

export default function SearchPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [userRole, setUserRole] = useState("user")
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [postcode, setPostcode] = useState("")
  const [propertyType, setPropertyType] = useState("all")
  const [radius, setRadius] = useState("same_postcode")

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

  const handleSearch = () => {
    if (!postcode) return
    router.push(`/search/results?postcode=${encodeURIComponent(postcode)}&type=${propertyType}&radius=${radius}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={userEmail} userRole={userRole} isAdmin={isAdmin} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Property Comparables</h1>
          <p className="text-muted-foreground">Search and compare property sales in your area</p>
        </div>

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
              <Button onClick={handleSearch} disabled={loading || !postcode} className="w-full md:w-auto h-12 px-8 text-lg">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="border-0 shadow-none bg-transparent text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Home className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Houses</h3>
            <p className="text-sm text-muted-foreground">Find comparable house sales with detailed property information</p>
          </Card>
          <Card className="border-0 shadow-none bg-transparent text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Building className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Bungalows</h3>
            <p className="text-sm text-muted-foreground">Search bungalow comparables with floor plans and room details</p>
          </Card>
          <Card className="border-0 shadow-none bg-transparent text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Flats</h3>
            <p className="text-sm text-muted-foreground">Compare flat sales by location, size, and sale price</p>
          </Card>
        </div>
      </main>
    </div>
  )
}
