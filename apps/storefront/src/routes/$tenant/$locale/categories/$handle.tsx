import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { t } from "@/lib/i18n"
import ProductCard from "@/components/product-card"
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "us",
  fr: "fr",
  ar: "sa",
}

function getBaseUrl() {
  return getServerBaseUrl()
}

export const Route = createFileRoute("/$tenant/$locale/categories/$handle")({
  loader: async ({ params }) => {
    const { handle, locale } = params
    const baseUrl = getBaseUrl()
    const publishableKey = getMedusaPublishableKey()
    const headers: Record<string, string> = {}
    if (publishableKey) headers["x-publishable-api-key"] = publishableKey

    try {
      const catRes = await fetchWithTimeout(
        `${baseUrl}/store/product-categories?handle=${handle}&fields=id,name,handle,description`,
        { headers },
      )
      const catData = catRes.ok
        ? await catRes.json()
        : { product_categories: [] }
      const category = catData.product_categories?.[0] || null

      if (!category) {
        return { category: null, products: [], region: null, allCategories: [] }
      }

      const countryCode = LOCALE_TO_COUNTRY[locale?.toLowerCase()] || "us"
      const regionsRes = await fetchWithTimeout(`${baseUrl}/store/regions`, {
        headers,
      })
      const regionsData = regionsRes.ok
        ? await regionsRes.json()
        : { regions: [] }
      const regions = regionsData.regions || []
      const region =
        regions.find((r: any) =>
          r.countries?.some((c: any) => c.iso_2 === countryCode),
        ) || regions[0]

      let products: any[] = []
      if (region) {
        const prodRes = await fetchWithTimeout(
          `${baseUrl}/store/products?category_id[]=${category.id}&region_id=${region.id}&fields=*variants.calculated_price&limit=50`,
          { headers },
        )
        const prodData = prodRes.ok ? await prodRes.json() : { products: [] }
        products = prodData.products || []
      }

      const allCatRes = await fetchWithTimeout(
        `${baseUrl}/store/product-categories?fields=id,name,handle&limit=50`,
        { headers },
      )
      const allCatData = allCatRes.ok
        ? await allCatRes.json()
        : { product_categories: [] }

      return {
        category,
        products,
        region,
        allCategories: allCatData.product_categories || [],
      }
    } catch {
      return { category: null, products: [], region: null, allCategories: [] }
    }
  },
  component: CategoryPage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.category
          ? `${loaderData.category.name} | Dakkah CityOS`
          : "Category | Dakkah CityOS",
      },
    ],
  }),
})

function CategoryPage() {
  const { category, products, allCategories } = Route.useLoaderData()
  const { tenant, locale } = Route.useParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("default")
  const prefix = `/${tenant}/${locale}`

  const filteredProducts = useMemo(() => {
    let result = products || []
    if (searchQuery) {
      result = result.filter(
        (p: any) =>
          p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }
    if (sortBy === "price-asc") {
      result = [...result].sort((a: any, b: any) => {
        const priceA = a.variants?.[0]?.calculated_price?.calculated_amount || 0
        const priceB = b.variants?.[0]?.calculated_price?.calculated_amount || 0
        return priceA - priceB
      })
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a: any, b: any) => {
        const priceA = a.variants?.[0]?.calculated_price?.calculated_amount || 0
        const priceB = b.variants?.[0]?.calculated_price?.calculated_amount || 0
        return priceB - priceA
      })
    } else if (sortBy === "name") {
      result = [...result].sort((a: any, b: any) =>
        (a.title || "").localeCompare(b.title || ""),
      )
    }
    return result
  }, [products, searchQuery, sortBy])

  if (!category) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ds-foreground mb-4">
            Category Not Found
          </h1>
          <p className="text-ds-muted-foreground mb-6">
            The category you're looking for doesn't exist.
          </p>
          <Link
            to={`${prefix}/store` as never}
            className="inline-flex items-center px-6 py-3 bg-ds-primary text-ds-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ds-muted">
      <section className="bg-ds-primary text-ds-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm mb-4 opacity-80">
            <Link
              to="/$tenant/$locale"
              params={{ tenant, locale }}
              className="hover:underline"
            >
              Home
            </Link>
            <span>/</span>
            <Link to={`${prefix}/store` as never} className="hover:underline">
              Shop
            </Link>
            <span>/</span>
            <span>{category.name}</span>
          </nav>
          <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-lg opacity-80 max-w-2xl">
              {category.description}
            </p>
          )}
          <p className="text-sm mt-3 opacity-70">
            {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-ds-background rounded-lg border border-ds-border p-5 sticky top-24">
              <h3 className="font-semibold text-ds-foreground mb-3">
                {t(locale, "verticals.search_label")}
              </h3>
              <input
                type="text"
                placeholder={t(locale, "categories.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-ds-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ds-ring bg-ds-background"
              />

              <h3 className="font-semibold text-ds-foreground mt-6 mb-3">
                Sort By
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-ds-border rounded-md text-sm bg-ds-background focus:outline-none focus:ring-2 focus:ring-ds-ring"
              >
                <option value="default">
                  {t(locale, "common.sort.default", "Default")}
                </option>
                <option value="name">
                  {t(locale, "common.sort.nameAZ", "Name A-Z")}
                </option>
                <option value="price-asc">
                  {t(locale, "common.sort.priceLowHigh", "Price: Low to High")}
                </option>
                <option value="price-desc">
                  {t(locale, "common.sort.priceHighLow", "Price: High to Low")}
                </option>
              </select>

              {allCategories.length > 0 && (
                <>
                  <h3 className="font-semibold text-ds-foreground mt-6 mb-3">
                    Categories
                  </h3>
                  <ul className="space-y-1">
                    {allCategories.map((cat: any) => (
                      <li key={cat.id}>
                        <Link
                          to="/$tenant/$locale/categories/$handle"
                          params={{ tenant, locale, handle: cat.handle }}
                          className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                            cat.handle === category.handle
                              ? "bg-ds-primary text-ds-primary-foreground font-medium"
                              : "text-ds-foreground hover:bg-ds-muted"
                          }`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </aside>

          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-ds-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  No products found
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {searchQuery
                    ? t(locale, "verticals.try_adjusting")
                    : "Products in this category will appear here soon."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
