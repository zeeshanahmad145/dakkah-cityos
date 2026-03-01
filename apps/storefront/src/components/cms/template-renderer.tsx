import React, { useState, useEffect } from "react"
import { useLocation } from "@tanstack/react-router"
import type { CMSPage } from "@/lib/types/cityos"
import { DynamicPage } from "@/components/pages/dynamic-page"
import { sdk } from "@/lib/utils/sdk"

interface TemplateRendererProps {
  page: CMSPage
  tenant: { id: string; slug: string; name: string }
  locale: string
  branding?: any
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  page,
  tenant,
  locale,
  branding,
}) => {
  switch (page.template) {
    case "vertical-list":
      return (
        <VerticalListTemplate page={page} tenant={tenant} locale={locale} />
      )
    case "vertical-detail":
      return (
        <VerticalDetailTemplate page={page} tenant={tenant} locale={locale} />
      )
    case "landing":
    case "home":
      return <DynamicPage page={page} branding={branding} locale={locale} />
    case "static":
      return <StaticTemplate page={page} branding={branding} locale={locale} />
    case "category":
      return <CategoryTemplate page={page} tenant={tenant} locale={locale} />
    case "node-browser":
      return <NodeBrowserTemplate page={page} tenant={tenant} locale={locale} />
    case "custom":
    default:
      return <DynamicPage page={page} branding={branding} locale={locale} />
  }
}

