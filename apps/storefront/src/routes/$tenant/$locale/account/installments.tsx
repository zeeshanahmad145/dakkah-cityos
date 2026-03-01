import { createFileRoute } from "@tanstack/react-router"
import { AccountLayout } from "@/components/account"
import { InstallmentPlanCard } from "@/components/payments/installments/installment-plan-card"
import { InstallmentSchedule } from "@/components/payments/installments/installment-schedule"
import { InstallmentCalculator } from "@/components/payments/installments/installment-calculator"
import { t } from "@/lib/i18n"
import { useState, useEffect } from "react"
import { clsx } from "clsx"

export const Route = createFileRoute("/$tenant/$locale/account/installments")({
  component: InstallmentsPage,
})

type TabView = "active" | "completed" | "calculator"

function InstallmentsPage() {
  const { tenant, locale } = Route.useParams() as { tenant: string; locale: string }
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabView>("active")

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

  const tabs: { key: TabView; label: string }[] = [
    { key: "active", label: t(locale, "installments.active_plans") },
    { key: "completed", label: t(locale, "installments.completed_plans") },
    { key: "calculator", label: t(locale, "installments.calculator") },
  ]

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ds-foreground">{t(locale, "installments.title")}</h1>
          <p className="text-sm text-ds-muted-foreground mt-1">{t(locale, "installments.subtitle")}</p>
        </div>

        <div className="flex gap-2 border-b border-ds-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.key
                  ? "border-ds-primary text-ds-primary"
                  : "border-transparent text-ds-muted-foreground hover:text-ds-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "active" && (
          <div className="space-y-4">
            <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
                <span className="text-xl text-ds-muted-foreground">📋</span>
              </div>
              <p className="text-ds-muted-foreground">{t(locale, "installments.no_active")}</p>
            </div>
          </div>
        )}

        {activeTab === "completed" && (
          <div className="space-y-4">
            <div className="bg-ds-background rounded-lg border border-ds-border p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-ds-muted flex items-center justify-center mx-auto mb-4">
                <span className="text-xl text-ds-muted-foreground">✓</span>
              </div>
              <p className="text-ds-muted-foreground">{t(locale, "installments.no_completed")}</p>
            </div>
          </div>
        )}

        {activeTab === "calculator" && (
          <InstallmentCalculator
            total={500}
            currency="USD"
            availablePlans={[3, 6, 9, 12]}
            interestRates={{ 3: 0, 6: 2, 9: 4, 12: 6 }}
            locale={locale}
          />
        )}
      </div>
    </AccountLayout>
  )
}
