// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { t } from "@/lib/i18n"

export const Route = createFileRoute("/$tenant/$locale/wallet/")({
  component: WalletPage,
  head: () => ({
    meta: [
      { title: "Wallet | Dakkah CityOS" },
      { name: "description", content: "Manage your wallet on Dakkah CityOS" },
    ],
  }),
  loader: async () => {
    try {
      const features = [
        {
          id: "1",
          name: "Top Up",
          description:
            "Add funds to your wallet instantly via card, bank transfer, or Apple Pay.",
          icon: "plus-circle",
          color: "emerald",
        },
        {
          id: "2",
          name: "Send Money",
          description:
            "Transfer funds to friends, family, or other wallet users seamlessly.",
          icon: "arrow-right",
          color: "blue",
        },
        {
          id: "3",
          name: "Transaction History",
          description:
            "View detailed records of all your deposits, withdrawals, and transfers.",
          icon: "clock",
          color: "purple",
        },
        {
          id: "4",
          name: "Rewards",
          description:
            "Earn cashback and loyalty points on every transaction you make.",
          icon: "star",
          color: "amber",
        },
        {
          id: "5",
          name: "Linked Cards",
          description:
            "Connect your debit or credit cards for quick top-ups and payments.",
          icon: "credit-card",
          color: "rose",
        },
        {
          id: "6",
          name: "Bill Payments",
          description:
            "Pay utility bills, subscriptions, and services directly from your wallet.",
          icon: "document",
          color: "teal",
        },
      ]
      const transactions = [
        {
          id: "t1",
          description: "Top Up via Visa •••4521",
          type: "credit",
          amount: 500,
          created_at: "2026-02-14T10:30:00Z",
        },
        {
          id: "t2",
          description: "Purchase at Electronics Store",
          type: "debit",
          amount: 129.99,
          created_at: "2026-02-13T15:20:00Z",
        },
        {
          id: "t3",
          description: "Cashback Reward",
          type: "credit",
          amount: 12.5,
          created_at: "2026-02-12T09:00:00Z",
        },
        {
          id: "t4",
          description: "Transfer to Ahmed M.",
          type: "debit",
          amount: 200,
          created_at: "2026-02-11T14:45:00Z",
        },
        {
          id: "t5",
          description: "Refund - Order #8821",
          type: "credit",
          amount: 75,
          created_at: "2026-02-10T11:15:00Z",
        },
      ]
      return { features, transactions, balance: 1258.51, currency: "SAR" }
    } catch {
      return { features: [], transactions: [], balance: 0, currency: "SAR" }
    }
  },
})

function WalletPage() {
  const { tenant, locale } = Route.useParams()
  const prefix = `/${tenant}/${locale}`
  const [searchQuery, setSearchQuery] = useState("")
  const data = Route.useLoaderData()
  const features = data?.features || []
  const transactions = data?.transactions || []
  const balance = data?.balance || 0

  const filteredFeatures = features.filter((f: any) =>
    searchQuery
      ? f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  )

  const iconMap: Record<string, string> = {
    "plus-circle":
      "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
    "arrow-right": "M13 7l5 5m0 0l-5 5m5-5H6",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    "credit-card":
      "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    document:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  }

  const colorMap: Record<string, string> = {
    emerald: "from-ds-success to-ds-success",
    blue: "from-ds-primary to-ds-primary",
    purple: "from-ds-primary to-ds-primary",
    amber: "from-ds-warning to-ds-warning",
    rose: "from-rose-500 to-rose-600",
    teal: "from-ds-success to-ds-success",
  }

  return (
    <div className="min-h-screen bg-ds-background">
      <div className="bg-gradient-to-r from-ds-success to-ds-success text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link
              to={`${prefix}` as never}
              className="hover:text-white transition-colors"
            >
              {t(locale, "common.home")}
            </Link>
            <span>/</span>
            <span className="text-white">Wallet</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t(locale, "wallet.title")}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {t(locale, "wallet.subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
            <span>
              {t(locale, "wallet.badge_instant_transfers", "Instant transfers")}
            </span>
            <span>|</span>
            <span>
              {t(locale, "wallet.badge_secure_payments", "Secure payments")}
            </span>
            <span>|</span>
            <span>
              {t(locale, "wallet.badge_cashback", "Cashback rewards")}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-ds-success/10 to-ds-success/5 border border-ds-success/20 rounded-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ds-muted-foreground mb-1">
                Available Balance
              </p>
              <p className="text-4xl font-bold text-ds-foreground">
                {balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                SAR
              </p>
            </div>
            <button className="px-6 py-3 bg-ds-success text-white font-medium rounded-lg hover:bg-ds-success/90 transition-colors">
              {t(locale, "wallet.add_funds")}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(locale, "wallet.search_placeholder")}
            className="w-full max-w-md px-4 py-2.5 text-sm rounded-lg border border-ds-border bg-ds-background text-ds-foreground placeholder:text-ds-muted-foreground focus:outline-none focus:ring-2 focus:ring-ds-success"
          />
        </div>

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          Wallet Features
        </h2>
        {filteredFeatures.length === 0 ? (
          <div className="bg-ds-background border border-ds-border rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 text-ds-muted-foreground/30 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-ds-foreground mb-2">
              {t(locale, "wallet.no_results")}
            </h3>
            <p className="text-ds-muted-foreground text-sm">
              {t(locale, "verticals.try_adjusting")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredFeatures.map((f: any) => (
              <div
                key={f.id}
                className="group bg-ds-background border border-ds-border rounded-xl p-6 hover:shadow-lg hover:border-ds-success/40 transition-all duration-200"
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorMap[f.color] || colorMap.emerald} flex items-center justify-center mb-4`}
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={iconMap[f.icon] || iconMap["plus-circle"]}
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-ds-foreground mb-2 group-hover:text-ds-success transition-colors">
                  {f.name}
                </h3>
                <p className="text-sm text-ds-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-bold text-ds-foreground mb-6">
          Recent Transactions
        </h2>
        <div className="space-y-2 mb-12">
          {transactions.map((tx: any) => (
            <div
              key={tx.id}
              className="bg-ds-background border border-ds-border rounded-xl p-4 flex items-center justify-between hover:border-ds-success/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${tx.type === "credit" ? "bg-ds-success/15 text-ds-success" : "bg-ds-destructive/15 text-ds-destructive"}`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                </div>
                <div>
                  <p className="font-medium text-ds-foreground">
                    {tx.description}
                  </p>
                  <p className="text-xs text-ds-muted-foreground">
                    {new Date(tx.created_at!).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <span
                className={`text-lg font-semibold ${tx.type === "credit" ? "text-ds-success" : "text-ds-destructive"}`}
              >
                {tx.type === "credit" ? "+" : "-"}
                {tx.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                SAR
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="py-16 bg-ds-card border-t border-ds-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ds-foreground text-center mb-12">
            {t(locale, "verticals.how_it_works")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Create Your Wallet
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Sign up and set up your digital wallet in under a minute.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Add Funds
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Top up your wallet via bank card, transfer, or Apple Pay.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ds-success text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold text-ds-foreground mb-2">
                Pay & Earn
              </h3>
              <p className="text-sm text-ds-muted-foreground">
                Use your wallet for purchases and earn cashback on every
                transaction.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
