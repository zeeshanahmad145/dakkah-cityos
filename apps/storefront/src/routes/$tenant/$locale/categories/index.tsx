// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "us",
  fr: "fr",
  ar: "sa",
}

const categoryImages: Record<string, string> = {
  "clothing": "/seed-images/content/1548013146-72479768bada.jpg",
  "electronics": "/seed-images/content/1573164713988-8665fc963095.jpg",
  "home-garden": "/seed-images/content/1519167758481-83f550bb49b3.jpg",
  "food-beverage": "/seed-images/volume-deals/1504674900247-0877df9cc836.jpg",
  "health-beauty": "/seed-images/healthcare/1576091160399-112ba8d25d1d.jpg",
  "sports-outdoors": "/seed-images/events/1501281668745-f7f57925c3b4.jpg",
  "automotive": "/seed-images/automotive/1618843479313-40f8afb4b4d8.jpg",
  "books-media": "/seed-images/education/1509062522246-3755977927d7.jpg",
  "toys-games": "/seed-images/content/1558171813-4c088753af8f.jpg",
  "jewelry": "/seed-images/content/1578662996442-48f60103fc96.jpg",
  "pets": "/seed-images/pet-services/1587300003388-59208cc962cb.jpg",
  "office-supplies": "/seed-images/b2b/1504384308090-c894fdcc538d.jpg",
  "real-estate": "/seed-images/real-estate/1600585154340-be6161a56a0c.jpg",
  "travel": "/seed-images/event-ticketing/1488646953014-85cb44e25828.jpg",
  "education": "/seed-images/education/1503676260728-1c00da094a0b.jpg",
}

function getCategoryImage(handle: string, name: string): string {
  if (categoryImages[handle]) return categoryImages[handle]
  const lowerName = name.toLowerCase()
  for (const [key, url] of Object.entries(categoryImages)) {
    if (lowerName.includes(key.split("-")[0])) return url
  }
  return "/seed-images/content/1682687220742-aba13b6e50ba.jpg"
}

export const Route = createFileRoute("/$tenant/$locale/categories/")({
  component: CategoriesIndexPage,
  head: () => ({
    meta: [
      { title: "Categories | Dakkah CityOS" },
      { name: "description", content: "Browse all product categories on Dakkah CityOS Marketplace" },
    ],
  }),
  loader: async ({ params }) => {
    const { locale } = params
    const baseUrl = getServerBaseUrl()
    const publishableKey = getMedusaPublishableKey()
    const headers: Record<string, string> = {}
    if (publishableKey) headers["x-publishable-api-key"] = publishableKey

    try {
      const res = await fetchWithTimeout(
        `${baseUrl}/store/product-categories?include_descendants_tree=true&parent_category_id=null&fields=id,name,handle,description&limit=50`,
        { headers }
      )
      if (!res.ok) return { categories: [] }
      const data = await res.json()
      return { categories: data.product_categories || [] }
    } catch {
      return { categories: [] }
    }
  },
})

function CategoriesIndexPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const { categories } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary to-ds-primary/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link to={`${prefix}` as any} className="hover:text-white transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <span className="text-white">{t(locale, 'categories.title')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t(locale, 'categories.title')}</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Browse all categories available on the CityOS Marketplace.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{categories.length} categories</span>
            <span>|</span>
            <span>All Verticals</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">No categories found</h3>
            <p className="text-ds-muted-foreground text-sm">Check back soon for available categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                to={`${prefix}/categories/${cat.handle}` as any}
                className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/40 transition-all duration-200"
              >
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img
                    loading="lazy"
                    src={getCategoryImage(cat.handle, cat.name)}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 start-0 end-0 p-4">
                    <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-white/70 text-sm mt-1 line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
