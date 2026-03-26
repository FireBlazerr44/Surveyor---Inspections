import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Plus, Search, Home } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; search?: string; inspectionSearch?: string }>
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

  const isAdmin = profile?.role === "admin"
  const userRole = profile?.role || "user"
  const userEmail = user.email || ""

  const params = await searchParams
  const viewMode = params.view || "all"
  const propertySearch = params.search || ""
  const inspectionSearch = params.inspectionSearch || ""

  let query = supabase
    .from("inspections")
    .select(`
      *,
      property:properties(
        id, house_number, house_name, street_name, postcode, type, form
      )
    `)
    .order("inspection_date", { ascending: false })
    .limit(10)

  if (viewMode === "mine") {
    query = query.eq("user_id", user.id)
  }

  if (inspectionSearch) {
    query = query.ilike("reference", `%${inspectionSearch}%`)
  }

  const { data: inspections } = await query

  const { count: totalInspections } = await supabase
    .from("inspections")
    .select("*", { count: "exact", head: true })

  const { count: totalProperties } = await supabase
    .from("properties")
    .select("*", { count: "exact", head: true })

  let propertyQuery = supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (propertySearch) {
    propertyQuery = propertyQuery.or(
      `postcode.ilike.%${propertySearch}%,street_name.ilike.%${propertySearch}%,town.ilike.%${propertySearch}%`
    )
  }

  const { data: properties } = await propertyQuery

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={userEmail} userRole={userRole} isAdmin={isAdmin} />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInspections || 0}</div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Link href="/inspections/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Inspection
                </Button>
              </Link>
              <Link href="/properties/search">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search Property
                </Button>
              </Link>
              <Link href="/properties/new">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Inspections</CardTitle>
                <CardDescription>Latest property inspections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <Link href={`/dashboard?view=${viewMode === "all" ? "mine" : "all"}&inspectionSearch=${inspectionSearch}`}>
                    <Button variant={viewMode === "all" ? "default" : "outline"} size="sm">
                      All Inspections
                    </Button>
                  </Link>
                  <Link href={`/dashboard?view=${viewMode === "mine" ? "all" : "mine"}&inspectionSearch=${inspectionSearch}`}>
                    <Button variant={viewMode === "mine" ? "default" : "outline"} size="sm">
                      My Inspections
                    </Button>
                  </Link>
                  <form className="flex-1">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by reference..."
                        name="inspectionSearch"
                        defaultValue={inspectionSearch}
                        className="max-w-xs"
                      />
                      <input type="hidden" name="view" value={viewMode} />
                      <Button type="submit" variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Reference</th>
                        <th className="p-3 text-left text-sm font-medium">Property</th>
                        <th className="p-3 text-left text-sm font-medium">Type</th>
                        <th className="p-3 text-left text-sm font-medium">Status</th>
                        <th className="p-3 text-left text-sm font-medium">Valuation</th>
                        <th className="p-3 text-left text-sm font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspections?.map((inspection) => (
                        <tr key={inspection.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <Link href={`/inspections/${inspection.id}`} className="font-medium hover:underline">
                              {inspection.reference}
                            </Link>
                          </td>
                          <td className="p-3">
                            <Link href={`/properties/${inspection.property?.id}`} className="hover:underline">
                              {inspection.property?.house_number} {inspection.property?.street_name}
                            </Link>
                          </td>
                          <td className="p-3">{inspection.inspection_type}</td>
                          <td className="p-3">
                            <Badge variant={inspection.status === "Completed" ? "default" : "secondary"}>
                              {inspection.status}
                            </Badge>
                          </td>
                          <td className="p-3">£{inspection.valuation?.toLocaleString()}</td>
                          <td className="p-3">{inspection.inspection_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Property Search</CardTitle>
                <CardDescription>Find properties in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="propertySearch">Search by postcode, street, or town</Label>
                      <Input
                        id="propertySearch"
                        name="search"
                        placeholder="Enter search term..."
                        defaultValue={propertySearch}
                      />
                    </div>
                    <Link href={`/properties/search?search=${propertySearch}`}>
                      <Button type="submit" className="w-full">
                        <Search className="h-4 w-4 mr-2" />
                        Search Properties
                      </Button>
                    </Link>
                  </div>
                </form>

                {properties && properties.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Recent Properties</h4>
                    {properties.slice(0, 5).map((property) => (
                      <Link
                        key={property.id}
                        href={`/properties/${property.id}`}
                        className="block p-2 rounded-md hover:bg-muted"
                      >
                        <div className="text-sm font-medium">
                          {property.house_number} {property.street_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {property.postcode} • {property.type}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}