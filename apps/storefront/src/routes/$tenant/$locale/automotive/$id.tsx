// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { VehicleListingBlock } from "@/components/blocks/vehicle-listing-block"
import { ComparisonTableBlock } from "@/components/blocks/comparison-table-block"

function normalizeDetail(item: any) {
  if (!item) return null
  const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : (item.metadata || {})
  return { ...meta, ...item,
    thumbnail: item.thumbnail || item.photo_url || item.banner_url || item.logo_url || meta.thumbnail || (meta.images && meta.images[0]) || null,
    images: meta.images || [item.photo_url || item.banner_url || item.logo_url].filter(Boolean),
    description: item.description || meta.description || "",
    price: item.price ?? meta.price ?? null,
    rating: item.rating ?? item.avg_rating ?? meta.rating ?? null,
    review_count: item.review_count ?? meta.review_count ?? null,
    location: item.location || item.city || item.address || meta.location || null,
  }
}

export const Route = createFileRoute("/$tenant/$locale/automotive/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/automotive/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data.booking || data.event || data.auction || data) }
    } catch { return { item: null } }
  },
  component: AutomotiveDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Automotive Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
})

function AutomotiveDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const vehicle = loaderData?.item

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Vehicle Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This vehicle listing may have been removed or is no longer available.</p>
            <Link to={`${prefix}/automotive` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Vehicles
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const vehicleTitle = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || vehicle.title || "Vehicle"

  const specs = [
    { label: t(locale, "automotive.label_year", "Year"), value: vehicle.year },
    { label: t(locale, "automotive.label_make", "Make"), value: vehicle.make },
    { label: t(locale, "automotive.label_model", "Model"), value: vehicle.model },
    { label: t(locale, "automotive.label_mileage", "Mileage"), value: vehicle.mileage ? `${Number(vehicle.mileage || 0).toLocaleString()} mi` : null },
    { label: t(locale, "automotive.label_fuel_type", "Fuel Type"), value: vehicle.fuel_type || vehicle.fuelType },
    { label: t(locale, "automotive.label_transmission", "Transmission"), value: vehicle.transmission },
    { label: t(locale, "automotive.label_color", "Color"), value: vehicle.color || vehicle.exterior_color },
    { label: t(locale, "automotive.label_vin", "VIN"), value: vehicle.vin },
    { label: t(locale, "automotive.label_engine", "Engine"), value: vehicle.engine },
    { label: t(locale, "automotive.label_drivetrain", "Drivetrain"), value: vehicle.drivetrain },
    { label: t(locale, "automotive.label_body_type", "Body Type"), value: vehicle.body_type || vehicle.bodyType },
    { label: t(locale, "automotive.label_doors", "Doors"), value: vehicle.doors },
  ].filter((s) => s.value)

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/automotive` as any} className="hover:text-ds-foreground transition-colors">Automotive</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{vehicleTitle}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-[16/9] bg-ds-muted rounded-xl overflow-hidden">
              {vehicle.thumbnail || vehicle.image ? (
                <img loading="lazy" src={vehicle.thumbnail || vehicle.image} alt={vehicleTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-ds-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {vehicle.status && (
                <span className="absolute top-4 start-4 px-3 py-1 text-xs font-semibold rounded-full bg-ds-success/20 text-ds-success">
                  {vehicle.status}
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{vehicleTitle}</h1>
              {vehicle.trim && (
                <p className="mt-1 text-ds-muted-foreground">{vehicle.trim}</p>
              )}
              <p className="text-2xl font-bold text-ds-primary mt-3">
                {vehicle.price != null ? `$${Number(vehicle.price || 0).toLocaleString()}` : "Contact for price"}
              </p>
            </div>

            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <h2 className="font-semibold text-ds-foreground mb-4">Vehicle Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="bg-ds-muted/30 rounded-lg p-3">
                    <p className="text-xs text-ds-muted-foreground">{spec.label}</p>
                    <p className="font-medium text-ds-foreground mt-0.5">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {vehicle.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Description</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{vehicle.description}</p>
              </div>
            )}

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Features</h2>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                <p className="text-3xl font-bold text-ds-foreground text-center">
                  {vehicle.price != null ? `$${Number(vehicle.price || 0).toLocaleString()}` : "Contact for price"}
                </p>

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Schedule Test Drive
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Contact Dealer
                </button>
              </div>

              {vehicle.dealer && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Dealer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-ds-foreground">{vehicle.dealer.name}</p>
                    {vehicle.dealer.address && (
                      <div className="flex items-start gap-2 text-ds-muted-foreground">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span>{vehicle.dealer.address}</span>
                      </div>
                    )}
                    {vehicle.dealer.phone && (
                      <div className="flex items-center gap-2 text-ds-muted-foreground">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span>{vehicle.dealer.phone}</span>
                      </div>
                    )}
                    {vehicle.dealer.rating && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-ds-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        <span className="text-ds-foreground font-medium">{vehicle.dealer.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <VehicleListingBlock vehicleId={vehicle.id} />
          <ComparisonTableBlock />
        </div>
      </div>
    </div>
  )
}
