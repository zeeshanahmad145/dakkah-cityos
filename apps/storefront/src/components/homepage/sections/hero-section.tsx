import { Link } from "@tanstack/react-router"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface HeroSectionProps {
  config: Record<string, any>
}

export function HeroSection({ config }: HeroSectionProps) {
  const prefix = useTenantPrefix()
  return (
    <section className="relative bg-ds-primary text-ds-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {config.title || "Welcome to Our Store"}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-ds-muted-foreground">
            {config.subtitle ||
              "Discover amazing products at great prices. Quality guaranteed."}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to={`${prefix}/store` as never}
              className="inline-flex items-center justify-center px-8 py-3 bg-ds-background text-ds-foreground font-medium rounded-md hover:bg-ds-muted transition-colors"
            >
              Shop Now
            </Link>
            <Link
              to={`${prefix}/store` as never}
              className="inline-flex items-center justify-center px-8 py-3 border border-white text-ds-primary-foreground font-medium rounded-md hover:bg-ds-muted/10 transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
