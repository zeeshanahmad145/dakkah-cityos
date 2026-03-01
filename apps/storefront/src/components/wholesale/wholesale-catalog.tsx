import { useState } from "react"
import { t, formatCurrency, type SupportedLocale } from "@/lib/i18n"
import { useTenant } from "@/lib/context/tenant-context"

interface WholesaleProduct {
  id: string
  sku: string
  name: string
  image?: string
  basePrice: number
  currency?: string
  minOrder: number
  category?: string
  inStock: boolean
}

interface WholesaleCatalogProps {
  locale?: string
  products: WholesaleProduct[]
  onAddToOrder?: (productId: string, quantity: number) => void
}

export function WholesaleCatalog({ locale: localeProp, products, onAddToOrder }: WholesaleCatalogProps) {
  const { locale: ctxLocale } = useTenant()
  const locale = localeProp || ctxLocale || "en"
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const setQuantity = (id: string, qty: number) => {
    setQuantities({ ...quantities, [id]: qty })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ds-foreground">
            {t(locale, "wholesale.b2b_catalog")}
          </h2>
          <p className="text-sm text-ds-muted-foreground mt-0.5">
            {t(locale, "wholesale.catalog_description")}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <svg className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t(locale, "marketplace.search_placeholder")}
            className="w-full ps-10 pe-4 py-2 rounded-lg border border-ds-border bg-ds-card text-ds-foreground text-sm placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
          />
        </div>
      </div>

      <div className="bg-ds-card rounded-lg border border-ds-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ds-border bg-ds-muted/50">
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                  {t(locale, "wholesale.sku")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider" colSpan={2}>
                  Product
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                  {t(locale, "wholesale.unit_price")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                  {t(locale, "wholesale.min_order")}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium text-ds-muted-foreground uppercase tracking-wider">
                  {t(locale, "wholesale.quantity")}
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const qty = quantities[product.id] || product.minOrder
                return (
                  <tr key={product.id} className="border-b border-ds-border last:border-b-0 hover:bg-ds-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-ds-muted-foreground">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3" colSpan={2}>
                      <div className="flex items-center gap-3">
                        {product.image && (
                          <div className="w-10 h-10 rounded bg-ds-muted overflow-hidden flex-shrink-0">
                            <img loading="lazy" src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-ds-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-ds-foreground">
                        {formatCurrency((product.basePrice ?? 0), product.currency, locale as SupportedLocale)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-ds-muted-foreground">{product.minOrder}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={product.minOrder}
                        value={qty}
                        onChange={(e) => setQuantity(product.id, Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))}
                        className="w-20 px-2 py-1 rounded border border-ds-border bg-ds-background text-ds-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
                        disabled={!product.inStock}
                      />
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => onAddToOrder?.(product.id, qty)}
                        disabled={!product.inStock}
                        className="px-3 py-1.5 bg-ds-primary text-ds-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {t(locale, "wholesale.bulk_order")}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
