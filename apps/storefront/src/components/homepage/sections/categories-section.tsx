import { Link } from "@tanstack/react-router"

interface Category {
  id: string
  name: string
  handle: string
  description?: string
  metadata?: {
    image?: string
  }
}

interface CategoriesSectionProps {
  tenantPrefix: string
  categories: Category[]
  config: Record<string, any>
}

export function CategoriesSection({
  tenantPrefix,
  categories,
  config,
}: CategoriesSectionProps) {
  if (categories.length === 0) return null

  return (
    <section className="py-16 bg-ds-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">
            {config.title || "Shop by Category"}
          </h2>
          <p className="mt-4 text-ds-muted-foreground">
            {config.subtitle || "Browse our collections"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`${tenantPrefix}/categories/${category.handle}` as never}
              className="group"
            >
              <div className="aspect-square bg-ds-background rounded-lg shadow-sm overflow-hidden mb-3 group-hover:shadow-md transition-shadow">
                {category.metadata?.image ? (
                  <img
                    src={category.metadata.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-ds-muted">
                    <span className="text-4xl">{category.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <h3 className="text-center font-medium text-ds-foreground group-hover:text-ds-muted-foreground">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
