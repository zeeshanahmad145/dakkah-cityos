import ProductPrice from "@/components/product-price"
import { Thumbnail } from "@/components/ui/thumbnail"
import { useTenantPrefix } from "@/lib/context/tenant-context"
import { HttpTypes } from "@medusajs/types"
import { Link } from "@tanstack/react-router"

interface ProductCardProps {
  product: HttpTypes.StoreProduct
}

const ProductCard = ({ product }: ProductCardProps) => {
  const prefix = useTenantPrefix()

  return (
    <Link
      to={`${prefix}/products/${product.handle}` as never}
      className="group flex flex-col w-full"
    >
      <div className="aspect-[29/34] w-full overflow-hidden bg-ds-muted relative">
        <Thumbnail
          thumbnail={product.thumbnail}
          alt={product.title}
          className="absolute inset-0 object-cover object-center w-full h-full"
        />
      </div>

      <div className="flex text-base font-medium mt-4 justify-between">
        <span className="text-ds-foreground">{product.title}</span>
        <ProductPrice
          product={product}
          variant={product.variants?.[0]}
          className="text-ds-muted-foreground"
        />
      </div>
    </Link>
  )
}

export default ProductCard
