import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { StoreCreditBalance } from "@/components/payments/store-credits/store-credit-balance"
import { StoreCreditHistory } from "@/components/payments/store-credits/store-credit-history"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"

export const Route = createFileRoute("/$tenant/$locale/account/store-credits")({
  component: StoreCreditsPage,
})

function StoreCreditsPage() {
  const { tenant, locale } = Route.useParams() as { tenant: string; locale: string }
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-ds-muted flex items-center justify-center">
        <p className="text-sm text-ds-muted-foreground">{t(locale, "common.loading")}</p>
      </div>
    )
  }

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ds-foreground">{t(locale, "storeCredits.title")}</h1>
          <p className="text-sm text-ds-muted-foreground mt-1">{t(locale, "storeCredits.subtitle")}</p>
        </div>

        <StoreCreditBalance
          balance={0}
          currency="USD"
          locale={locale}
        />

        <div>
          <h2 className="text-lg font-semibold text-ds-foreground mb-4">{t(locale, "storeCredits.transaction_history")}</h2>
          <StoreCreditHistory
            transactions={[]}
            currency="USD"
            locale={locale}
          />
        </div>
      </div>
    </AccountLayout>
  )
}
