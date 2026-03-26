import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, ArrowLeft, Building2, DollarSign, Calendar, FileText } from "lucide-react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InspectionDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { id } = await params

  const { data: inspection } = await supabase
    .from("inspections")
    .select(`
      *,
      property:properties(
        id, house_number, house_name, street_name, area, town, postcode, type, form,
        bedrooms, bathrooms, living_rooms, floor_area, garage
      )
    `)
    .eq("id", id)
    .single()

  if (!inspection) {
    redirect("/dashboard")
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
            <h1 className="text-xl font-bold">Inspection Details</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reference: {inspection.reference}</CardTitle>
                  <Badge variant={inspection.status === "Completed" ? "default" : "secondary"}>
                    {inspection.status}
                  </Badge>
                </div>
                <CardDescription>
                  {inspection.inspection_type} • Inspected on {inspection.inspection_date}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Valuation</span>
                    <div className="text-2xl font-bold">
                      £{inspection.valuation?.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Sale Price</span>
                    <div className="text-2xl font-bold">
                      {inspection.sale_price ? `£${inspection.sale_price.toLocaleString()}` : "N/A"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">£ per sq m</span>
                    <div className="text-2xl font-bold">
                      {inspection.price_per_sqm ? `£${inspection.price_per_sqm.toFixed(0)}` : "N/A"}
                    </div>
                  </div>
                </div>

                {inspection.notes && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Notes</span>
                    </div>
                    <p className="text-muted-foreground">{inspection.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-lg">
                      {inspection.property?.house_number} {inspection.property?.house_name && `${inspection.property.house_name}, `}
                      {inspection.property?.street_name}
                    </div>
                    <div className="text-muted-foreground">
                      {inspection.property?.area && `${inspection.property.area}, `}
                      {inspection.property?.town} {inspection.property?.postcode && `• ${inspection.property.postcode}`}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <div className="font-medium">{inspection.property?.type}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Form</span>
                      <div className="font-medium">{inspection.property?.form}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Bedrooms</span>
                      <div className="font-medium">{inspection.property?.bedrooms}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Bathrooms</span>
                      <div className="font-medium">{inspection.property?.bathrooms}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Living Rooms</span>
                      <div className="font-medium">{inspection.property?.living_rooms}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Floor Area</span>
                      <div className="font-medium">
                        {inspection.property?.floor_area ? `${inspection.property.floor_area} sq ft` : "N/A"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Garage</span>
                      <div className="font-medium">{inspection.property?.garage || "None"}</div>
                    </div>
                  </div>

                  <Link href={`/properties/${inspection.property?.id}`}>
                    <Button variant="outline" className="mt-4">
                      <Building2 className="h-4 w-4 mr-2" />
                      View Full Property Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/comparables?propertyId=${inspection.property?.id}`} className="block">
                  <Button variant="outline" className="w-full">
                    Search Comparables
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}