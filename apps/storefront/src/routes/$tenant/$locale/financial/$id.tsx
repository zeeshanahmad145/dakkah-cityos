// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { t } from "@/lib/i18n"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ComparisonTableBlock } from "@/components/blocks/comparison-table-block"
import { StatsBlock } from "@/components/blocks/stats-block"

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

export const Route = createFileRoute("/$tenant/$locale/financial/$id")({
  component: FinancialDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Financial Product Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/financial-products/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_8284bf2e6620fac6cd844648a64e64ed0b4a0cf402d4dfc66725ffc67854d8a6" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.item || data) }
    } catch { return { item: null } }
  },
})

function FinancialDetailPage() {
  const { tenant, locale, id } = Route.useParams()
  const prefix = `/${tenant}/${locale}`

  const loaderData = Route.useLoaderData()
  const product = loaderData?.item

  if (!product) {
    return (
      <div className="min-h-screen bg-ds-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-ds-foreground mb-2">Product Not Found</h2>
            <p className="text-ds-muted-foreground mb-6">This financial product may have been removed or is no longer available.</p>
            <Link to={`${prefix}/financial` as any} className="inline-flex items-center px-4 py-2 text-sm font-medium bg-ds-primary text-ds-primary-foreground rounded-lg hover:bg-ds-primary/90 transition-colors">
              Browse Financial Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    loan: "Loan",
    savings: "Savings",
    investment: "Investment",
    mortgage: "Mortgage",
    credit: "Credit",
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-card border-b border-ds-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-ds-muted-foreground">
            <Link to={`${prefix}` as any} className="hover:text-ds-foreground transition-colors">{t(locale, 'common.home')}</Link>
            <span>/</span>
            <Link to={`${prefix}/financial` as any} className="hover:text-ds-foreground transition-colors">Financial Products</Link>
            <span>/</span>
            <span className="text-ds-foreground truncate">{product.name || product.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-ds-background border border-ds-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-ds-primary/10 rounded-xl flex items-center justify-center text-ds-primary flex-shrink-0">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-ds-foreground">{product.name || product.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {product.type && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-ds-primary/10 text-ds-primary">
                        {typeLabels[product.type] || product.type}
                      </span>
                    )}
                    {product.institution && (
                      <span className="text-sm text-ds-muted-foreground">by {product.institution}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {product.rate != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Interest Rate</p>
                  <p className="text-lg font-bold text-ds-primary">{product.rate}%</p>
                  <p className="text-xs text-ds-muted-foreground">APR</p>
                </div>
              )}
              {product.term && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Term</p>
                  <p className="text-lg font-bold text-ds-foreground">{product.term}</p>
                </div>
              )}
              {product.min_amount != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Min Amount</p>
                  <p className="text-lg font-bold text-ds-foreground">${Number(product.min_amount || 0).toLocaleString()}</p>
                </div>
              )}
              {product.max_amount != null && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-muted-foreground mb-1">Max Amount</p>
                  <p className="text-lg font-bold text-ds-foreground">${Number(product.max_amount || 0).toLocaleString()}</p>
                </div>
              )}
            </div>

            {product.description && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Product Details</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.features && product.features.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-4">Features & Benefits</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.features.map((feature: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm p-3 bg-ds-muted/30 rounded-lg">
                      <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-ds-foreground">{typeof feature === "string" ? feature : feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.requirements && product.requirements.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Eligibility Requirements</h2>
                <div className="space-y-2">
                  {product.requirements.map((req: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                      <svg className="w-4 h-4 text-ds-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                      {typeof req === "string" ? req : req.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.terms_conditions && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Terms & Conditions</h2>
                <p className="text-ds-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{product.terms_conditions}</p>
              </div>
            )}

            {product.fees && product.fees.length > 0 && (
              <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                <h2 className="font-semibold text-ds-foreground mb-3">Fees & Charges</h2>
                <div className="space-y-2">
                  {product.fees.map((fee: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-ds-muted/30 rounded-lg">
                      <span className="text-sm text-ds-foreground">{typeof fee === "string" ? fee : fee.name}</span>
                      {fee.amount != null && <span className="text-sm font-medium text-ds-foreground">${Number(fee.amount || 0).toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-4 space-y-6">
              <div className="bg-ds-background border border-ds-border rounded-xl p-6 space-y-4">
                {product.rate != null && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-ds-primary">{product.rate}%</p>
                    <p className="text-sm text-ds-muted-foreground">Annual Percentage Rate</p>
                  </div>
                )}

                <button className="w-full py-3 px-4 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:bg-ds-primary/90 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Apply Now
                </button>

                <button className="w-full py-3 px-4 border border-ds-border text-ds-foreground rounded-lg font-medium hover:bg-ds-muted transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  Calculator
                </button>
              </div>

              {product.highlights && product.highlights.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Highlights</h3>
                  <div className="space-y-2">
                    {product.highlights.map((highlight: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                        <svg className="w-4 h-4 text-ds-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {typeof highlight === "string" ? highlight : highlight.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.documents && product.documents.length > 0 && (
                <div className="bg-ds-background border border-ds-border rounded-xl p-6">
                  <h3 className="font-semibold text-ds-foreground mb-3">Documents Required</h3>
                  <div className="space-y-2">
                    {product.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-ds-muted-foreground">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {typeof doc === "string" ? doc : doc.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComparisonTableBlock />
        <StatsBlock />
      </div>
    </div>
  )
}
