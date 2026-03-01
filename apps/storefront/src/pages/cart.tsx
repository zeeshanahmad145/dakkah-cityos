import { useEffect, useRef } from "react"
import {
  CartLineItem,
  CartSummary,
  CartEmpty,
  CartPromo,
} from "@/components/cart"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { useCart, useCreateCart } from "@/lib/hooks/use-cart"
import { useRegion } from "@/lib/hooks/use-regions"
import { sortCartItems } from "@/lib/utils/cart"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { Link, useParams } from "@tanstack/react-router"

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "us",
  fr: "fr",
  ar: "sa",
}

const DEFAULT_CART_FIELDS =
  "id, *items, total, currency_code, subtotal, shipping_total, discount_total, tax_total, *promotions"

const Cart = () => {
  const { locale } = useParams({ strict: false }) as { locale: string }
  const countryCode = LOCALE_TO_COUNTRY[locale?.toLowerCase()] || "us"
  const { data: region } = useRegion({ country_code: countryCode })
  const prefix = useTenantPrefix()
  const { data: cart, isLoading: cartLoading } = useCart({
    fields: DEFAULT_CART_FIELDS,
  })
  const createCartMutation = useCreateCart()
  const cartCreationAttempted = useRef(false)

  useEffect(() => {
    if (
      !cart &&
      !cartLoading &&
      !createCartMutation.isPending &&
      region?.id &&
      !cartCreationAttempted.current
    ) {
      cartCreationAttempted.current = true
      createCartMutation.mutate({ region_id: region.id })
    }
  }, [cart, cartLoading, region?.id, createCartMutation.isPending])

  const cartItems = sortCartItems(cart?.items || [])

  return (
    <div className="content-container py-12">
      {cartLoading ? (
        <Loading />
      ) : cartItems.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="space-y-6 w-full md:w-2/3">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-zinc-900 text-xl">Cart</h1>
              {cartItems.length > 0 && (
                <Link
                  to={`${prefix}/store` as never}
                  className="text-zinc-600 hover:text-zinc-500 text-sm underline"
                >
                  Continue shopping
                </Link>
              )}
            </div>
            {cartItems.map((item, index) => (
              <div key={item.id}>
                <CartLineItem
                  item={item}
                  cart={cart!}
                  fields={DEFAULT_CART_FIELDS}
                />
                {index < cartItems.length - 1 && (
                  <hr className="bg-zinc-200 mt-6" />
                )}
              </div>
            ))}
          </div>

          {cart && (
            <div className="flex flex-col gap-y-8 w-full md:w-1/3">
              <div>
                <h2 className="text-zinc-900 text-xl">Cart Summary</h2>
              </div>

              <div className="flex flex-col gap-y-4">
                <CartSummary cart={cart} />

                <CartPromo cart={cart} />
              </div>

              <Link to={`${prefix}/checkout` as never}>
                <Button className="w-full">Checkout</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Cart
