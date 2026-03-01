import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import ProductOptionSelect from "@/components/product-option-select"
import ProductPrice from "@/components/product-price"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { useCartDrawer } from "@/lib/context/cart"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { getVariantOptionsKeymap, isVariantInStock } from "@/lib/utils/product"
import { HttpTypes } from "@medusajs/types"
import { Link } from "@tanstack/react-router"
import { isEqual } from "lodash-es"
import { useEffect, useMemo, useRef, useState, memo } from "react"
import { VolumePricingDisplay } from "@/components/products/volume-pricing-display"
import { Minus, Plus } from "@medusajs/icons"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const ProductActions = memo(function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | undefined>
  >({})
  const [quantity, setQuantity] = useState(1)
  const prefix = useTenantPrefix()
  const toast = useToast()

  const addToCartMutation = useAddToCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const { openCart } = useCartDrawer()

  const actionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedOptions({})
  }, [product?.handle])

  useEffect(() => {
    if (product?.variants?.length === 1) {
      const optionsKeymap = getVariantOptionsKeymap(
        product?.variants?.[0]?.options ?? [],
      )
      setSelectedOptions(optionsKeymap ?? {})
    }
  }, [product?.variants])

  const selectedVariant = useMemo(() => {
    if (!product?.variants || product?.variants.length === 0) {
      return
    }

    if (
      product?.variants.length === 1 &&
      (!product?.options || product?.options.length === 0)
    ) {
      return product?.variants[0]
    }

    const variant = product?.variants.find((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      const matches = isEqual(optionsKeymap, selectedOptions)

      return matches
    })

    return variant
  }, [product?.variants, product?.options, selectedOptions])

  const setOptionValue = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const isValidVariant = useMemo(() => {
    return product?.variants?.some((v) => {
      const optionsKeymap = getVariantOptionsKeymap(v?.options ?? [])
      return isEqual(optionsKeymap, selectedOptions)
    })
  }, [product?.variants, selectedOptions])

  const inStock = useMemo(() => {
    if (!selectedVariant) {
      return false
    }

    return isVariantInStock(selectedVariant)
  }, [selectedVariant])

  const incrementQuantity = () => setQuantity((q) => q + 1)
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1))

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    addToCartMutation.mutateAsync(
      {
        variant_id: selectedVariant.id,
        quantity: quantity,
        country_code:
          region?.countries?.[0]?.iso_2 || prefix.split("/")[1] || "us",
        product,
        variant: selectedVariant,
        region,
      },
      {
        onSuccess: () => {
          toast.success("Item added to cart")
          setQuantity(1)
          openCart()
        },
        onError: () => {
          toast.error("Failed to add item to cart. Please try again.")
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-y-4" ref={actionsRef}>
      <ProductPrice
        product={product as HttpTypes.StoreProduct}
        variant={selectedVariant}
        priceProps={{
          textSize: "large",
        }}
      />

      {(product.variants?.length ?? 0) > 1 && (
        <div className="flex flex-col gap-y-4">
          {(product.options || []).map((option) => {
            return (
              <div key={option.id}>
                <ProductOptionSelect
                  option={option}
                  current={selectedOptions[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  data-testid="product-options"
                  disabled={!!disabled || addToCartMutation.isPending}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={decrementQuantity}
            disabled={quantity <= 1 || !!disabled}
            className="h-10 w-10 p-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-20 text-center h-10"
            disabled={!!disabled}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={incrementQuantity}
            disabled={!!disabled}
            className="h-10 w-10 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Volume Pricing Display */}
      {product.id && (
        <VolumePricingDisplay
          productId={product.id}
          currentQuantity={quantity}
        />
      )}

      {/* B2B Quote Link */}
      <div className="text-sm text-muted-foreground">
        <Link
          to={`${prefix}/quotes/request` as never}
          className="text-primary hover:underline"
        >
          Need a custom quote for larger orders?
        </Link>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={!inStock || !selectedVariant || !!disabled || !isValidVariant}
        variant="primary"
        className="w-full"
        data-testid="add-product-button"
      >
        {!selectedVariant
          ? "Select variant"
          : !inStock || !isValidVariant
            ? "Out of stock"
            : "Add to cart"}
      </Button>
    </div>
  )
})

export default ProductActions
