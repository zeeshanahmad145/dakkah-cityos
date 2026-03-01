import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import { Plus, Trash, PencilSquare } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface VendorProduct {
  id: string
  title: string
  description?: string
  thumbnail?: string
  status: string
  variants?: Array<{
    id: string
    prices?: Array<{
      amount: number
      currency_code: string
    }>
  }>
}

export function VendorProductList() {
  const prefix = useTenantPrefix()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ products: VendorProduct[] }>(
        "/vendor/products",
        {
          credentials: "include",
        },
      )
      return response
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return sdk.client.fetch(`/vendor/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] })
    },
  })

  const products = data?.products || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-muted rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Products</h1>
        <Link to={`${prefix}/vendor/products/new` as never}>
          <Button>
            <Plus className="w-4 h-4 me-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">
            You haven't added any products yet
          </p>
          <Link to={`${prefix}/vendor/products/new` as never}>
            <Button>
              <Plus className="w-4 h-4 me-2" />
              Add Your First Product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4">
              <div className="flex items-start gap-4">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded"
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{product.title}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <ProductStatusBadge status={product.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    {product.variants?.[0]?.prices?.[0] && (
                      <span className="font-medium">
                        ${product.variants[0].prices[0].amount.toFixed(2)}
                      </span>
                    )}
                    <div className="flex gap-2">
                      <Button variant="secondary" className="h-8 px-3">
                        <PencilSquare className="w-4 h-4 me-1" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="h-8 px-3"
                        onClick={() => deleteMutation.mutate(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-ds-success text-ds-success",
    draft: "bg-ds-muted text-ds-foreground",
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || "bg-ds-muted"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
