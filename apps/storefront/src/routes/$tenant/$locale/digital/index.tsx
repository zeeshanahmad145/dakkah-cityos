// @ts-nocheck
import { t } from "@/lib/i18n"
import {
  getServerBaseUrl,
  fetchWithTimeout,
  getMedusaPublishableKey,
} from "@/lib/utils/env"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/$tenant/$locale/digital/")({
  component: DigitalProductsPage,
  head: () => ({
    meta: [
      { title: "Digital Products | Dakkah CityOS" },
      {
        name: "description",
        content: "Browse digital products on Dakkah CityOS",
      },
    ],
  }),
  loader: async () => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/digital-products`, {
        headers: {
          "x-publishable-api-key": getMedusaPublishableKey(),
        },
      })
      if (!resp.ok) return { items: [], count: 0 }
      const data = await resp.json()
      const raw =
        data.items ||
        data.listings ||
        data.products ||
        data.services ||
        data.warranties ||
        data.plans ||
        data.digital_products ||
        []
      const items = raw.map((item: any) => {
        const meta = item.metadata || {}
        return {
          id: item.id,
          title: item.title || meta.title || "Untitled Product",
          description: meta.description || item.description || "",
          file_type: item.file_type || meta.file_type || null,
          file_size_bytes: item.file_size_bytes || meta.file_size_bytes || 0,
          preview_url: item.preview_url || meta.preview_url || null,
          version: item.version || meta.version || null,
          max_downloads: item.max_downloads || meta.max_downloads || null,
          is_active: item.is_active !== false,
          thumbnail:
            item.thumbnail || meta.thumbnail || meta.images?.[0] || null,
          images: meta.images || [],
          price: meta.price || item.price || null,
          category: meta.category || item.category || null,
          rating: meta.rating || item.rating || null,
          currency_code: item.currency_code || meta.currency_code || "USD",
        }
      })
      return { items, count: data.count || items.length }
    } catch {
      return { items: [], count: 0 }
    }
  },
})

const categoryOptions = [
  "all",
  "ebook",
  "audio",
  "video",
  "software",
  "template",
  "image",
  "pdf",
] as const

const fileTypeIcons: Record<string, string> = {
  ebook: "📚",
  audio: "🎵",
  video: "🎬",
  software: "💻",
  template: "📄",
  image: "🖼️",
  pdf: "📑",
}

const fileTypeColors: Record<string, string> = {
  ebook: "bg-ds-success/15 text-ds-success",
  audio: "bg-ds-destructive/15 text-ds-destructive",
  video: "bg-ds-destructive/15 text-ds-destructive",
  software: "bg-ds-info/15 text-ds-info",
  template: "bg-ds-warning/15 text-ds-warning",
  image: "bg-ds-primary/15 text-ds-primary",
  pdf: "bg-ds-warning/15 text-ds-warning",
}

function formatFileSize(bytes: number): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(1)} GB`
}

function DigitalProductsPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const loaderData = Route.useLoaderData()
  const items = loaderData?.items || []
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredItems = items.filter((item: any) => {
    const matchesSearch = searchQuery
      ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      : true
    const matchesCategory =
      categoryFilter === "all" ||
      item.file_type?.toLowerCase() === categoryFilter ||
      item.category?.toLowerCase() === categoryFilter
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return "Free"
    const amount = price >= 100 ? price / 100 : price
    return `${amount.toLocaleString()} ${currency}`
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-primary/100 to-ds-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">Digital Products</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "digital_products.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Browse and download premium digital content — ebooks, templates,
            software, audio, video, and more.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>{items.length} products available</span>
            <span>|</span>
            <span>{t(locale, "verticals.instant_booking")}</span>
            <span>|</span>
            <span>{t(locale, "verticals.secure_transactions")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-ds-background border border-ds-border rounded-xl p-4 space-y-6 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.search_label")}
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(locale, "digital_products.search_placeholder")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ds-foreground mb-2">
                  {t(locale, "verticals.category_label")}
                </label>
                <div className="space-y-1">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setCategoryFilter(opt)}
                      className={`block w-full text-start px-3 py-2 text-sm rounded-lg transition-colors ${categoryFilter === opt ? "bg-ds-primary text-white" : "text-ds-foreground hover:bg-ds-muted"}`}
                    >
                      {opt === "all"
                        ? t(locale, "verticals.all_categories")
                        : `${fileTypeIcons[opt] || ""} ${opt.charAt(0).toUpperCase() + opt.slice(1)}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
                <svg
                  className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-ds-foreground mb-2">
                  {t(locale, "digital_products.no_results")}
                </h3>
                <p className="text-ds-muted-foreground text-sm">
                  {t(locale, "verticals.try_adjusting")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={`${prefix}/digital/${item.id}`}
                    className="group bg-ds-background border border-ds-border rounded-xl overflow-hidden hover:shadow-lg hover:border-ds-primary/50 transition-all duration-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-ds-primary/10 to-ds-primary/15 relative overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          loading="lazy"
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-ds-primary/50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      {(item.file_type || item.category) && (
                        <span
                          className={`absolute top-2 start-2 px-2 py-1 text-xs font-medium rounded-md uppercase ${fileTypeColors[(item.file_type || item.category)?.toLowerCase()] || "bg-ds-muted text-ds-foreground/80"}`}
                        >
                          {item.file_type || item.category}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-ds-foreground group-hover:text-ds-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-ds-muted-foreground mt-1.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-3 text-xs text-ds-muted-foreground flex-wrap">
                        {item.file_size_bytes > 0 && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            {formatFileSize(item.file_size_bytes)}
                          </span>
                        )}
                        {item.version && (
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            v{item.version}
                          </span>
                        )}
                      </div>

                      {item.rating && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= Math.round(item.rating) ? "text-ds-warning" : "text-ds-border"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs text-ds-muted-foreground">
                            {item.rating}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 mt-3 border-t border-ds-border">
                        <span className="font-bold text-ds-primary text-lg">
                          {formatPrice(item.price, item.currency_code)}
                        </span>
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-ds-primary rounded-lg group-hover:bg-ds-primary/90 transition-colors">
                          {t(locale, "digital_products.download_now")}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">
            {t(locale, "verticals.how_it_works")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Browse & Choose
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Explore our catalog of digital products across multiple
                categories.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Purchase Securely
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Complete your purchase with our secure payment system.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-primary text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Download Instantly
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Get instant access to your digital product and start using it
                right away.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
