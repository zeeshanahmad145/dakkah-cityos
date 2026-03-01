import ProductActions from "@/components/product-actions"
import ProductCard from "@/components/product-card"
import { ImageGallery } from "@/components/ui/image-gallery"
import { ReviewList } from "@/components/reviews/review-list"
import { ReviewForm } from "@/components/reviews/review-form"
import { AddToWishlistButton } from "@/components/wishlist/add-to-wishlist-button"
import { CompareButton } from "@/components/compare/compare-button"
import BNPLEligibilityBadge from "@/components/checkout/bnpl-eligibility-badge"
import { retrieveProduct } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { useProductReviews } from "@/lib/hooks/use-reviews"
import { useQuery } from "@tanstack/react-query"
import { useLoaderData, useParams } from "@tanstack/react-router"

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "us",
  fr: "fr",
  ar: "sa",
}

const ProductDetails = () => {
  const loaderData = useLoaderData({ strict: false })
  const params = useParams({ strict: false })
  const handle = params?.handle
  const locale = params?.locale || "en"
  const countryCode =
    LOCALE_TO_COUNTRY[locale?.toLowerCase()] || locale?.toLowerCase() || "us"

  const { data: region } = useQuery({
    queryKey: ["region", locale],
    queryFn: () => getRegion({ country_code: countryCode }),
    initialData: loaderData?.region || undefined,
    staleTime: Infinity,
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", handle, region?.id],
    queryFn: () =>
      retrieveProduct({
        handle: handle!,
        region_id: region!.id,
      }),
    initialData: loaderData?.product || undefined,
    enabled: !!handle && !!region?.id,
    staleTime: 30000,
  })

  const { data: reviewsData, isLoading: reviewsLoading } = useProductReviews(
    product?.id || "",
    { limit: 10 },
  )

  const relatedProducts = (loaderData as any)?.relatedProducts || []

  const cheapestPrice = product?.variants
    ?.map((v: any) => v.calculated_price?.calculated_amount)
    .filter(Boolean)
    .sort((a: number, b: number) => a - b)[0]

  const priceCurrency =
    product?.variants?.[0]?.calculated_price?.currency_code?.toUpperCase() ||
    "USD"

  if (!product || isLoading) {
    return (
      <div className="content-container py-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-zinc-100 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-zinc-100 rounded w-2/3" />
              <div className="h-4 bg-zinc-100 rounded w-full" />
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <ImageGallery images={product.images || []} />
        </div>
        <div>
          <h1 className="text-2xl font-medium mb-2">{product.title}</h1>
          {cheapestPrice != null && (
            <div className="mb-4">
              <BNPLEligibilityBadge
                price={cheapestPrice / 100}
                currency={priceCurrency}
              />
            </div>
          )}
          {product.description && (
            <p className="text-secondary-text mb-6">{product.description}</p>
          )}
          {region && <ProductActions product={product} region={region} />}
          <div className="flex items-center gap-3 mt-4">
            <AddToWishlistButton productId={product.id} />
            <CompareButton
              productId={product.id}
              productTitle={product.title || ""}
            />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t pt-10">
        <h2 className="text-xl font-medium mb-6">Customer Reviews</h2>
        <ReviewList
          reviews={reviewsData?.reviews || []}
          summary={reviewsData?.summary}
          isLoading={reviewsLoading}
        />
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Write a Review</h3>
          <ReviewForm productId={product.id} />
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t pt-10">
          <h2 className="text-xl font-medium mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((rp: any) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetails
