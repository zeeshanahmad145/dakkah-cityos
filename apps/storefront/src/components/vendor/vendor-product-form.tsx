import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { sdk } from "@/lib/utils/sdk"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface ProductFormData {
  title: string
  subtitle?: string
  description?: string
  handle?: string
  is_giftcard?: boolean
  discountable?: boolean
  status?: string
  weight?: number
  length?: number
  height?: number
  width?: number
  hs_code?: string
  origin_country?: string
  mid_code?: string
  material?: string
  collection_id?: string
  type_id?: string
  variants?: VariantData[]
}

interface VariantData {
  title: string
  sku?: string
  barcode?: string
  inventory_quantity?: number
  manage_inventory?: boolean
  prices?: Array<{ amount: number; currency_code: string }>
}

interface VendorProductFormProps {
  initialData?: ProductFormData & { id?: string }
  mode?: "create" | "edit"
}

export function VendorProductForm({
  initialData,
  mode = "create",
}: VendorProductFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const prefix = useTenantPrefix()

  const [formData, setFormData] = useState<ProductFormData>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    description: initialData?.description || "",
    handle: initialData?.handle || "",
    status: initialData?.status || "draft",
    weight: initialData?.weight,
    length: initialData?.length,
    height: initialData?.height,
    width: initialData?.width,
    material: initialData?.material || "",
    discountable: initialData?.discountable ?? true,
    variants: initialData?.variants || [
      {
        title: "Default",
        sku: "",
        inventory_quantity: 0,
        manage_inventory: true,
        prices: [{ amount: 0, currency_code: "usd" }],
      },
    ],
  })

  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return sdk.client.fetch("/vendor/products", {
        method: "POST",
        body: data,
        credentials: "include",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] })
      navigate({ to: `${prefix}/vendor/products` })
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return sdk.client.fetch(`/vendor/products/${initialData?.id}`, {
        method: "PATCH",
        body: data,
        credentials: "include",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] })
      navigate({ to: `${prefix}/vendor/products` })
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError("Product title is required")
      return
    }

    if (mode === "edit") {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const updateVariant = (index: number, field: string, value: unknown) => {
    const newVariants = [...(formData.variants || [])]
    if (field === "price") {
      newVariants[index] = {
        ...newVariants[index],
        prices: [{ amount: value as number, currency_code: "usd" }],
      }
    } else {
      newVariants[index] = { ...newVariants[index], [field]: value }
    }
    setFormData({ ...formData, variants: newVariants })
  }

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...(formData.variants || []),
        {
          title: `Variant ${(formData.variants?.length || 0) + 1}`,
          sku: "",
          inventory_quantity: 0,
          manage_inventory: true,
          prices: [{ amount: 0, currency_code: "usd" }],
        },
      ],
    })
  }

  const removeVariant = (index: number) => {
    if ((formData.variants?.length || 0) <= 1) return
    const newVariants = formData.variants?.filter((_, i) => i !== index)
    setFormData({ ...formData, variants: newVariants })
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-3xl mx-auto">
      <button
        type="button"
        onClick={() => navigate({ to: `${prefix}/vendor/products` })}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      <h1 className="text-2xl font-bold mb-8">
        {mode === "edit" ? "Edit Product" : "Add New Product"}
      </h1>

      {error && (
        <div className="bg-ds-destructive border border-ds-destructive text-ds-destructive px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form
        aria-label="Product form"
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Basic Information */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Product title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle || ""}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Short subtitle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md min-h-[120px]"
              placeholder="Product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Handle</label>
            <input
              type="text"
              value={formData.handle || ""}
              onChange={(e) =>
                setFormData({ ...formData, handle: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="product-handle (auto-generated if empty)"
            />
          </div>
        </div>

        {/* Variants & Pricing */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Variants & Pricing</h2>
            <Button type="button" variant="secondary" onClick={addVariant}>
              Add Variant
            </Button>
          </div>

          {formData.variants?.map((variant, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Variant {index + 1}</h3>
                {(formData.variants?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-ds-destructive text-sm hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Variant Title
                  </label>
                  <input
                    type="text"
                    value={variant.title}
                    onChange={(e) =>
                      updateVariant(index, "title", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    value={variant.sku || ""}
                    onChange={(e) =>
                      updateVariant(index, "sku", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.prices?.[0]?.amount || 0}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "price",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Inventory Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variant.inventory_quantity || 0}
                    onChange={(e) =>
                      updateVariant(
                        index,
                        "inventory_quantity",
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={variant.manage_inventory ?? true}
                  onChange={(e) =>
                    updateVariant(index, "manage_inventory", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">Track inventory</span>
              </label>
            </div>
          ))}
        </div>

        {/* Dimensions & Details */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Dimensions & Details</h2>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Weight (g)
              </label>
              <input
                type="number"
                min="0"
                value={formData.weight || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight: parseFloat(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Length (cm)
              </label>
              <input
                type="number"
                min="0"
                value={formData.length || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    length: parseFloat(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Width (cm)
              </label>
              <input
                type="number"
                min="0"
                value={formData.width || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    width: parseFloat(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="0"
                value={formData.height || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    height: parseFloat(e.target.value) || undefined,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Material</label>
            <input
              type="text"
              value={formData.material || ""}
              onChange={(e) =>
                setFormData({ ...formData, material: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Cotton, Leather"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.discountable ?? true}
              onChange={(e) =>
                setFormData({ ...formData, discountable: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm">Allow discounts on this product</span>
          </label>
        </div>

        {/* Status */}
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={formData.status === "draft"}
                onChange={() => setFormData({ ...formData, status: "draft" })}
              />
              <span>Draft</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="published"
                checked={formData.status === "published"}
                onChange={() =>
                  setFormData({ ...formData, status: "published" })
                }
              />
              <span>Published</span>
            </label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Draft products are not visible on the storefront. Published products
            will be visible after approval.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Product"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate({ to: `${prefix}/vendor/products` })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
