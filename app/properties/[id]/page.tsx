import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Edit, Search, MapPin, Home, Ruler, Calendar, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PropertyDetailPage({ params }: PageProps) {
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

  const { id } = await params

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single()

  if (!property) {
    redirect("/properties/search")
  }

  const { data: inspections } = await supabase
    .from("inspections")
    .select("*")
    .eq("property_id", id)
    .order("inspection_date", { ascending: false })

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
            <h1 className="text-xl font-bold">Property Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {property.house_number} {property.house_name && `${property.house_name}, `}
                      {property.street_name}
                    </span>
                  </div>
                  {property.area && (
                    <div className="text-muted-foreground">{property.area}</div>
                  )}
                  <div className="text-muted-foreground">
                    {property.town} {property.postcode && `• ${property.postcode}`}
                  </div>
                  {property.postcode && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.postcode)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-secondary hover:underline mt-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on Map
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <div className="font-medium">{property.type}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Form</span>
                    <div className="font-medium">{property.form}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Age</span>
                    <div className="font-medium">{property.age || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Floors</span>
                    <div className="font-medium">{property.floors || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Location (1-10)</span>
                    <div className="font-medium">{property.location || "N/A"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Condition</span>
                    <div className="font-medium">{property.condition}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Bedrooms</span>
                    <div className="font-medium">{property.bedrooms}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Bathrooms</span>
                    <div className="font-medium">{property.bathrooms}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Living Rooms</span>
                    <div className="font-medium">{property.living_rooms}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Floor Area</span>
                    <div className="font-medium">
                      {property.floor_area ? `${property.floor_area} sq ft` : "N/A"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Garage</span>
                    <div className="font-medium">{property.garage || "None"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {property.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{property.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/properties/${id}/edit`} className="block">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Property
                  </Button>
                </Link>
                <Link href={`/comparables?propertyId=${id}`} className="block">
                  <Button variant="outline" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Search Comparables
                  </Button>
                </Link>
                {userRole !== "read_only" && (
                <Link href={`/inspections/new?propertyId=${id}`} className="block">
                  <Button className="w-full">
                    Add Inspection
                  </Button>
                </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inspection History</CardTitle>
                <CardDescription>{inspections?.length || 0} inspections on record</CardDescription>
              </CardHeader>
              <CardContent>
                {inspections && inspections.length > 0 ? (
                  <div className="space-y-4">
                    {inspections.map((inspection) => (
                      <div key={inspection.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between">
                          <Link
                            href={`/inspections/${inspection.id}`}
                            className="font-medium hover:underline"
                          >
                            {inspection.reference}
                          </Link>
                          <Badge
                            variant={inspection.status === "Completed" ? "default" : "secondary"}
                          >
                            {inspection.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {inspection.inspection_type} • {formatDate(inspection.inspection_date)}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          £{inspection.valuation?.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No inspections on record.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}