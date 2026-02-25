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
  "clothing": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
  "electronics": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
  "home-garden": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
  "food-beverage": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
  "health-beauty": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop",
  "sports-outdoors": "https://images.unsplash.com/photo-1461896836934-bd45ba8a0a86?w=400&h=300&fit=crop",
  "automotive": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
  "books-media": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop",
  "toys-games": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop",
  "jewelry": "https://images.unsplash.com/photo-1515562141589-67f0d999b799?w=400&h=300&fit=crop",
  "pets": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
  "office-supplies": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
  "real-estate": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
  "travel": "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop",
  "education": "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400&h=300&fit=crop",
}

function getCategoryImage(handle: string, name: string): string {
  if (categoryImages[handle]) return categoryImages[handle]
  const lowerName = name.toLowerCase()
  for (const [key, url] of Object.entries(categoryImages)) {
    if (lowerName.includes(key.split("-")[0])) return url
  }
  return `https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop`
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