function VerticalListTemplate({
  page,
  tenant,
  locale,
}: {
  page: CMSPage
  tenant: { id: string; slug: string }
  locale: string
}) {
  const config = page.verticalConfig
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("default")
  const verticalSlug = config?.verticalSlug || ""
  const gradientClass =
    VERTICAL_COLORS[verticalSlug] || "from-ds-primary to-ds-primary"

  useEffect(() => {
    if (!config?.medusaEndpoint) {
      setIsLoading(false)
      return
    }
    sdk.client
      .fetch(config.medusaEndpoint, { method: "GET" })
      .then((data: any) => {
        const dataItems =
          data.items ||
          data[config.verticalSlug] ||
          Object.values(data).find((v) => Array.isArray(v)) ||
          []
        setItems(Array.isArray(dataItems) ? dataItems : [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [config?.medusaEndpoint, config?.verticalSlug])

  const filteredItems = (() => {
    let result = items
    if (searchQuery) {
      result = result.filter((item: any) =>
        Object.values(item).some(
          (val) =>
            typeof val === "string" &&
            val.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    }
    if (sortBy === "name") {
      result = [...result].sort((a: any, b: any) =>
        (a.name || a.title || "").localeCompare(b.name || b.title || ""),
      )
    } else if (sortBy === "rating") {
      result = [...result].sort(
        (a: any, b: any) => (b.rating || 0) - (a.rating || 0),
      )
    }
    return result
  })()

  return (
    <div className="min-h-screen bg-ds-muted">
      <section
        className={`bg-gradient-to-r ${gradientClass} text-white py-16 relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <nav className="flex items-center gap-2 text-sm mb-4 text-white/70">
            <a
              href={`/${tenant.slug}/${locale}`}
              className="hover:text-white transition-colors"
            >
              Home
            </a>
            <span>/</span>
            <span className="text-white">{page.title}</span>
          </nav>
          <h1 className="text-4xl font-bold mb-3">{page.title}</h1>
          {page.seo?.description && (
            <p className="text-white/80 text-lg max-w-2xl">
              {page.seo.description}
            </p>
          )}
          <div className="mt-4 text-white/60 text-sm">
            {items.length} {items.length === 1 ? "result" : "results"} available
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ds-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={`Search ${page.title?.toLowerCase() || "items"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 border border-ds-border rounded-xl bg-ds-background focus:outline-none focus:ring-2 focus:ring-ds-ring text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-ds-border rounded-xl bg-ds-background text-sm focus:outline-none focus:ring-2 focus:ring-ds-ring"
          >
            <option value="default">Sort by: Default</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        {isLoading ? (
          <div
            className={`grid gap-6 ${config?.cardLayout === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-ds-background rounded-xl border border-ds-border overflow-hidden animate-pulse"
              >
                <div
                  className={`aspect-[4/3] bg-gradient-to-br ${gradientClass} opacity-20`}
                />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-ds-muted rounded w-3/4" />
                  <div className="h-4 bg-ds-muted rounded w-1/2" />
                  <div className="h-4 bg-ds-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-ds-background rounded-xl border border-ds-border p-16 text-center">
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mx-auto mb-6 opacity-80`}
            >
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    VERTICAL_ICONS[verticalSlug] ||
                    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  }
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-ds-foreground mb-2">
              {searchQuery
                ? "No results found"
                : `No ${page.title?.toLowerCase() || "items"} yet`}
            </h3>
            <p className="text-ds-muted-foreground text-sm max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search terms or browse all available listings."
                : "New listings will appear here soon. Check back later!"}
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              config?.cardLayout === "list"
                ? "grid-cols-1"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {filteredItems.map((item: any, idx: number) => (
              <VerticalCard
                key={item.id || idx}
                item={item}
                verticalSlug={verticalSlug}
                tenant={tenant}
                locale={locale}
                cardLayout={config?.cardLayout}
              />
            ))}
          </div>
        )}
      </div>

      {page.layout &&
        page.layout.filter((b: any) => b.blockType !== "hero").length > 0 && (
          <DynamicPage
            page={{
              ...page,
              layout: page.layout.filter((b: any) => b.blockType !== "hero"),
            }}
            locale={locale}
          />
        )}
    </div>
  )
}

const VERTICAL_ICONS: Record<string, string> = {
  restaurants:
    "M11 3a1 1 0 10-2 0v6.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 9.586V3z",
  "real-estate":
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1",
  automotive: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z",
  grocery:
    "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17",
  healthcare:
    "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  education:
    "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
  events:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  fitness: "M13 10V3L4 14h7v7l9-11h-7z",
  travel:
    "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064",
  charity:
    "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  freelance:
    "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
}

const VERTICAL_COLORS: Record<string, string> = {
  restaurants: "from-ds-warning to-ds-destructive",
  "real-estate": "from-ds-success to-ds-success",
  automotive: "from-ds-primary to-ds-primary",
  grocery: "from-ds-success to-lime-600",
  healthcare: "from-rose-500 to-ds-destructive",
  education: "from-ds-primary/100 to-ds-primary",
  events: "from-ds-warning to-ds-warning",
  fitness: "from-ds-info to-ds-primary",
  travel: "from-ds-info/100 to-ds-primary",
  charity: "from-ds-destructive to-rose-600",
  freelance: "from-ds-primary to-ds-primary",
  "digital-products": "from-ds-primary to-ds-primary",
  rentals: "from-ds-success to-ds-success",
  auctions: "from-ds-warning to-ds-warning",
  "financial-products": "from-ds-muted-foreground to-ds-primary/80",
  government: "from-ds-primary to-ds-primary/90",
  memberships: "from-ds-primary/100 to-ds-primary/90",
  parking: "from-ds-muted-foreground to-ds-muted-foreground/80",
  utilities: "from-ds-success to-ds-success/90",
  warranties: "from-ds-primary to-ds-info",
  legal: "from-ds-primary to-ds-primary/80",
  advertising: "from-ds-destructive to-ds-primary",
  "pet-services": "from-ds-warning to-ds-warning",
  classifieds: "from-ds-success to-ds-info",
  crowdfunding: "from-ds-success to-ds-success",
  "social-commerce": "from-ds-destructive to-rose-500",
  affiliates: "from-ds-primary to-ds-primary",
}

function resolveImage(item: any): string | null {
  return (
    item.image?.url ||
    item.thumbnail ||
    item.coverImage?.url ||
    item.photo ||
    item.logo_url ||
    item.banner_url ||
    item.image_url ||
    item.cover_image ||
    item.avatar_url ||
    item.featured_image ||
    item.profile_image ||
    item.hero_image ||
    null
  )
}

function VerticalCard({
  item,
  verticalSlug,
  tenant,
  locale,
  cardLayout,
}: {
  item: any
  verticalSlug: string
  tenant: { slug: string }
  locale: string
  cardLayout?: string
}) {
  const title = item.name || item.title || "Untitled"
  const description = item.description || item.summary || item.bio || ""
  const image = resolveImage(item)
  const price =
    item.price ||
    item.rate ||
    item.cost ||
    item.consultation_fee ||
    item.hourly_rate ||
    item.monthly_price ||
    null
  const rating = item.rating || item.stars || item.avg_rating || null
  const category =
    item.category ||
    item.type ||
    item.specialty ||
    item.cuisine_types?.[0] ||
    item.practice_area ||
    item.service_type ||
    null
  const location = item.city || item.location || item.address_line1 || null
  const detailUrl = `/${tenant.slug}/${locale}/${verticalSlug}/${item.handle || item.id}`
  const gradientClass =
    VERTICAL_COLORS[verticalSlug] || "from-ds-primary to-ds-primary"
  const iconPath =
    VERTICAL_ICONS[verticalSlug] ||
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"

  if (cardLayout === "list") {
    return (
      <a
        href={detailUrl}
        className="group flex bg-ds-background rounded-xl shadow-sm border border-ds-border overflow-hidden hover:shadow-lg hover:border-ds-ring transition-all duration-200"
      >
        <div className={`w-48 h-40 flex-shrink-0 relative overflow-hidden`}>
          {image ? (
            <img
              loading="lazy"
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
            >
              <svg
                className="w-12 h-12 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={iconPath}
                />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4 flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-ds-foreground group-hover:text-ds-primary transition-colors truncate">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {category && (
              <span className="text-xs bg-ds-muted text-ds-muted-foreground px-2 py-0.5 rounded-full">
                {category}
              </span>
            )}
            {location && (
              <span className="text-xs text-ds-muted-foreground flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {location}
              </span>
            )}
          </div>
          {description && (
            <p className="text-ds-muted-foreground text-sm mt-2 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {rating != null && (
              <span className="text-ds-warning text-sm font-medium flex items-center gap-0.5">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {Number(rating).toFixed(1)}
              </span>
            )}
            {price != null && (
              <span className="text-ds-foreground font-semibold">
                {typeof price === "number" ? `$${price.toFixed(2)}` : price}
              </span>
            )}
          </div>
        </div>
      </a>
    )
  }

  return (
    <a
      href={detailUrl}
      className="group bg-ds-background rounded-xl shadow-sm border border-ds-border overflow-hidden hover:shadow-lg hover:border-ds-ring transition-all duration-200 flex flex-col"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        {image ? (
          <img
            loading="lazy"
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
          >
            <svg
              className="w-16 h-16 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
          </div>
        )}
        {category && (
          <span className="absolute top-3 start-3 text-xs bg-white/90 backdrop-blur-sm text-ds-foreground px-2.5 py-1 rounded-full font-medium shadow-sm">
            {category}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-base text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">
          {title}
        </h3>
        {location && (
          <p className="text-xs text-ds-muted-foreground mt-1 flex items-center gap-1">
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            {location}
          </p>
        )}
        {description && (
          <p className="text-ds-muted-foreground text-sm mt-2 line-clamp-2 flex-1">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ds-border">
          {rating != null ? (
            <span className="text-ds-warning text-sm font-medium flex items-center gap-0.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {Number(rating).toFixed(1)}
            </span>
          ) : (
            <span />
          )}
          {price != null ? (
            <span className="text-ds-foreground font-bold text-base">
              {typeof price === "number" ? `$${price.toFixed(2)}` : price}
            </span>
          ) : (
            <span className="text-xs text-ds-muted-foreground">
              View details
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

function VerticalDetailTemplate({
  page,
  tenant,
  locale,
}: {
  page: CMSPage
  tenant: { id: string; slug: string }
  locale: string
}) {
  const config = page.verticalConfig
  const [item, setItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const routerLocation = useLocation()
  const itemId = routerLocation.pathname.split("/").pop() || ""

  useEffect(() => {
    if (!config?.medusaEndpoint || !itemId) {
      setIsLoading(false)
      return
    }
    sdk.client
      .fetch(`${config.medusaEndpoint}/${itemId}`, { method: "GET" })
      .then((data: any) => {
        const resolved =
          data.item || data[config.verticalSlug?.replace(/-/g, "_")] || data
        setItem(resolved)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [config?.medusaEndpoint, itemId, config?.verticalSlug])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-ds-border border-t-ds-foreground rounded-full animate-spin" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ds-foreground mb-2">
            Not Found
          </h1>
          <p className="text-ds-muted-foreground">
            The requested item could not be found.
          </p>
          <a
            href={`/${tenant.slug}/${locale}`}
            className="mt-4 inline-block text-ds-foreground underline"
          >
            Go back
          </a>
        </div>
      </div>
    )
  }

  const title = item.name || item.title || "Untitled"
  const description = item.description || item.bio || item.summary || ""
  const image =
    item.image?.url ||
    item.thumbnail ||
    item.coverImage?.url ||
    item.photo ||
    null
  const price = item.price || item.rate || item.cost || null
  const rating = item.rating || item.stars || null
  const category = item.category || item.type || item.specialty || null
  const location = item.location || item.address || null
  const contact = item.contact || item.phone || item.email || null

  const extraFields = Object.entries(item).filter(
    ([key]) =>
      ![
        "id",
        "name",
        "title",
        "description",
        "bio",
        "summary",
        "image",
        "thumbnail",
        "coverImage",
        "photo",
        "price",
        "rate",
        "cost",
        "rating",
        "stars",
        "category",
        "type",
        "specialty",
        "location",
        "address",
        "contact",
        "phone",
        "email",
        "created_at",
        "updated_at",
        "metadata",
        "tenant_id",
        "status",
      ].includes(key),
  )

  return (
    <div className="min-h-screen bg-ds-muted">
      <div className="bg-ds-primary text-ds-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-ds-muted-foreground mb-4">
            <a
              href={`/${tenant.slug}/${locale}`}
              className="hover:text-ds-primary-foreground"
            >
              Home
            </a>
            <span className="mx-2">/</span>
            {config?.verticalSlug && (
              <>
                <a
                  href={`/${tenant.slug}/${locale}/${config.verticalSlug}`}
                  className="hover:text-ds-primary-foreground capitalize"
                >
                  {config.verticalSlug.replace(/-/g, " ")}
                </a>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-ds-primary-foreground">{title}</span>
          </nav>
          <h1 className="text-3xl font-bold">{title}</h1>
          {category && (
            <span className="inline-block bg-ds-background/10 px-3 py-1 rounded text-sm mt-2">
              {category}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {image && (
              <div className="rounded-lg overflow-hidden mb-6">
                <img
                  loading="lazy"
                  src={image}
                  alt={title}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
            )}

            {description && (
              <div className="bg-ds-background rounded-lg p-6 shadow-sm border border-ds-border mb-6">
                <h2 className="text-xl font-semibold mb-3">About</h2>
                <p className="text-ds-foreground whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {extraFields.length > 0 && (
              <div className="bg-ds-background rounded-lg p-6 shadow-sm border border-ds-border mb-6">
                <h2 className="text-xl font-semibold mb-3">Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {extraFields.map(([key, value]) => {
                    if (
                      typeof value === "object" ||
                      value === null ||
                      value === undefined
                    )
                      return null
                    return (
                      <div key={key}>
                        <dt className="text-sm text-ds-muted-foreground capitalize">
                          {key.replace(/_/g, " ")}
                        </dt>
                        <dd className="text-ds-foreground font-medium">
                          {String(value)}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {(price || rating || location || contact) && (
              <div className="bg-ds-background rounded-lg p-6 shadow-sm border border-ds-border">
                <h3 className="font-semibold text-lg mb-4">Quick Info</h3>
                {price && (
                  <div className="mb-3">
                    <span className="text-sm text-ds-muted-foreground">
                      Price
                    </span>
                    <p className="text-2xl font-bold text-ds-foreground">
                      {typeof price === "number" ? `$${price}` : price}
                    </p>
                  </div>
                )}
                {rating && (
                  <div className="mb-3">
                    <span className="text-sm text-ds-muted-foreground">
                      Rating
                    </span>
                    <p className="text-ds-warning text-lg">
                      {"★".repeat(Math.round(Number(rating)))}
                      {"☆".repeat(5 - Math.round(Number(rating)))}
                    </p>
                  </div>
                )}
                {location && (
                  <div className="mb-3">
                    <span className="text-sm text-ds-muted-foreground">
                      Location
                    </span>
                    <p className="text-ds-foreground">
                      {typeof location === "object"
                        ? location.address || JSON.stringify(location)
                        : location}
                    </p>
                  </div>
                )}
                {contact && (
                  <div className="mb-3">
                    <span className="text-sm text-ds-muted-foreground">
                      Contact
                    </span>
                    <p className="text-ds-foreground">
                      {typeof contact === "object"
                        ? contact.phone ||
                          contact.email ||
                          JSON.stringify(contact)
                        : contact}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {page.layout && page.layout.length > 0 && (
        <DynamicPage page={page} locale={locale} />
      )}
    </div>
  )
}

function StaticTemplate({
  page,
  branding,
  locale,
}: {
  page: CMSPage
  branding?: any
  locale?: string
}) {
  return (
    <div className="min-h-screen bg-ds-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-ds-foreground mb-4">
          {page.title}
        </h1>
        {page.seo?.description && (
          <p className="text-lg text-ds-muted-foreground mb-8">
            {page.seo.description}
          </p>
        )}
      </div>
      {page.layout && page.layout.length > 0 ? (
        <DynamicPage page={page} branding={branding} locale={locale} />
      ) : (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <p className="text-ds-muted-foreground">
            This page has no content yet.
          </p>
        </div>
      )}
    </div>
  )
}

function CategoryTemplate({
  page,
  tenant,
  locale,
}: {
  page: CMSPage
  tenant: { id: string; slug: string }
  locale: string
}) {
  return (
    <div className="min-h-screen bg-ds-muted">
      <section className="bg-ds-primary text-ds-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">{page.title}</h1>
          {page.seo?.description && (
            <p className="text-ds-muted-foreground text-lg max-w-2xl">
              {page.seo.description}
            </p>
          )}
        </div>
      </section>
      {page.layout && page.layout.length > 0 && (
        <DynamicPage page={page} locale={locale} />
      )}
    </div>
  )
}

function NodeBrowserTemplate({
  page,
  tenant,
  locale,
}: {
  page: CMSPage
  tenant: { id: string; slug: string }
  locale: string
}) {
  return (
    <div className="min-h-screen bg-ds-muted">
      <section className="bg-ds-primary text-ds-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">
            {page.title || "City Hierarchy"}
          </h1>
          <p className="text-ds-muted-foreground text-lg max-w-2xl">
            Browse the organizational structure from city level down to
            individual assets.
          </p>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {page.layout && page.layout.length > 0 ? (
          <DynamicPage page={page} locale={locale} />
        ) : (
          <p className="text-ds-muted-foreground">
            Node hierarchy browser will load from platform context.
          </p>
        )}
      </div>
    </div>
  )
}

export default TemplateRenderer
