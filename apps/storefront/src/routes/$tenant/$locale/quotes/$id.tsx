// @ts-nocheck
import { getServerBaseUrl, fetchWithTimeout } from "@/lib/utils/env"
import { createFileRoute } from "@tanstack/react-router";
import { QuoteDetails } from "@/components/quotes/quote-details";
import { TimelineBlock } from "@/components/blocks/timeline-block"

interface QuoteItem {
  id: string;
  product_id: string;
  variant_id?: string;
  title: string;
  sku?: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  custom_price?: number;
}

interface Quote {
  id: string;
  quote_number: string;
  status: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  customer_notes?: string;
  internal_notes?: string;
  discount_reason?: string;
  created_at: string;
  valid_until?: string;
  items: QuoteItem[];
}

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

export const Route = createFileRoute("/$tenant/$locale/quotes/$id")({
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/quotes/${params.id}`, {
        headers: { "x-publishable-api-key": import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "pk_b52dbbf895687445775c819d8cd5cb935f27231ef3a32ade606b58d9e5798d3a" },
      })
      if (!resp.ok) return { item: null }
      const data = await resp.json()
      return { item: normalizeDetail(data.quote || data.item || data) }
    } catch { return { item: null } }
  },
  component: QuoteDetailPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || loaderData?.name || "Quote Details"} | Dakkah CityOS` },
      { name: "description", content: loaderData?.description || loaderData?.excerpt || "" },
    ],
  }),
});

function QuoteDetailPage() {
  const { id } = Route.useParams();

  const loaderData = Route.useLoaderData()
  const quote = loaderData?.item

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {quote && <QuoteDetails quote={quote} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TimelineBlock />
      </div>
    </div>
  );
}
