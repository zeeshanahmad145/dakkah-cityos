import { createFileRoute, Link } from "@tanstack/react-router"
import { t } from "@/lib/i18n"
import { useFlashSales } from "@/lib/hooks/use-campaigns"
import { FlashSaleCard } from "@/components/campaigns/flash-sale-card"
import { CountdownTimer } from "@/components/campaigns/countdown-timer"

export const Route = createFileRoute("/$tenant/$locale/flash-sales")({
  component: FlashSalesPage,
  head: () => ({
    meta: [
      { title: "Flash Sales | Dakkah CityOS" },
      { name: "description", content: "Browse flash sales on Dakkah CityOS" },
    ],
  }),
})

function FlashSalesPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const { data, isLoading, error } = useFlashSales()

  const nextEnding = data?.flash_sales?.reduce(
    (earliest, sale) => {
      const endsAt = new Date(sale.ends_at!)
      return !earliest || endsAt < earliest ? endsAt : earliest
    },
    null as Date | null,
  )

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-ds-destructive text-ds-destructive-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 text-sm opacity-80 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:opacity-100 transition-opacity"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span>
              {t(locale, "flashSales.badge_flash_sales", "Flash Sales")}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Flash Sales
              </h1>
              <p className="mt-2 opacity-80">
                Limited time offers — grab them before they're gone!
              </p>
            </div>
            {nextEnding && (
              <div className="bg-ds-card/10 rounded-lg px-6 py-4">
                <p className="text-xs opacity-80 mb-2 text-center">
                  Next sale ends in
                </p>
                <CountdownTimer
                  endsAt={nextEnding.toISOString()}
                  variant="segmented"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-ds-destructive/10 border border-ds-destructive/20 rounded-xl p-8 text-center">
            <p className="text-ds-destructive">Failed to load flash sales</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-ds-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : !data?.flash_sales?.length ? (
          <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
            <svg
              className="w-12 h-12 text-ds-muted-foreground mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <p className="text-ds-muted-foreground">
              No flash sales active right now
            </p>
            <p className="text-sm text-ds-muted-foreground mt-1">
              Check back soon for amazing deals!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.flash_sales.map((sale) => (
              <FlashSaleCard key={sale.id} sale={sale} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
