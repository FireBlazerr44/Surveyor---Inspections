import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Search } from "lucide-react"

export default async function PropertySearchPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; form?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || "user"

  const params = await searchParams
  const search = params.search || ""
  const typeFilter = params.type || ""
  const formFilter = params.form || ""

  let query = supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(
      `postcode.ilike.%${search}%,street_name.ilike.%${search}%,town.ilike.%${search}%,house_number.ilike.%${search}%,area.ilike.%${search}%`
    )
  }

  if (typeFilter && typeFilter !== "all") {
    query = query.eq("type", typeFilter)
  }

  if (formFilter && formFilter !== "all") {
    query = query.eq("form", formFilter)
  }

  const { data: properties } = await query

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
            <h1 className="text-xl font-bold">Property Search</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Search Properties</CardTitle>
            <CardDescription>Search by postcode, street name, town, or use filters</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    name="search"
                    placeholder="Postcode, street, town..."
                    defaultValue={search}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Property Type</Label>
                  <Select name="type" defaultValue={typeFilter || "all"}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Bungalow">Bungalow</SelectItem>
                      <SelectItem value="Flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form">Form</Label>
                  <Select name="form" defaultValue={formFilter || "all"}>
                    <SelectTrigger>
                      <SelectValue placeholder="All forms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All forms</SelectItem>
                      <SelectItem value="Detached">Detached</SelectItem>
                      <SelectItem value="Semi Detached">Semi Detached</SelectItem>
                      <SelectItem value="End Terraced">End Terraced</SelectItem>
                      <SelectItem value="Mid Terraced">Mid Terraced</SelectItem>
                      <SelectItem value="Purpose Built">Purpose Built</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>{properties?.length || 0} properties found</CardDescription>
          </CardHeader>
          <CardContent>
            {properties && properties.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Address</th>
                      <th className="p-3 text-left text-sm font-medium">Postcode</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-left text-sm font-medium">Form</th>
                      <th className="p-3 text-left text-sm font-medium">Bedrooms</th>
                      <th className="p-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <Link href={`/properties/${property.id}`} className="hover:underline">
                            {property.house_number} {property.house_name && `${property.house_name}, `}{property.street_name}
                          </Link>
                        </td>
                        <td className="p-3">{property.postcode}</td>
                        <td className="p-3">{property.type}</td>
                        <td className="p-3">{property.form}</td>
                        <td className="p-3">{property.bedrooms}</td>
                        <td className="p-3">
                          <Link href={`/properties/${property.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No properties found. Try a different search or add a new property.
              </p>
            )}
          </CardContent>
        </Card>

        {userRole !== "read_only" && (
        <div className="mt-4 flex justify-end">
          <Link href="/properties/new">
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Add New Property
            </Button>
          </Link>
        </div>
        )}
      </main>
    </div>
  )
}