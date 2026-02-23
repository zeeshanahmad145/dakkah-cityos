import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { useParams } from "@tanstack/react-router"
import { useState, useEffect, useCallback } from "react"
import { getServerBaseUrl, getMedusaPublishableKey } from "@/lib/utils/env"

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "us",
  fr: "fr",
  ar: "sa",
}

const PUBLISHABLE_KEY = getMedusaPublishableKey()

function getBaseUrl() {
  return getServerBaseUrl()
}

const Store = () => {
  const { locale } = useParams({ strict: false }) as { locale: string }
  const countryCode = LOCALE_TO_COUNTRY[locale?.toLowerCase()] || locale?.toLowerCase() || "us"

  const [region, setRegion] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const LIMIT = 12

  useEffect(() => {
    if (typeof window === "undefined") return
    let cancelled = false

    async function fetchRegion() {
      try {
        const res = await fetch(`${getBaseUrl()}/store/regions`, {
          headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
        })
        if (!res.ok) return
        const data = await res.json()
        const regions = data.regions || []
        const matched = regions.find((r: any) =>
          r.countries?.some((c: any) => c.iso_2 === countryCode.toLowerCase())
        )
        if (!cancelled && matched) {
          setRegion(matched)
        }
      } catch (e) {
        console.error("Failed to fetch regions:", e)
      }
    }

    fetchRegion()
    return () => { cancelled = true }
  }, [countryCode])

  useEffect(() => {
    if (typeof window === "undefined" || !region?.id) return
    let cancelled = false

    async function fetchProducts() {
      setIsLoading(true)
      try {
        const res = await fetch(
          `${getBaseUrl()}/store/products?limit=${LIMIT}&offset=0&region_id=${region.id}`,
          { headers: { "x-publishable-api-key": PUBLISHABLE_KEY } }
        )
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setProducts(data.products || [])
          setTotalCount(data.count || 0)
          setOffset(LIMIT)
        }
      } catch (e) {
        console.error("Failed to fetch products:", e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchProducts()
    return () => { cancelled = true }
  }, [region?.id])

  const loadMore = useCallback(async () => {
    if (!region?.id || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(
        `${getBaseUrl()}/store/products?limit=${LIMIT}&offset=${offset}&region_id=${region.id}`,
        { headers: { "x-publishable-api-key": PUBLISHABLE_KEY } }
      )
      if (!res.ok) return
      const data = await res.json()
      setProducts((prev) => [...prev, ...(data.products || [])])
      setOffset((prev) => prev + LIMIT)
    } catch (e) {
      console.error("Failed to load more products:", e)
    } finally {
      setLoadingMore(false)
    }
  }, [region?.id, offset, loadingMore])

  const hasNextPage = offset < totalCount

  if (!region || isLoading) {
    return (
      <div className="content-container py-6">
        <h1 className="text-xl mb-6">All Products</h1>
        <div className="text-zinc-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="content-container py-6">
      <h1 className="text-xl mb-6">All Products</h1>

      {products.length === 0 ? (
        <div className="text-zinc-600">No products found</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasNextPage && (
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="secondary"
              className="mt-6"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default Store
