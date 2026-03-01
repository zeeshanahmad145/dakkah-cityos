import { Link } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"

interface SearchSuggestionsProps {
  suggestions: HttpTypes.StoreProduct[]
  tenantPrefix: string
  onSelect: () => void
}

export function SearchSuggestions({
  suggestions,
  tenantPrefix,
  onSelect,
}: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="absolute top-full inset-x-0 mt-2 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-lg overflow-hidden z-50">
      <div className="p-2">
        <p className="text-xs text-ui-fg-muted px-2 py-1">Suggestions</p>
        <ul>
          {suggestions.map((product) => (
            <li key={product.id}>
              <Link
                to={`${tenantPrefix}/products/${product.handle}` as never}
                onClick={onSelect}
                className="flex items-center gap-3 p-2 hover:bg-ui-bg-base-hover rounded-md transition-colors"
              >
                {product.thumbnail && (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <span className="text-sm text-ui-fg-base">{product.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
