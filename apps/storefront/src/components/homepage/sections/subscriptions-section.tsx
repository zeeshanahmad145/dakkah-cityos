import { Link } from "@tanstack/react-router"
import { CheckCircleSolid } from "@medusajs/icons"
import { useTenantPrefix } from "@/lib/context/tenant-context"

interface SubscriptionsSectionProps {
  config: Record<string, any>
}

export function SubscriptionsSection({ config }: SubscriptionsSectionProps) {
  const prefix = useTenantPrefix()
  return (
    <section className="py-16 bg-gradient-to-r from-ds-primary to-ds-primary text-ds-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-ds-background/20 rounded-full px-4 py-2 mb-6">
              <span className="text-lg">&#x21BB;</span>
              <span className="text-sm font-medium">Subscribe & Save</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {config.title || "Never Run Out Again"}
            </h2>
            <p className="text-lg text-ds-primary-foreground/90 mb-8">
              {config.subtitle ||
                "Set up a subscription for your favorite products and enjoy automatic deliveries at a discounted price."}
            </p>
            <ul className="space-y-3 mb-8">
              {(
                config.benefits || [
                  "Save up to 15% on every order",
                  "Free shipping on all subscriptions",
                  "Pause or cancel anytime",
                  "Flexible delivery schedules",
                ]
              ).map((benefit: string, index: number) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircleSolid className="h-5 w-5 text-ds-success" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Link
              to={`${prefix}/subscriptions` as never}
              className="inline-flex items-center justify-center px-8 py-3 bg-ds-background text-ds-primary font-medium rounded-md hover:bg-ds-muted transition-colors"
            >
              Explore Subscriptions
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="bg-ds-background/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">15%</div>
                <div className="text-xl">Off Every Order</div>
                <div className="mt-4 text-ds-primary-foreground/70">
                  When you subscribe
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
