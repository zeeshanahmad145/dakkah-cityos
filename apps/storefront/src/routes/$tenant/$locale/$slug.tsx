import { createFileRoute } from '@tanstack/react-router'
import { TemplateRenderer } from '@/components/cms/template-renderer'
import type { CMSPage } from '@/lib/types/cityos'
import ProductCard from '@/components/product-card'
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"

const DEFAULT_TENANT_ID = "01KGZ2JRYX607FWMMYQNQRKVWS"

const TENANT_SLUG_TO_ID: Record<string, string> = {
  dakkah: DEFAULT_TENANT_ID,
}

const BUILT_IN_ROUTES = new Set(["store"])

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "us",
  fr: "fr",
  ar: "sa",
}

function getBaseUrl() {
  return getServerBaseUrl()
}

async function resolvePageFromServer(tenantId: string, path: string, locale?: string): Promise<CMSPage | null> {
  try {
    const baseUrl = getBaseUrl()
    const params = new URLSearchParams({ path, tenant_id: tenantId })
    if (locale) params.set("locale", locale)
    const response = await fetchWithTimeout(`${baseUrl}/platform/cms/resolve?${params}`)
    if (!response.ok) return null
    const data = await response.json()
    return data.payload?.docs?.[0] || data.data?.page || null
  } catch {
    return null
  }
}

async function fetchStoreData(locale: string) {
  const baseUrl = getBaseUrl()
  const countryCode = LOCALE_TO_COUNTRY[locale?.toLowerCase()] || locale?.toLowerCase() || "us"
  const publishableKey = getMedusaPublishableKey()
  const headers: Record<string, string> = {}
  if (publishableKey) headers["x-publishable-api-key"] = publishableKey

  try {
    const regionsRes = await fetchWithTimeout(`${baseUrl}/store/regions`, { headers })
    if (!regionsRes.ok) return { region: null, products: [], count: 0 }
    const regionsData = await regionsRes.json()
    const regions = regionsData.regions || []
    const region = regions.find((r: any) =>
      r.countries?.some((c: any) => c.iso_2 === countryCode.toLowerCase())
    ) || regions[0]

    if (!region) return { region: null, products: [], count: 0 }

    const productsRes = await fetchWithTimeout(
      `${baseUrl}/store/products?limit=100&offset=0&region_id=${region.id}&fields=*variants.calculated_price`,
      { headers }
    )
    if (!productsRes.ok) return { region, products: [], count: 0 }
    const productsData = await productsRes.json()

    return {
      region,
      products: productsData.products || [],
      count: productsData.count || 0,
    }
  } catch {
    return { region: null, products: [], count: 0 }
  }
}

export const Route = createFileRoute('/$tenant/$locale/$slug')({
  loader: async ({ params }) => {
    const { slug, locale, tenant } = params
    if (BUILT_IN_ROUTES.has(slug)) {
      let storeData = { region: null, products: [] as any[], count: 0 }
      try {
        storeData = await fetchStoreData(locale)
      } catch (e) { console.error("Failed to fetch store data:", e) }
      return { page: null, tenantSlug: tenant, locale, slug, isBuiltIn: true, storeData }
    }
    const tenantId = TENANT_SLUG_TO_ID[tenant] || DEFAULT_TENANT_ID
    let page: CMSPage | null = null
    try {
      page = await resolvePageFromServer(tenantId, slug, locale)
    } catch (e) { console.error("Failed to resolve CMS slug page:", e) }
    return { page, tenantSlug: tenant, locale, slug, isBuiltIn: false, storeData: null }
  },
  component: CMSSlugPageComponent,
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.isBuiltIn && loaderData?.slug === 'store' ? 'Store | Dakkah CityOS' : (loaderData?.page?.seo?.title || loaderData?.page?.title || 'Page') },
      { name: 'description', content: loaderData?.page?.seo?.description || '' },
    ],
  }),
})

function CMSSlugPageComponent() {
  const data = Route.useLoaderData()
  const { tenant, locale, slug } = Route.useParams()

  if (data?.isBuiltIn && slug === "store") {
    const products = data.storeData?.products || []

    return (
      <div className="content-container py-6">
        <h1 className="text-xl mb-6">All Products</h1>

        {products.length === 0 ? (
          <div className="text-ds-muted-foreground">No products found</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!data?.page) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-ds-foreground mb-4">Page Not Found</h1>
          <p className="text-ds-muted-foreground mb-6">The page you're looking for doesn't exist or hasn't been published yet.</p>
          <a href={`/${tenant}/${locale}`} className="text-ds-foreground underline hover:no-underline">Return home</a>
        </div>
      </div>
    )
  }

  const page = data.page
  const tenantObj = {
    id: typeof page.tenant === "string" ? page.tenant : page.tenant?.id || "",
    slug: tenant,
    name: typeof page.tenant === "object" ? page.tenant?.name || tenant : tenant,
  }

  return <TemplateRenderer page={page} tenant={tenantObj} locale={locale} />
}
