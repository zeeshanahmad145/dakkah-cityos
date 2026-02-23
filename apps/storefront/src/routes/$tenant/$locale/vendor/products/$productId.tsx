import { AuthGuard } from "@/components/auth/auth-guard"
import { createFileRoute } from "@tanstack/react-router"
import { getServerBaseUrl, fetchWithTimeout, getMedusaPublishableKey } from "@/lib/utils/env"
import { VendorProductForm } from "@/components/vendor/vendor-product-form"

export const Route = createFileRoute("/$tenant/$locale/vendor/products/$productId")({
  component: EditProductRoute,
  loader: async ({ params }) => {
    try {
      const baseUrl = getServerBaseUrl()
      const resp = await fetchWithTimeout(`${baseUrl}/store/products/${params.productId}`, {
        headers: { "x-publishable-api-key": getMedusaPublishableKey() },
      })
      if (!resp.ok) return { product: null }
      const data = await resp.json()
      return { product: data.product || data.item || null }
    } catch { return { product: null } }
  },
})

function EditProductRoute() {
  const loaderData = Route.useLoaderData()
  const product = loaderData?.product

  if (!product) {
    return (
      <div className="container mx-auto py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
          <div className="border rounded-lg p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-12">
        <VendorProductForm
          mode="edit"
          initialData={product as Parameters<typeof VendorProductForm>[0]["initialData"]}
        />
      </div>
    </AuthGuard>
  )
}
