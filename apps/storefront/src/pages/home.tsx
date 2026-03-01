import { useLocation, useLoaderData, useParams } from "@tanstack/react-router"
import { useProducts } from "@/lib/hooks/use-products"
import { useCategories } from "@/lib/hooks/use-categories"
import { useRegion } from "@/lib/hooks/use-regions"
import ProductCard from "@/components/product-card"
import { useGovernanceContext } from "@/lib/context/governance-context"
import { useCMSVerticals } from "@/lib/hooks/use-cms"
import { usePlatformContext } from "@/lib/hooks/use-platform-context"

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "us",
  fr: "fr",
  ar: "sa",
}

function getBasePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length >= 2) {
    return `/${segments[0]}/${segments[1]}`
  }
  if (segments.length === 1) {
    return `/${segments[0]}`
  }
  return ""
}

const categoryLabels: Record<string, string> = {
  commerce: "Shopping & Commerce",
  services: "Professional Services",
  lifestyle: "Lifestyle & Entertainment",
  community: "Community & Social",
}

const steps = [
  {
    number: "01",
    title: "Browse",
    description:
      "Explore 25+ verticals and find exactly what you need across shopping, services, dining, and more.",
  },
  {
    number: "02",
    title: "Order",
    description:
      "Add to cart, book a service, or place a bid — our unified checkout handles it all seamlessly.",
  },
  {
    number: "03",
    title: "Enjoy",
    description:
      "Get deliveries, attend events, or access services. Track everything from your dashboard.",
  },
]

const stats = [
  { value: "25+", label: "Verticals" },
  { value: "190+", label: "Data Models" },
  { value: "500+", label: "Workflows" },
]

const Home = () => {
  const location = useLocation()
  const prefix = getBasePrefix(location.pathname)
  const loaderData = useLoaderData({ strict: false })
  const loaderRegion = loaderData?.region
  const { tenant, locale } = useParams({ strict: false }) as {
    tenant: string
    locale: string
  }

  const countryCode =
    LOCALE_TO_COUNTRY[locale?.toLowerCase()] || locale?.toLowerCase() || "us"
  const { data: fetchedRegion } = useRegion({ country_code: countryCode })
  const region = loaderRegion || fetchedRegion

  const { data: platformData } = usePlatformContext(tenant || "")
  const { data: verticals } = useCMSVerticals()

  const { data } = useProducts({
    region_id: region?.id,
    query_params: { limit: 4, order: "-created_at" },
  })

  const { data: categories } = useCategories({
    queryParams: { limit: 6 },
    enabled: true,
  })

  const { isVerticalAllowed, effectivePolicies, getCommercePolicy } =
    useGovernanceContext()
  const commercePolicy = getCommercePolicy()

  const products = data?.pages?.flatMap((page: any) => page.products) || []

  const groupedVerticals = (() => {
    if (!verticals || verticals.length === 0) return []
    const groups: Record<
      string,
      {
        slug: string
        title: string
        seoDescription: string
        category: string
      }[]
    > = {}
    for (const v of verticals) {
      if (!groups[v.category]) {
        groups[v.category] = []
      }
      groups[v.category].push(v)
    }
    return Object.entries(groups).map(([category, items]) => ({
      group: categoryLabels[category] || category,
      verticals: items,
    }))
  })()

  const tenantName = platformData?.tenant?.name || "Dakkah"
  const heroTitle = `${tenantName} CityOS Commerce Platform`
  const heroSubtitle =
    platformData?.tenant?.description ||
    "Your gateway to 25+ commerce verticals — from shopping and dining to healthcare, education, real estate, and beyond"

  return (
    <div>
      <section className="bg-gradient-to-b from-zinc-900 to-zinc-800 text-white">
        <div className="content-container py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {heroTitle}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-zinc-300 leading-relaxed">
              {heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href={`${prefix}/store`}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-zinc-900 font-semibold rounded-lg hover:bg-zinc-100 transition-colors text-base"
              >
                Explore Store
              </a>
              <a
                href={`${prefix}/bookings`}
                className="inline-flex items-center justify-center px-8 py-3.5 border border-zinc-500 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-base"
              >
                Browse Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {commercePolicy?.require_kyc && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="content-container py-3 flex items-center gap-2 text-sm text-amber-800">
            <span>🔒</span>
            <span>
              Identity verification required for transactions in this region
            </span>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <section className="py-16 bg-white">
          <div className="content-container">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
                Featured Products
              </h2>
              <a
                href={`${prefix}/store`}
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                View All →
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-zinc-50">
        <div className="content-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
              Discover All Verticals
            </h2>
            <p className="mt-3 text-zinc-500 max-w-2xl mx-auto">
              One platform, every commerce vertical. Explore the full ecosystem
              of services and marketplaces.
            </p>
          </div>

          <div className="space-y-12">
            {groupedVerticals
              .map((category) => {
                const allowedVerticals = category.verticals.filter((v) =>
                  isVerticalAllowed(v.title),
                )
                if (allowedVerticals.length === 0) return null
                return (
                  <div key={category.group}>
                    <h3 className="text-lg font-semibold text-zinc-700 mb-4 border-b border-zinc-200 pb-2">
                      {category.group}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {allowedVerticals.map((vertical) => (
                        <a
                          key={vertical.slug}
                          href={`${prefix}/${vertical.slug}`}
                          className="group flex items-start gap-3 p-4 bg-white rounded-lg border border-zinc-200 hover:border-zinc-400 hover:shadow-sm transition-all"
                        >
                          <span className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-600">
                            {vertical.title.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors">
                              {vertical.title}
                            </h4>
                            <p className="text-sm text-zinc-500 mt-0.5 leading-snug">
                              {vertical.seoDescription}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )
              })
              .filter(Boolean)}
          </div>
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="content-container">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900">
                Shop by Category
              </h2>
              <p className="mt-3 text-zinc-500">
                Find products organized by what you're looking for
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat: any) => (
                <a
                  key={cat.id}
                  href={`${prefix}/categories/${cat.handle}`}
                  className="group flex flex-col items-center p-6 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors text-center"
                >
                  <span className="text-3xl mb-3">🏷️</span>
                  <span className="font-medium text-zinc-900 group-hover:text-zinc-700 text-sm">
                    {cat.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-zinc-900 text-white">
        <div className="content-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">How It Works</h2>
            <p className="mt-3 text-zinc-400">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 text-lg font-bold text-white mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-zinc-50">
        <div className="content-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-zinc-900">
                  {stat.value}
                </div>
                <div className="mt-2 text-zinc-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
