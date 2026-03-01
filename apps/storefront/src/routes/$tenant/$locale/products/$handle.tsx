import { listProducts, retrieveProduct } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { queryKeys } from "@/lib/utils/query-keys"
import ProductDetails from "@/pages/product"
import { HttpTypes } from "@medusajs/types"
import { createFileRoute, notFound } from "@tanstack/react-router"

export const Route = createFileRoute("/$tenant/$locale/products/$handle")({
  loader: async ({ params, context }) => {
    const { locale, handle } = params
    if (typeof window === "undefined")
      return { locale, region: null, product: null }
    const { queryClient } = context

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", locale],
      queryFn: () => getRegion({ country_code: locale }),
    })

    if (!region || !handle) {
      throw notFound()
    }

    // Single comprehensive product fetch with all needed fields
    const product = await queryClient.ensureQueryData({
      queryKey: ["product", handle, region.id],
      queryFn: async () => {
        try {
          return await retrieveProduct({
            handle,
            region_id: region.id,
          })
        } catch {
          throw notFound()
        }
      },
    })

    // Ensure related products are loaded for SSR to prevent hydration mismatch
    // This ensures consistent rendering between server and client
    await queryClient.ensureQueryData({
      queryKey: queryKeys.products.related(product.id, region.id),
      queryFn: async () => {
        const params: Record<string, any> = {
          fields: "title, handle, *thumbnail, *variants",
          is_giftcard: false,
          limit: 4,
        }

        if (product.collection_id) {
          params.collection_id = [product.collection_id]
        }

        if (product.tags && product.tags.length > 0) {
          params.tag_id = product.tags.map((tag) => tag.id)
        }

        const { products } = await listProducts({
          query_params: params,
          region_id: region.id,
        })

        return products.filter((p) => p.id !== product.id)
      },
    })

    return {
      locale,
      region,
      product: product as HttpTypes.StoreProduct,
    }
  },
  head: ({ loaderData }) => {
    const { product, region } = loaderData || {}

    if (!product) {
      return {
        meta: [
          {
            title: "Product Not Found | Dakkah CityOS",
          },
        ],
      }
    }

    // Create structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      image: product.images?.map((img: any) => img.url).filter(Boolean) || [],
      brand: {
        "@type": "Brand",
        name: "Dakkah CityOS",
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: region?.currency_code?.toUpperCase(),
        price: product.variants?.[0]?.calculated_price?.calculated_amount
          ? product.variants[0].calculated_price.calculated_amount.toFixed(2)
          : undefined,
      },
    }

    // Get first product image for preloading (critical for LCP)
    const firstImageUrl = product.images?.[0]?.url || product.thumbnail

    return {
      meta: [
        {
          title: `${product.title} | Dakkah CityOS`,
        },
        {
          name: "description",
          content: product.description || "Product details",
        },
        {
          property: "og:title",
          content: `${product.title} | Dakkah CityOS`,
        },
        {
          property: "og:description",
          content:
            product.description || "Check out this product on Dakkah CityOS",
        },
        {
          property: "og:image",
          content: product.thumbnail || "",
        },
      ],
      links: firstImageUrl
        ? [
            {
              rel: "preload",
              href: firstImageUrl,
              as: "image",
              fetchPriority: "high",
            },
          ]
        : [],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData),
        },
      ],
    }
  },
  component: ProductDetails,
})
