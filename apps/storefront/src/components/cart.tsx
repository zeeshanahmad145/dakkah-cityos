import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { Price } from "@/components/ui/price"
import { Thumbnail } from "@/components/ui/thumbnail"
import {
  useCart,
  useDeleteLineItem,
  useUpdateLineItem,
  useApplyPromoCode,
  useRemovePromoCode,
} from "@/lib/hooks/use-cart"
import { sortCartItems } from "@/lib/utils/cart"
import { getPricePercentageDiff } from "@/lib/utils/price"
import { useCartDrawer } from "@/lib/context/cart"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { Minus, Plus, Trash, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Link } from "@tanstack/react-router"
import { clsx } from "clsx"
import { useState } from "react"


type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
  className?: string
}

export const LineItemPrice = ({ item, currencyCode, className }: LineItemPriceProps) => {
  const { total, original_total } = item
  const originalPrice = original_total
  const currentPrice = total
  const hasReducedPrice = currentPrice && originalPrice && currentPrice < originalPrice

  return (
    <Price
      price={currentPrice || 0}
      currencyCode={currencyCode}
      originalPrice={
        hasReducedPrice
          ? {
              price: originalPrice || 0,
              percentage: getPricePercentageDiff(originalPrice || 0, currentPrice || 0),
            }
          : undefined
      }
      className={className}
    />
  )
}


type CartDeleteItemProps = {
  item: HttpTypes.StoreCartLineItem
  fields?: string
}

export const CartDeleteItem = ({ item, fields }: CartDeleteItemProps) => {
  const deleteLineItemMutation = useDeleteLineItem({ fields })
  return (
    <Button
      onClick={() => deleteLineItemMutation.mutate({ line_id: item.id })}
      disabled={deleteLineItemMutation.isPending}
      className="text-ds-muted-foreground hover:text-ds-muted-foreground transition-colors ms-2"
      variant="transparent"
      size="fit"
    >
      <Trash />
    </Button>
  )
}


type CartItemQuantitySelectorProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "default" | "compact"
  fields?: string
}

export const CartItemQuantitySelector = ({
  item,
  type = "default",
  fields,
}: CartItemQuantitySelectorProps) => {
  const updateLineItemMutation = useUpdateLineItem({ fields })
  const deleteLineItemMutation = useDeleteLineItem({ fields })

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      deleteLineItemMutation.mutate({ line_id: item.id })
    } else {
      updateLineItemMutation.mutate({
        line_id: item.id,
        quantity: newQuantity,
      })
    }
  }

  return (
    <div className="flex items-center">
      <Button
        onClick={() => handleQuantityChange(item.quantity - 1)}
        className={clsx(
          type === "compact" &&
            "text-ds-muted-foreground hover:text-ds-muted-foreground transition-colors p-1 ms-2"
        )}
        variant="transparent"
        size="fit"
      >
        <Minus />
      </Button>
      <span
        className={clsx(
          type === "compact"
            ? "text-sm text-ds-foreground text-center px-3"
            : "text-center text-sm px-6"
        )}
      >
        {item.quantity}
      </span>
      <Button
        onClick={() => handleQuantityChange(item.quantity + 1)}
        className={clsx(
          type === "compact" &&
            "text-ds-muted-foreground hover:text-ds-muted-foreground transition-colors p-1 ms-2"
        )}
        variant="transparent"
        size="fit"
      >
        <Plus />
      </Button>
    </div>
  )
}


interface CartLineItemProps {
  item: HttpTypes.StoreCartLineItem
  cart: HttpTypes.StoreCart
  type?: "default" | "compact" | "display"
  fields?: string
  className?: string
}

const CompactCartLineItem = ({ item, cart, fields }: CartLineItemProps) => {
  return (
    <div className="flex items-start gap-x-4" data-testid="cart-item">
      <Thumbnail thumbnail={item.thumbnail} alt={item.product_title || item.title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-base font-medium line-clamp-1 text-ds-foreground">
              {item.product_title}
            </h4>
            <div className="text-sm text-ds-muted-foreground">
              {item.variant_title && item.variant_title !== "Default Variant" && (
                <span>{item.variant_title}</span>
              )}
            </div>
          </div>
          <CartDeleteItem item={item} fields={fields} />
        </div>

        <div className="flex items-center justify-between mt-2">
          <CartItemQuantitySelector item={item} fields={fields} />
          <Price price={item.total || 0} currencyCode={cart.currency_code} textSize="small" />
        </div>
      </div>
    </div>
  )
}

const DisplayCartLineItem = ({ item, cart, className }: CartLineItemProps) => {
  return (
    <div
      className={clsx(
        "flex items-center gap-4 py-3 border-b border-ds-border last:border-b-0",
        className
      )}
    >
      <Thumbnail
        thumbnail={item.thumbnail}
        alt={item.product_title || item.title}
        className="w-16 h-16"
      />
      <div className="flex-1">
        <p className="text-base font-semibold text-ds-foreground">{item.product_title}</p>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <p className="text-sm text-ds-muted-foreground">{item.variant_title}</p>
        )}
        <p className="text-sm text-ds-muted-foreground">Quantity: {item.quantity}</p>
      </div>
      <div className="text-end">
        <Price price={item.total || 0} currencyCode={cart.currency_code} textWeight="plus" />
      </div>
    </div>
  )
}

export const CartLineItem = ({
  item,
  cart,
  type = "default",
  fields,
  className,
}: CartLineItemProps) => {
  if (type === "compact") {
    return <CompactCartLineItem item={item} cart={cart} fields={fields} className={className} />
  }

  if (type === "display") {
    return <DisplayCartLineItem item={item} cart={cart} className={className} />
  }

  return (
    <div className="flex items-center gap-6 py-4">
      <div className="flex-shrink-0">
        <Thumbnail thumbnail={item.thumbnail} alt={item.product_title || item.title} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-y-1">
        <span className="text-ds-foreground text-base font-semibold">{item.product_title}</span>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <span className="text-ds-muted-foreground text-sm">{item.variant_title}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <CartItemQuantitySelector item={item} fields={fields} />

        <div className="text-end">
          <LineItemPrice item={item} currencyCode={cart.currency_code} />
        </div>

        <CartDeleteItem item={item} fields={fields} />
      </div>
    </div>
  )
}


interface CartSummaryProps {
  cart: HttpTypes.StoreCart
}

export const CartSummary = ({ cart }: CartSummaryProps) => {
  if ("isOptimistic" in cart && cart.isOptimistic) {
    return <Loading />
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-ds-muted-foreground">Subtotal</span>
          <Price
            price={cart.subtotal}
            currencyCode={cart.currency_code}
            className="text-ds-muted-foreground"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-ds-muted-foreground">Shipping</span>
          <Price
            price={cart.shipping_total}
            currencyCode={cart.currency_code}
            className="text-ds-muted-foreground"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-ds-muted-foreground">Discount</span>
          <Price
            price={cart.discount_total}
            currencyCode={cart.currency_code}
            type="discount"
            className="text-ds-muted-foreground"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-ds-muted-foreground">Tax</span>
          <Price
            price={cart.tax_total}
            currencyCode={cart.currency_code}
            className="text-ds-muted-foreground"
          />
        </div>
      </div>

      <hr className="bg-ds-muted" />

      <div className="flex justify-between text-sm">
        <span className="text-ds-foreground">Total</span>
        <Price price={cart.total} currencyCode={cart.currency_code} className="text-ds-foreground" />
      </div>
    </div>
  )
}


type CartPromoProps = {
  cart: HttpTypes.StoreCart
}

export const CartPromo = ({ cart }: CartPromoProps) => {
  const [showInput, setShowInput] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const applyPromoCodeMutation = useApplyPromoCode()
  const removePromoCodeMutation = useRemovePromoCode()

  const handleRemove = (code: string) => {
    removePromoCodeMutation.mutate(
      { code },
      {
        onError: (_error) => {
        },
      }
    )
  }

  const handleApply = () => {
    applyPromoCodeMutation.mutate(
      { code: promoCode },
      {
        onSuccess: () => {
          setShowInput(false)
          setPromoCode("")
        },
        onError: () => {
        },
      }
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(cart.promotions?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-2">
          {(cart.promotions || []).map((promotion) => (
            <Button key={promotion.code} variant="secondary" size="fit">
              {promotion.code}
              <XMark
                onClick={() => handleRemove(promotion.code || "")}
                className="ms-2 text-ds-muted-foreground hover:text-ds-muted-foreground cursor-pointer"
              />
            </Button>
          ))}
        </div>
      )}

      {!showInput && (
        <Button
          onClick={() => setShowInput(true)}
          variant="transparent"
          className="text-ds-muted-foreground p-0 underline hover:bg-transparent hover:text-ds-muted-foreground"
          size="fit"
        >
          Add promo code
        </Button>
      )}

      {showInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Enter promo code"
            name="promoCode"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <Button onClick={handleApply} variant="primary" size="fit">
            Apply
          </Button>
          <Button onClick={() => setShowInput(false)} variant="secondary" size="fit">
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}


export const CartEmpty = () => {
  const prefix = useTenantPrefix()

  return (
    <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
      <h2 className="text-lg font-bold text-ds-foreground">Your cart is empty</h2>
      <p className="text-ds-muted-foreground text-base font-medium">Start by adding some products</p>
      <Link to={`${prefix}/store` as any}>
        <Button variant="primary" size="fit">
          Continue shopping
        </Button>
      </Link>
    </div>
  )
}


export const DEFAULT_CART_DROPDOWN_FIELDS = "id, *items, total, currency_code"

export const CartDropdown = () => {
  const { isOpen, openCart, closeCart } = useCartDrawer()
  const { data: cart } = useCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const prefix = useTenantPrefix()

  const sortedItems = sortCartItems(cart?.items || [])
  const itemCount = sortedItems?.reduce((total, item) => total + item.quantity, 0) || 0

  return (
    <Drawer open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <DrawerTrigger asChild>
        <button className="text-ds-muted-foreground hover:text-ds-muted-foreground h-full">
          Cart ({itemCount})
        </button>
      </DrawerTrigger>

      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerTitle>Shopping Cart</DrawerTitle>
        </DrawerHeader>

        {/* Empty Cart */}
        {(!cart || itemCount === 0) && (
          <div className="flex flex-col items-center justify-center flex-1 p-6">
            <span className="text-base font-medium text-ds-muted-foreground mb-4">
              Your cart is empty
            </span>
            <Link to={`${prefix}/store` as any} onClick={closeCart}>
              <Button variant="secondary" size="fit">
                Explore products
              </Button>
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {cart && itemCount > 0 && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {sortedItems?.map((item) => (
                <CartLineItem
                  key={item.id}
                  item={item}
                  cart={cart}
                  type="compact"
                  fields={DEFAULT_CART_DROPDOWN_FIELDS}
                />
              ))}
            </div>

            <DrawerFooter>
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-medium text-ds-muted-foreground">Subtotal</span>
                <Price price={cart.total} currencyCode={cart.currency_code} />
              </div>

              <Link to={`${prefix}/cart` as any} onClick={closeCart}>
                <Button className="w-full" variant="primary">
                  Go to cart
                </Button>
              </Link>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

export default CartLineItem
